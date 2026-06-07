import WebSocket from 'ws';
import { normalize } from '../normalize.js';

// Twitch chat via anonymous IRC-over-WebSocket — no token, no API key, free.
const TWITCH_WS = 'wss://irc-ws.chat.twitch.tv:443';

export function connect({ source, onMessage, onStatus }) {
  const channel = String(source.handle || '').trim().toLowerCase().replace(/^#/, '');
  let ws = null;
  let stopped = false;
  let backoff = 1000;
  let timer = null;

  function open() {
    if (stopped) return;
    onStatus?.('connecting', `#${channel}`);
    ws = new WebSocket(TWITCH_WS);
    ws.on('open', () => {
      ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands\r\n');
      ws.send(`NICK justinfan${(Math.random() * 80000 + 1000) | 0}\r\n`);
      ws.send(`JOIN #${channel}\r\n`);
    });
    ws.on('message', (data) => {
      for (const line of data.toString().split('\r\n')) {
        if (!line) continue;
        if (line.startsWith('PING')) { ws.send('PONG :tmi.twitch.tv\r\n'); continue; }
        if (line.includes(' 366 ') || line.includes(' JOIN ')) { onStatus?.('ok', `#${channel}`); backoff = 1000; continue; }
        if (!line.includes('PRIVMSG')) continue;
        const parsed = parse(line);
        if (parsed) onMessage(normalize({ host: source.host, platform: source.platform, ...parsed }));
      }
    });
    ws.on('close', reconnect);
    ws.on('error', (e) => onStatus?.('error', e.message || 'socket error'));
  }

  function reconnect() {
    if (stopped) return;
    onStatus?.('disconnected', `retry ${Math.round(backoff / 1000)}s`);
    timer = setTimeout(() => { backoff = Math.min(backoff * 2, 15000); open(); }, backoff);
  }

  if (!channel) onStatus?.('error', 'no channel');
  else open();

  return { close() { stopped = true; clearTimeout(timer); try { ws?.close(); } catch { /* */ } } };
}

function parse(line) {
  let tags = {};
  let rest = line;
  if (line.startsWith('@')) {
    const sp = line.indexOf(' ');
    for (const pair of line.slice(1, sp).split(';')) {
      const eq = pair.indexOf('=');
      if (eq !== -1) tags[pair.slice(0, eq)] = pair.slice(eq + 1);
    }
    rest = line.slice(sp + 1);
  }
  const pi = rest.indexOf(' PRIVMSG ');
  if (pi === -1) return null;
  const after = rest.slice(pi + 9);
  const ti = after.indexOf(' :');
  if (ti === -1) return null;
  let user = tags['display-name'];
  if (!user && rest.startsWith(':')) user = rest.slice(1, rest.indexOf('!'));
  return { user, text: after.slice(ti + 2).replace(/[]/g, '').trim() };
}
