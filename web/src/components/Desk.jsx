import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Brief from './Brief.jsx';

const BOTTOM_PX = 72;

// One editorial desk: a kicker header, a wire of briefs auto-pinned to the
// bottom, an empty state, and a sync pill when the reader scrolls up.
export default function Desk({ title, kicker = 'NOW REPORTING', accent, live, messages, pinned, onTogglePin }) {
  const scrollRef = useRef(null);
  const [synced, setSynced] = useState(true);
  const syncedRef = useRef(true);
  syncedRef.current = synced;

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && syncedRef.current) el.scrollTop = el.scrollHeight;
  }, [messages, pinned]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setSynced(el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_PX);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const sync = () => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setSynced(true);
  };

  const lastId = messages.length ? messages[messages.length - 1].id : null;

  return (
    <section className="relative flex min-h-0 flex-1 flex-col">
      {/* Desk header */}
      <div className="flex items-center gap-3 px-5 py-2.5">
        <span className="meta text-[9px] tracking-[0.2em] text-[var(--ink-faint)]">{kicker}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, color: accent || 'var(--ink-strong)' }}>{title}</span>
        <span className="h-px flex-1" style={{ background: 'var(--rule)' }} />
        <span className="meta flex items-center gap-1.5 text-[9px] tracking-[0.16em]" style={{ color: live ? 'var(--breaking)' : 'var(--ink-faint)' }}>
          {live ? <span className="pulse inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'var(--breaking)' }} /> : null}
          {live ? 'ON AIR' : 'OFF AIR'}
        </span>
      </div>

      <div ref={scrollRef} className="feed-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        {messages.length === 0 ? (
          <Empty live={live} />
        ) : (
          <div className="flex min-h-full flex-col justify-end" style={{ gap: 'var(--row-gap)' }}>
            {messages.map((m, i) => (
              <Brief
                key={m.id}
                msg={m}
                newest={m.id === lastId}
                pinned={pinned.has(m.id)}
                onTogglePin={onTogglePin}
                last={i === messages.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sync pill */}
      <div
        className="sync-pill pointer-events-none absolute inset-x-0 bottom-4 flex justify-center"
        style={{ opacity: synced ? 0 : 1, transform: synced ? 'translateY(8px)' : 'translateY(0)' }}
      >
        <button
          onClick={sync}
          className="press-btn meta pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-[11px] tracking-[0.16em]"
          style={{ background: 'var(--ink)', color: 'var(--paper)', boxShadow: '0 8px 26px rgba(0,0,0,0.4)', visibility: synced ? 'hidden' : 'visible' }}
        >
          ↓ Latest
        </button>
      </div>
    </section>
  );
}

function Empty({ live }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 56, lineHeight: 1, color: 'var(--ink-faint)' }}>↑</span>
      <span className="meta text-[11px] tracking-[0.22em] text-[var(--ink-dim)]">{live ? 'AWAITING DISPATCHES' : 'THE PRESSES ARE QUIET'}</span>
      <p className="italic text-[var(--ink-faint)]" style={{ fontFamily: 'var(--font-head)', fontSize: 13, maxWidth: 260 }}>
        {live ? 'Filing as it comes in over the wire.' : 'Banks & Ansem aren’t on air. The page fills the moment they go live.'}
      </p>
    </div>
  );
}
