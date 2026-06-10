# Market Bubble — Unified Live Dashboard

## ▶︎ Live site → **https://market-bubble.onrender.com**

> Hosted on Render's free tier — the first visit may take **~30–60s** to wake
> the server, then it's instant. Use the **Home / Markets / Content** nav up top.

One front page for the *Market Bubble* show (FaZe Banks + Ansem) that merges
**Twitch + Kick + X** chat into a single live feed, alongside the **live stream**,
a real **markets terminal**, and the Market Bubble **content** archive — styled
like a *Wall Street Journal × Apple-designed newspaper* (squircle cards, Playfair
masthead, evening + morning editions). Built for the **$10,000 Vibe Coded Chat
Challenge**.

**What's inside**

- **Home** — unified chat (Twitch/Kick/X, scroll-to-pause like a native client) ·
  the live stream / last-stream VOD playing in-window · live viewer + message stats.
- **Markets** — TradingView ticker + heatmap with a Crypto ⇄ Stocks toggle ·
  real CoinGecko + Twelve Data prices · live Polymarket prediction markets.
- **Content** — a bento grid of Market Bubble tweets & clips; click any clip to
  play it in an in-window liquid-glass video player.

Every chat message is tagged on **two axes** so each host knows whose crowd it
is and where it came from:

- **Host** — Banks / Ansem
- **Platform** — Twitch / Kick / X

The atomic unit is a **source = (host × platform)**. Four are configured:
Twitch·Banks, X·Banks, X·Ansem, Kick·Ansem. Adding a host, platform, or a 5th
source is a **data change in `server/config.js`** — never a code change.

```
[ Twitch ]─┐
[ Kick ]───┤→ gateway (normalize → one shape) ─ws→ [ dashboard clients ]
[ X stub ]─┘     adapters behind a common interface
```

Every adapter emits the same normalized message and nothing else:

```ts
{ id, host, platform, user, text, ts }
```

The frontend contains **zero platform-specific logic** — it only ever sees that
shape.

---

## Quick start

```bash
npm install
npm run dev          # gateway (:8787) + Vite client (:5173)
```

Open **http://localhost:5173**. It streams synthetic chat immediately — no API
keys, no network. That's `mock` mode, and it's what the live demo runs on.

To run the production build from a single process:

```bash
npm run build && npm start    # gateway serves dist/ + /ws on :8787
```

---

## Feed modes

One env flag, `FEED_MODE`, flips the entire system. The frontend never changes.

| Mode | What runs | Use |
| --- | --- | --- |
| `mock` *(default)* | Synthetic CT/degen chat across all four sources, 0.9–1.9s cadence | Offline demo, development |
| `replay` | Streams a recorded `.jsonl` at its original cadence, looping | A real session, captured once, replayed flawlessly on stage |
| `live` | Real adapters per source (Twitch + Kick live; X stub) | Production |

```bash
FEED_MODE=replay npm start    # plays recordings/demo.jsonl
FEED_MODE=live   npm start    # Twitch + Kick real chat; X silent (see below)
```

A `recordings/demo.jsonl` ships so `replay` works out of the box. Regenerate it
with `node scripts/make-demo.js`.

### Record a real session for the demo

```bash
npm run record        # = FEED_MODE=live RECORD=1 node server/index.js
```

This boots the live adapters and appends every incoming message to
`recordings/session-<timestamp>.jsonl`. Point `REPLAY_FILE` at it (or copy it to
`recordings/demo.jsonl`) and you can replay that exact session on stage with zero
network dependency.

---

## The UI

- **Header** — LIVE/REPLAY/MOCK badge (red pulse when live), `MARKET BUBBLE`
  logo, total viewer count, a host legend chip per host, and a **Unified / Split**
  toggle.
- **Chat flow** — a "lyrics" stream: newest message largest/brightest at the
  bottom, older ones shrink and fade upward.
  - **Unified:** one merged column.
  - **Split:** Banks (his Twitch + X) on the left, Ansem (his X + Kick) on the
    right — the "whose chat is whose" power view.
- **Control bar** — play/pause, the four source filter chips, a **stream-sync
  delay** slider (0–15s, buffers chat to line up with broadcast lag), and a
  **hype meter** (Banks vs Ansem message velocity).

---

## Platform notes

- **Twitch (Banks)** — anonymous IRC over WebSocket. Real-time, free, no auth.
- **Kick (Ansem)** — Kick's Pusher WebSocket (unofficial, no auth). The
  channel/event names are Kick-internal; verify them if Kick changes them. Needs
  the numeric **chatroom id** (`ANSEM_KICK_CHATROOM`) — find it in DevTools →
  Network → WS on the channel page (the `chatrooms.NNNNNN.v2` subscribe).
- **X (Banks + Ansem)** — the hard, paid leg, twice. X has no native live chat;
  you'd pull replies to the broadcast post via a filtered stream on
  `conversation_id`. As of 2026 there's **no free tier** — it's pay-per-use at
  roughly **$0.005 per post read**, filtered stream capped at 1 concurrent
  connection with monthly read limits. So the X adapter is a **deliberate stub**:
  it conforms to the interface and stays silent in `live` unless you wire an
  `X_FEED` endpoint (direct API or a third-party X-stream reseller webhook). Use
  mock/replay for X on stage. This is a cost decision, not an oversight.

---

## Project layout

```
server/
  config.js            hosts · platforms · sources  (single source of truth)
  normalize.js         raw → { id, host, platform, user, text, ts }
  index.js             boots adapters per FEED_MODE, broadcasts over /ws
  record.js            captures a live session to .jsonl
  adapters/
    index.js           registry / common interface
    twitch.js  kick.js  x.js   (live)
    mock.js  replay.js          (whole-feed)
web/
  src/App.jsx          state: view, filters, sync-delay, pause, hype
  src/components/       Header · Dashboard · ChatColumn · ControlBar · Background
  src/lib/useChatSocket.js
  src/data/config.js   display colors/labels (mirrors server identity)
recordings/            .jsonl sessions for replay
```

## Adding a 5th source

Edit `server/config.js` only — add `{ host, platform, handle }` to `sources`
(and the host/platform to their maps if new). The gateway, adapters, filters,
and UI pick it up automatically.

## Environment

See `.env.example`. Everything is optional; defaults run a full offline demo.
