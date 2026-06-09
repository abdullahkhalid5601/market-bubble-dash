import { useEffect, useMemo, useRef, useState } from 'react';
import { PlatformLogo } from './logos.jsx';
import { NewsGridSkeleton } from './Skeletons.jsx';

const fmtClock = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const fmtNum = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${n || 0}`);
const fmtPosted = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};
const fmtT = (s) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60), x = Math.floor(s % 60);
  return `${m}:${String(x).padStart(2, '0')}`;
};
const fmtDur = (s) => (s ? fmtT(s) : null);

/* ---- inline icons (match the dashboard's stroke language) ---- */
const IcPlay = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.2v13.6a.7.7 0 0 0 1.07.6l10.7-6.8a.7.7 0 0 0 0-1.2L9.07 4.6A.7.7 0 0 0 8 5.2z" /></svg>;
const IcPause = ({ s = 18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.4" /><rect x="14" y="5" width="4" height="14" rx="1.4" /></svg>;
const IcVol = ({ s = 17 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8 8 0 0 1 0 12" /></svg>;
const IcMute = ({ s = 17 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M22 9l-6 6M16 9l6 6" /></svg>;
const IcFull = ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5" /></svg>;
const IcClose = ({ s = 18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>;

/* ---- custom liquid-glass video player ---- */
function ClipPlayer({ src, poster }) {
  const vRef = useRef(null);
  const barRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [muted, setMuted] = useState(true);
  const [vol, setVol] = useState(1);
  const frac = dur ? Math.min(1, cur / dur) : 0;

  // Autoplay muted the moment the modal opens (browsers allow muted autoplay),
  // so the clip visibly plays without a click; viewer can unmute from controls.
  useEffect(() => {
    const v = vRef.current;
    if (!v) return;
    v.muted = true; setMuted(true);
    v.play().catch(() => {});
  }, [src]);

  const toggle = () => { const v = vRef.current; if (!v) return; if (v.paused) v.play().catch(() => {}); else v.pause(); };

  const seekTo = (clientX) => {
    const el = barRef.current, v = vRef.current;
    if (!el || !v || !dur) return;
    const r = el.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    v.currentTime = f * dur; setCur(f * dur);
  };
  const onBarDown = (e) => {
    e.preventDefault(); seekTo(e.clientX);
    const mv = (ev) => seekTo(ev.clientX);
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };

  const toggleMute = () => { const v = vRef.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted); };
  const onVol = (e) => { const x = Number(e.target.value); const v = vRef.current; setVol(x); if (v) { v.volume = x; v.muted = x === 0; setMuted(x === 0); } };
  const goFull = () => { const el = vRef.current?.closest('.clip-stage'); if (el?.requestFullscreen) el.requestFullscreen().catch(() => {}); };

  return (
    <div className={`clip-stage ${playing ? 'is-playing' : ''}`}>
      <video
        ref={vRef} src={src} poster={poster || undefined} playsInline preload="auto" autoPlay muted
        onClick={toggle}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onLoadedMetadata={() => setDur(vRef.current?.duration || 0)}
        onTimeUpdate={() => setCur(vRef.current?.currentTime || 0)}
      />
      {!playing ? (
        <button className="clip-bigplay" onClick={toggle} aria-label="Play"><IcPlay s={26} /></button>
      ) : null}

      <div className="clip-ctrls">
        <button className="cc-btn" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <IcPause /> : <IcPlay s={16} />}</button>
        <span className="cc-time">{fmtT(cur)} <span className="cc-sep">/</span> {fmtT(dur)}</span>
        <div className="cc-bar" ref={barRef} onPointerDown={onBarDown}>
          <div className="cc-fill" style={{ width: `${frac * 100}%` }}><span className="cc-thumb" /></div>
        </div>
        <div className="cc-volwrap">
          <button className="cc-btn" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? <IcMute /> : <IcVol />}</button>
          <input className="cc-vol" type="range" min="0" max="1" step="0.05" value={muted ? 0 : vol} onChange={onVol} aria-label="Volume" />
        </div>
        <button className="cc-btn" onClick={goFull} aria-label="Fullscreen"><IcFull /></button>
      </div>
    </div>
  );
}

// Bento sizing: a featured tile every 9th, a wide tile sprinkled in, rest base.
const spanClass = (i) => (i % 9 === 0 ? 'bento-feat' : i % 5 === 3 ? 'bento-wide' : '');

/* ---- bento card: media fills the tile, headline overlaid at the bottom ---- */
function PostCard({ p, onOpen, sizeClass }) {
  const vidRef = useRef(null);
  const onEnter = () => { const v = vidRef.current; if (v) v.play().catch(() => {}); };
  const onLeave = () => { const v = vidRef.current; if (v) { v.pause(); v.currentTime = 0; } };
  const dur = fmtDur(p.duration);
  const hasMedia = Boolean(p.video || p.media);

  return (
    <button type="button" className={`bento-card ${sizeClass} ${hasMedia ? '' : 'bc-noimg'}`} onClick={() => onOpen(p)} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <div className="bc-media">
        {p.video ? (
          <video ref={vidRef} src={p.video} muted loop playsInline preload="none" poster={p.media || undefined} />
        ) : p.media ? (
          <img src={p.media} alt="" loading="lazy" />
        ) : null}
        <span className="bc-scrim" aria-hidden="true" />
      </div>

      <div className="bc-top">
        <span className="bc-src"><PlatformLogo id="x" size={12} /> @{p.handle}</span>
        <span className="bc-date">{p.ts}</span>
      </div>

      {p.video ? <span className="bc-play" aria-hidden="true"><IcPlay s={20} /></span> : null}
      {dur ? <span className="bc-dur">{dur}</span> : null}

      <div className="bc-bottom">
        <h3 className="bc-title">{p.title}</h3>
      </div>
    </button>
  );
}

/* ---- in-window clip modal: liquid-glass surface, squircle player ---- */
function ClipModal({ post, onClose }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const showText = post.text && post.text !== post.title;

  return (
    <div className="clip-backdrop" onMouseDown={onClose}>
      <div className="clip-modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="clip-head">
          <div className="clip-head-l">
            <span className="clip-kicker">{post.video ? 'Market Bubble Clip' : 'Market Bubble Post'}</span>
            <h2 className="clip-title">{post.title}</h2>
          </div>
          <button className="clip-close" onClick={onClose} aria-label="Close"><IcClose /></button>
        </div>

        <div className="clip-body">
          {post.video ? (
            <ClipPlayer src={post.video} poster={post.media} />
          ) : post.media ? (
            <div className="clip-stage clip-static"><img src={post.media} alt="" /></div>
          ) : (
            <div className="clip-stage clip-static clip-noimg"><PlatformLogo id="x" size={40} /></div>
          )}

          <aside className="clip-side">
            <div className="cs-block">
              <span className="cs-label">Posted</span>
              <p className="cs-date">{fmtPosted(post.publishedAt)}</p>
            </div>
            <div className="cs-block">
              <span className="cs-label">Source</span>
              <p className="cs-handle"><PlatformLogo id="x" size={12} /> @{post.handle}</p>
            </div>
            {showText ? <p className="cs-text">{post.text}</p> : null}
            {post.metrics ? (
              <div className="cs-metrics">
                <span>{fmtNum(post.metrics.views)} views</span>
                <span>♥ {fmtNum(post.metrics.likes)}</span>
                <span>⟲ {fmtNum(post.metrics.reposts)}</span>
              </div>
            ) : null}
            <a className="cs-open" href={post.url} target="_blank" rel="noreferrer">
              Open on X
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
            </a>
          </aside>
        </div>
      </div>
    </div>
  );
}

// Real Market Bubble posts from the site content API. Click a card to play the
// clip + read the tweet in an in-window modal.
export default function NewsPage({ items = [] }) {
  const [now, setNow] = useState(() => new Date());
  const [active, setActive] = useState(null);
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 20000); return () => clearInterval(id); }, []);
  const updated = useMemo(() => fmtClock(now), [now]);
  const has = items.length > 0;

  if (!has) return <NewsGridSkeleton />;

  return (
    <div className="page page-news">
      <div className="news-top">
        <div className="news-id">
          <h2>Content</h2>
          <span className="news-handle">@MarketBubble</span>
        </div>
        <div className="news-meta">
          <span>{items.length} posts</span>
          <span className="news-updated"><span className="nu-dot" />Updated {updated}</span>
        </div>
      </div>

      {has ? (
        <div className="news-grid">
          {items.map((p, i) => <PostCard key={p.id ?? i} p={p} onOpen={setActive} sizeClass={spanClass(i)} />)}
        </div>
      ) : (
        <div className="news-empty">
          <span className="ne-x"><PlatformLogo id="x" size={26} /></span>
          <h3>Loading Market Bubble posts…</h3>
          <p>Live tweets, clips &amp; media from @MarketBubble — pulled straight from the Market Bubble content feed and refreshed every minute.</p>
        </div>
      )}

      {active ? <ClipModal post={active} onClose={() => setActive(null)} /> : null}
    </div>
  );
}
