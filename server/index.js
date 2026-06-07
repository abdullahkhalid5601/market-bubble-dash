import 'dotenv/config';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { WebSocketServer } from 'ws';
import { hosts, platforms, sources, sourceId } from './config.js';
import { liveAdapters } from './adapters/index.js';
import * as mock from './adapters/mock.js';
import * as replay from './adapters/replay.js';
import { createRecorder } from './record.js';
import { getTwitchStatus, getTwitchStream, twitchApiConfigured } from './twitchApi.js';
import { getKickStatus, kickApiConfigured } from './kickApi.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.GATEWAY_PORT || 8787;
let MODE = process.env.FEED_MODE || 'mock'; // mock | replay | live — switchable at runtime
const DIST = path.join(__dirname, '..', 'dist');

const app = express();
app.use(express.static(DIST));
app.get('/api/health', (_req, res) => res.json({ ok: true, mode: MODE }));
app.get('*', (_req, res) =>
  res.sendFile(path.join(DIST, 'index.html'), (e) => {
    if (e) res.status(200).send('Market Bubble gateway running. Run `npm run dev` for the client.');
  })
);

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// ---- fan-out hub ----------------------------------------------------------
const clients = new Set();
const recorder = process.env.RECORD === '1' && MODE === 'live' ? createRecorder() : null;
const history = []; // last N messages, replayed to clients that join mid-stream
const HISTORY = 60;

function broadcast(msg) {
  if (recorder) recorder.write(msg);
  history.push(msg);
  if (history.length > HISTORY) history.shift();
  const frame = JSON.stringify({ type: 'message', data: msg });
  for (const c of clients) {
    if (c.readyState === c.OPEN) c.send(frame);
  }
}

// Snapshot of the configured sources for the UI's LIVE/REPLAY + filters.
const sourcesMeta = sources.map((s) => ({ id: sourceId(s), host: s.host, platform: s.platform, handle: s.handle }));

// Per-source state + live viewer counts, pushed to every client.
const statuses = {};
function emitStatus(id) {
  const st = statuses[id] || {};
  const frame = JSON.stringify({ type: 'sourceStatus', id, state: st.state || '', detail: st.detail || '', viewers: st.viewers, uptime: st.uptime, videoId: st.videoId });
  for (const c of clients) if (c.readyState === c.OPEN) c.send(frame);
}
function setStatus(id, state, detail) {
  statuses[id] = { ...statuses[id], state, detail: detail || '' };
  emitStatus(id);
}
function setViewers(id, viewers, uptime) {
  statuses[id] = { ...statuses[id], viewers, uptime };
  emitStatus(id);
}

// Mutable mock config — the Tweaks panel steers this via control messages.
const mockCfg = { cadenceMs: 1100, biasHost: null, biasUntil: 0 };

function broadcastRaw(obj) {
  const frame = JSON.stringify(obj);
  for (const c of clients) if (c.readyState === c.OPEN) c.send(frame);
}

wss.on('connection', (socket) => {
  clients.add(socket);
  socket.send(JSON.stringify({ type: 'status', mode: MODE, sources: sourcesMeta, hosts, platforms }));
  for (const [id, st] of Object.entries(statuses)) socket.send(JSON.stringify({ type: 'sourceStatus', id, ...st }));
  for (const msg of history) socket.send(JSON.stringify({ type: 'message', data: msg }));

  socket.on('message', (raw) => {
    let m;
    try { m = JSON.parse(raw.toString()); } catch { return; }

    // Native dashboard chat — a viewer comments from Market Bubble itself; we
    // broadcast it to every connected dashboard in real time (the shared chat).
    if (m.type === 'chat') {
      const text = String(m.text || '').replace(/\s+/g, ' ').trim().slice(0, 300);
      if (!text) return;
      const user = String(m.user || 'guest').trim().slice(0, 24) || 'guest';
      broadcast({ id: `mb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, host: 'house', platform: 'mb', user, text, ts: Date.now() });
      return;
    }

    if (m.type !== 'control') return;
    if (m.action === 'setMode' && ['mock', 'replay', 'live'].includes(m.mode)) {
      bootMode(m.mode);
    } else if (m.action === 'cadence' && Number.isFinite(m.value)) {
      mockCfg.cadenceMs = Math.max(120, Math.min(3500, 1000 / m.value));
    } else if (m.action === 'spike' && (m.host === 'banks' || m.host === 'ansem')) {
      mockCfg.biasHost = m.host;
      mockCfg.biasUntil = Date.now() + 6000;
    }
  });

  socket.on('close', () => clients.delete(socket));
  socket.on('error', () => clients.delete(socket));
});

// ---- adapters per mode (switchable at runtime) ----------------------------
let handles = [];
let viewerTimers = [];

function onStatusFor(id) {
  return (state, detail) => {
    setStatus(id, state, detail);
    console.log(`[${id}] ${state}${detail ? ' — ' + detail : ''}`);
  };
}

// Real viewer counts (+ Twitch live state) when app creds are configured.
async function pollViewers(s) {
  const id = sourceId(s);
  if (s.platform === 'twitch' && twitchApiConfigured()) {
    const r = await getTwitchStatus(s.handle);
    if (r) { setStatus(id, r.live ? 'live' : 'idle', r.live ? 'broadcasting' : 'stream offline'); setViewers(id, r.viewers, r.startedAt); }
  } else if (s.platform === 'kick' && kickApiConfigured()) {
    const r = await getKickStatus(s.slug);
    if (r) setViewers(id, r.viewers);
  }
}

function teardown() {
  for (const h of handles) { try { h.close(); } catch { /* */ } }
  for (const t of viewerTimers) clearInterval(t);
  handles = [];
  viewerTimers = [];
}

function bootMode(mode) {
  teardown();
  MODE = mode;
  history.length = 0;
  for (const k of Object.keys(statuses)) delete statuses[k];
  broadcastRaw({ type: 'reset' });
  broadcastRaw({ type: 'status', mode: MODE, sources: sourcesMeta, hosts, platforms });
  console.log(`\n=== mode → ${MODE} ===`);

  if (MODE === 'replay') {
    const file = process.env.REPLAY_FILE || path.join(__dirname, '..', 'recordings', 'demo.jsonl');
    for (const s of sources) setStatus(sourceId(s), 'replay', 'replay');
    handles.push(replay.start({ file, onMessage: broadcast, onStatus: (st, d) => console.log(`[replay] ${st} ${d || ''}`) }));
  } else if (MODE === 'live') {
    for (const s of sources) {
      const connect = liveAdapters[s.platform];
      if (!connect) continue;
      handles.push(connect({ source: s, onMessage: broadcast, onStatus: onStatusFor(sourceId(s)) }));
      if ((s.platform === 'twitch' && twitchApiConfigured()) || (s.platform === 'kick' && kickApiConfigured())) {
        pollViewers(s);
        viewerTimers.push(setInterval(() => pollViewers(s), 30000));
      }
    }
  } else {
    for (const s of sources) setStatus(sourceId(s), 'connected', 'mock');
    handles.push(mock.start({ sources, onMessage: broadcast, cfg: mockCfg }));
  }
}

bootMode(MODE);

// Stream-window resolver — always on, independent of the chat feed mode. With
// app creds it makes the center window play the LIVE stream when live and the
// LATEST VOD when offline, and reports real viewer counts for the stats.
let streamTimer = null;
async function resolveStreams() {
  for (const s of sources) {
    const id = sourceId(s);
    if (s.platform === 'twitch' && twitchApiConfigured()) {
      const r = await getTwitchStream(s.handle);
      if (r) { statuses[id] = { ...statuses[id], state: r.live ? 'live' : 'idle', viewers: r.viewers, videoId: r.videoId }; emitStatus(id); }
    } else if (s.platform === 'kick' && kickApiConfigured()) {
      const r = await getKickStatus(s.slug);
      if (r) { statuses[id] = { ...statuses[id], state: r.live ? 'live' : 'idle', viewers: r.viewers }; emitStatus(id); }
    }
  }
}
if (twitchApiConfigured() || kickApiConfigured()) {
  resolveStreams();
  streamTimer = setInterval(resolveStreams, 30000);
  console.log('[stream] resolver active (live / latest-VOD + viewers)');
} else {
  console.log('[stream] no app creds — window uses channel embed (live when live); add creds for VOD + real viewers');
}

server.listen(PORT, () => {
  console.log(`Market Bubble gateway · mode=${MODE} · http://localhost:${PORT} (ws: /ws)`);
});

function shutdown() {
  teardown();
  clearInterval(streamTimer);
  recorder?.close();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
