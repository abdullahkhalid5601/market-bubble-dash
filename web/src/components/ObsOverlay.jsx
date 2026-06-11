// OBS overlays — transparent browser-source pages for stream scenes.
// They reuse the same live gateway feed as the Watch dashboard (chat / content /
// Polymarket) but render as bare, transparent surfaces with no site nav or
// stream popout, so streamers can drop them straight into OBS as Browser Sources.
//
// Routes (path-based, served by the gateway's SPA catch-all):
//   /obs/chat?source=both&platforms=twitch,kick,x&limit=30&mock=1
//   /obs/news?limit=8&framed=0
//   /obs/polymarket?limit=6&framed=0
import { useEffect, useMemo, useState } from 'react';
import { useChatSocket } from '../lib/useChatSocket.js';
import ChatColumn from './ChatColumn.jsx';
import { PlatformLogo, PolymarketLogo } from './logos.jsx';
import { fmtN, USERNAMES } from '../data/mb.js';

const P = () => new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const intParam = (p, key, dflt) => {
  const v = parseInt(p.get(key), 10);
  return Number.isFinite(v) && v > 0 ? v : dflt;
};
const csv = (s) => (s ? s.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean) : null);
const flag = (p, key) => p.get(key) === '1' || p.get(key) === 'true';

// `source` selects which host's crowd the overlay shows.
const hostsFor = (source) => {
  if (source === 'banks') return new Set(['banks']);
  if (source === 'ansem') return new Set(['ansem']);
  return null; // both / watch-test / default → every host
};

/* ---- mock=1 : client-side sample chat for laying out a scene in OBS ---- */
const MOCK_TEXTS = [
  'LFG 🚀', 'banks cooked', 'wen $10k', 'ansem call?', 'send it', 'chat is this real',
  'view botting arc 😂', 'bullish af', 'GM degens', 'top signal', 'down horrendous', 'MB to the moon',
];
const MOCK_SRC = [['banks', 'twitch'], ['banks', 'x'], ['ansem', 'kick'], ['ansem', 'x']];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
let mockSeq = 0;

function useMockFeed(on) {
  const [feed, setFeed] = useState([]);
  useEffect(() => {
    if (!on) return undefined;
    const tick = () => {
      const [host, platform] = pick(MOCK_SRC);
      setFeed((prev) => [
        ...prev.slice(-80),
        { id: `mock-${++mockSeq}`, host, platform, user: pick(USERNAMES), text: pick(MOCK_TEXTS), ts: Date.now() },
      ]);
    };
    for (let i = 0; i < 10; i++) tick();
    const iv = setInterval(tick, 1100);
    return () => clearInterval(iv);
  }, [on]);
  return feed;
}

/* ---- chat overlay ---- */
function ObsChat({ feed, p }) {
  const source = (p.get('source') || 'both').toLowerCase();
  const plats = csv(p.get('platforms'));
  const limit = intParam(p, 'limit', 30);
  const mock = flag(p, 'mock');
  const mockFeed = useMockFeed(mock);
  const base = mock ? mockFeed : feed;
  const platsKey = plats ? plats.join(',') : '';

  const filtered = useMemo(() => {
    const hosts = hostsFor(source);
    let f = base;
    if (hosts) f = f.filter((m) => hosts.has(m.host));
    if (plats) f = f.filter((m) => plats.includes(m.platform));
    return f.slice(-limit);
  }, [base, source, platsKey, limit]);

  const rate = useMemo(
    () => filtered.filter((m) => (m.recvAt || m.ts) > Date.now() - 60000).length,
    [filtered],
  );

  return (
    <div className="overlay-root obs-root obs-chat">
      <ChatColumn messages={filtered} msgsPerMin={rate} title="Live Chat" />
    </div>
  );
}

/* ---- content overlay ---- */
function ObsNews({ items, p }) {
  const limit = intParam(p, 'limit', 8);
  const framed = p.get('framed') !== '0';
  const list = (items || []).slice(0, limit);
  return (
    <div className={`obs-root obs-news ${framed ? 'framed' : ''}`}>
      <div className="obs-panel">
        <div className="obs-head"><span className="obs-dot" /> Market Bubble · Content</div>
        <div className="obs-news-list">
          {list.map((n) => (
            <div key={n.id} className="obs-news-card">
              {(n.media || n.video) ? (
                <div className="obs-news-thumb">
                  {n.video ? (
                    <video src={n.video} muted loop playsInline autoPlay poster={n.media || undefined} />
                  ) : (
                    <img src={n.media} alt="" loading="lazy" />
                  )}
                </div>
              ) : null}
              <div className="obs-news-body">
                <p className="obs-news-title">{n.title || n.text}</p>
                <span className="obs-news-src"><PlatformLogo id="x" size={11} /> @{n.handle}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- Polymarket overlay ---- */
function ObsPolymarket({ data, p }) {
  const limit = intParam(p, 'limit', 6);
  const framed = p.get('framed') !== '0';
  const list = (data?.polymarket || []).slice(0, limit);
  return (
    <div className={`obs-root obs-pm ${framed ? 'framed' : ''}`}>
      <div className="obs-panel">
        <div className="obs-head"><PolymarketLogo size={15} /> Polymarket · Live Odds</div>
        <div className="obs-pm-list">
          {list.map((m, i) => (
            <div key={m.slug || i} className="obs-pm-card">
              <p className="obs-pm-q">{m.q}</p>
              <div className="obs-pm-bar"><span className="obs-pm-yes" style={{ width: `${m.yes}%` }} /></div>
              <div className="obs-pm-row">
                <span className="obs-pm-pct yes">{m.yes}% YES</span>
                <span className="obs-pm-vol">${fmtN(Math.round(m.vol))} vol</span>
                <span className="obs-pm-pct no">{m.no}% NO</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ObsApp({ kind }) {
  const { feed, news, market } = useChatSocket();
  const p = P();
  useEffect(() => {
    document.documentElement.dataset.edition = 'evening';
    document.body.classList.add('overlay-body', 'obs-body');
    document.title = `Market Bubble — OBS ${kind}`;
    return () => document.body.classList.remove('overlay-body', 'obs-body');
  }, [kind]);

  if (kind === 'news') return <ObsNews items={news} p={p} />;
  if (kind === 'polymarket') return <ObsPolymarket data={market} p={p} />;
  return <ObsChat feed={feed} p={p} />;
}
