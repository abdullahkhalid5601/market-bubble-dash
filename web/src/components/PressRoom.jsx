import { HOSTS, PLATFORMS, sid, hostColor } from '../data/config.js';

function WireChip({ source, state, muted, onToggle }) {
  const host = HOSTS[source.host] || {};
  const plat = PLATFORMS[source.platform] || {};
  const live = state === 'live';
  const word = muted ? 'MUTED' : state === 'off' ? 'OFF' : state === 'error' ? 'ERR' : state === 'connecting' ? '···' : live ? 'ON AIR' : 'OFF AIR';
  const wordColor = muted || !live ? 'var(--ink-faint)' : 'var(--breaking)';
  const dot = live && !muted ? 'var(--breaking)' : 'var(--ink-faint)';
  return (
    <button
      onClick={() => onToggle(sid(source.host, source.platform))}
      className="press-btn flex items-center gap-2 px-[9px] py-1.5"
      style={{ border: '1px solid var(--rule-strong)', opacity: muted ? 0.38 : 1, background: 'transparent' }}
      title={`${host.name} · ${plat.name} — ${word.toLowerCase()} · click to ${muted ? 'unmute' : 'mute'}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${live && !muted ? 'pulse' : ''}`} style={{ background: dot }} />
      <span className="meta text-[10px] font-semibold" style={{ color: host.accent }}>{host.name[0]}</span>
      <span className="rounded-[2px] border px-1 text-[8px]" style={{ fontFamily: 'var(--font-meta)', color: plat.color, borderColor: plat.color }}>{plat.tag}</span>
      <span className="meta text-[8px] tracking-[0.12em]" style={{ color: wordColor }}>{word}</span>
    </button>
  );
}

function Inches({ hype }) {
  return (
    <div className="ml-auto flex items-center gap-3">
      <span className="meta text-[9px] leading-[1.3] tracking-[0.16em] text-[var(--ink-faint)]">COLUMN<br />INCHES</span>
      <div className="flex flex-col gap-1">
        {['banks', 'ansem'].map((h) => (
          <div key={h} className="flex items-center gap-2">
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, width: 10, color: hostColor(h) }}>{HOSTS[h].name[0]}</span>
            <div className="relative h-[9px] w-[168px]" style={{ background: 'var(--paper-3)', border: '1px solid var(--rule)' }}>
              <div className="hatch absolute inset-y-0 left-0" style={{ '--host-c': hostColor(h), width: `${Math.round((hype[h] || 0) * 100)}%` }} />
            </div>
            <span className="tnum meta w-7 text-[10px] text-[var(--ink-dim)]">{Math.round((hype[h] || 0) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PressRoom({ paused, onTogglePause, sources, srcStates = {}, muted = {}, onToggleMute, hype }) {
  return (
    <footer className="glass rule-double-top relative z-20 flex flex-wrap items-center gap-x-5 gap-y-3 px-6 py-3" style={{ background: 'color-mix(in srgb, var(--paper) 84%, transparent)' }}>
      <button
        onClick={onTogglePause}
        className="press-btn flex h-[30px] w-[30px] items-center justify-center text-[11px] text-[var(--ink-dim)]"
        style={{ border: '1px solid var(--rule-strong)' }}
        title={paused ? 'resume the wire' : 'hold the wire'}
      >
        {paused ? '▶' : '❚❚'}
      </button>

      <span className="meta text-[9px] tracking-[0.18em] text-[var(--ink-faint)]">ON THE WIRE</span>
      <div className="flex flex-wrap items-center gap-2">
        {sources.map((s) => (
          <WireChip key={s.id} source={s} state={srcStates[s.id]} muted={muted[s.id] === true} onToggle={onToggleMute} />
        ))}
      </div>

      <Inches hype={hype} />
    </footer>
  );
}
