import WebSocket from 'ws';
import { normalize } from '../normalize.js';
import { getKickLive, kickApiConfigured } from '../kickApi.js';

// Kick chat over its Pusher socket (unofficial, no auth). We also subscribe to
// the channel's event feed to detect TRUE broadcast state — StreamerIsLive /
// StopStreamBroadcast — instead of guessing "live" from chat activity. If Kick
// app creds are set, we additionally seed/refresh the current state from the
// official API (so an already-live stream reads correctly on connect).
const KICK_KEY = process.env.KICK_PUSHER_KEY || '32cbd69e4b950bf97679';
const url = (k) => `wss://ws-us2.pusher.com/app/${k}?protocol=7&client=js&version=8.4.0&flash=false`;

export function connect({ source, onMessage, onStatus }) {
  const chatroomId = String(source.handle || '').trim();
  const channelId = String(source.channelId || '').trim();
  const slug = source.slug;
  let ws = null;
  let stopped = false;
  let backoff = 1000;
  let timer = null;
  let apiTimer = null;
  let live = null; // null = unknown, true = broadcasting, false = offline

  function report() {
    if (live === true) onStatus('live', 'broadcasting');
    else if (live === false) onStatus('idle', 'connected · stream offline');
    else onStatus('idle', 'connected · awaiting live');
  }

  async function pollApi() {
    if (stopped || !kickApiConfigured()) return;
    const state = await getKickLive(slug);
    if (state !== null && state !== live) { live = state; report(); }
  }

  function connectWs() {
    if (stopped) return;
    onStatus('connecting', `chatroom ${chatroomId}`);
    ws = new WebSocket(url(KICK_KEY));
    ws.on('message', (data) => {
      let f;
      try { f = JSON.parse(data.toString()); } catch { return; }

      if (f.event === 'pusher:connection_established') {
        ws.send(JSON.stringify({ event: 'pusher:subscribe', data: { auth: '', channel: `chatrooms.${chatroomId}.v2` } }));
        if (channelId) ws.send(JSON.stringify({ event: 'pusher:subscribe', data: { auth: '', channel: `channel.${channelId}` } }));
        return;
      }
      if (f.event === 'pusher:ping') { ws.send(JSON.stringify({ event: 'pusher:pong', data: {} })); return; }
      if (f.event === 'pusher_internal:subscription_succeeded') {
        backoff = 1000;
        report(); // connected — broadcast state still per `live`
        pollApi(); // seed authoritative state if creds present
        return;
      }

      // True broadcast transitions.
      if (f.event === 'App\\Events\\StreamerIsLive') { live = true; report(); return; }
      if (f.event === 'App\\Events\\StopStreamBroadcast') { live = false; report(); return; }

      // Chat.
      if (f.event === 'App\\Events\\ChatMessageEvent') {
        let p;
        try { p = typeof f.data === 'string' ? JSON.parse(f.data) : f.data; } catch { return; }
        if (p?.content == null) return;
        onMessage(normalize({ host: source.host, platform: source.platform, user: p?.sender?.username, text: p.content }));
      }
    });
    ws.on('close', reconnect);
    ws.on('error', (e) => onStatus('error', e.message || 'socket error'));
  }

  function reconnect() {
    if (stopped) return;
    onStatus('connecting', `retry ${Math.round(backoff / 1000)}s`);
    timer = setTimeout(() => { backoff = Math.min(backoff * 2, 15000); connectWs(); }, backoff);
  }

  if (!/^\d+$/.test(chatroomId)) {
    onStatus('error', 'need numeric chatroom id');
  } else {
    connectWs();
    if (kickApiConfigured()) apiTimer = setInterval(pollApi, 60000); // keep current state honest
  }

  return {
    close() { stopped = true; clearTimeout(timer); clearInterval(apiTimer); try { ws?.close(); } catch { /* */ } },
  };
}
