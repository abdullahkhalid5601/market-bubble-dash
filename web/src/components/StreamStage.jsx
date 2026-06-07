import { useState } from 'react';
import { HOSTS } from '../data/config.js';

// The center "lead photograph" of the broadsheet — the actual live stream(s),
// embedded (free Twitch + Kick players, no API). A switcher picks which desk to
// watch, or BOTH stacked. Offline channels show the player's own offline screen.
const parent = typeof location !== 'undefined' ? location.hostname : 'localhost';

const FEEDS = {
  banks: { platform: 'TWITCH', handle: 'fazebanks', src: `https://player.twitch.tv/?channel=fazebanks&parent=${parent}&muted=true&autoplay=true` },
  ansem: { platform: 'KICK', handle: 'ansem', src: `https://player.kick.com/ansem?autoplay=true&muted=true` },
};

function Player({ host }) {
  const f = FEEDS[host];
  const accent = HOSTS[host].accent;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1 overflow-hidden" style={{ border: '1px solid var(--rule-strong)', background: '#000' }}>
        <iframe title={`${host} live`} src={f.src} allow="autoplay; fullscreen" allowFullScreen className="absolute inset-0 h-full w-full" style={{ border: 0 }} />
      </div>
      <div className="flex items-center gap-2 pt-1.5">
        <span className="inline-block h-[8px] w-[8px]" style={{ background: accent }} />
        <span className="meta text-[9px] tracking-[0.18em]" style={{ color: accent }}>{HOSTS[host].desk}</span>
        <span className="meta text-[9px] tracking-[0.14em] text-[var(--ink-faint)]">{f.platform} · {f.handle}</span>
      </div>
    </div>
  );
}

export default function StreamStage() {
  const [watch, setWatch] = useState('both');
  return (
    <section className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-2.5">
      <div className="mb-2 flex items-center gap-3">
        <span className="meta text-[9px] tracking-[0.2em] text-[var(--ink-faint)]">THE BROADCAST</span>
        <span className="h-px flex-1" style={{ background: 'var(--rule)' }} />
        <div className="flex overflow-hidden rounded-[2px] border border-[var(--rule-strong)]">
          {[['banks', 'BANKS'], ['ansem', 'ANSEM'], ['both', 'BOTH']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setWatch(id)}
              className="press-btn meta px-2.5 py-1 text-[9px] tracking-[0.12em]"
              style={{ background: watch === id ? 'var(--ink)' : 'transparent', color: watch === id ? 'var(--paper)' : 'var(--ink-dim)' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className={`flex min-h-0 flex-1 ${watch === 'both' ? 'flex-col gap-3' : ''}`}>
        {watch === 'both' ? (
          <>
            <Player host="banks" />
            <Player host="ansem" />
          </>
        ) : (
          <Player host={watch} />
        )}
      </div>
    </section>
  );
}
