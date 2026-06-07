import { memo } from 'react';
import { HOSTS, PLATFORMS, hostColor } from '../data/config.js';

function ts(t) {
  return new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function Byline({ msg, deskColor, below }) {
  const plat = PLATFORMS[msg.platform] || { tag: msg.platform?.toUpperCase(), color: 'var(--ink-dim)' };
  const desk = HOSTS[msg.host]?.name || msg.host?.toUpperCase();
  return (
    <div className={`meta flex items-center gap-2 text-[10px] ${below ? 'mt-2' : 'mb-1'}`}>
      <span className="font-semibold tracking-[0.14em]" style={{ color: deskColor }}>{desk}</span>
      <span className="rounded-[2px] border px-1 py-px text-[8px] tracking-[0.1em]" style={{ color: plat.color, borderColor: plat.color }}>
        {plat.tag}
      </span>
      <span className="tracking-[0.04em] text-[var(--ink-dim)]">@{msg.user}</span>
      <span className="tnum ml-auto tracking-[0.04em] text-[var(--ink-faint)]">{ts(msg.ts)}</span>
    </div>
  );
}

// One chat message rendered as a wire brief. Three states: default, newest
// (host-colored Caslon quotes + strong ink), pinned/breaking (drop-cap card).
function Brief({ msg, newest, pinned, onTogglePin, last }) {
  const hc = hostColor(msg.host);

  if (pinned) {
    return (
      <article
        className="brief-rise"
        style={{
          '--host-c': hc,
          border: '1px solid color-mix(in srgb, var(--breaking) 45%, var(--rule))',
          borderLeft: '3px solid var(--breaking)',
          background: 'color-mix(in srgb, var(--breaking) 9%, var(--paper-2))',
          padding: '13px 16px 14px',
        }}
        onDoubleClick={() => onTogglePin(msg.id)}
        title="double-click to unpin"
      >
        <div className="meta mb-2 flex items-center gap-2 text-[9px] tracking-[0.2em]" style={{ color: 'var(--breaking)' }}>
          <span>★ BREAKING</span>
          <span className="h-px flex-1" style={{ background: 'color-mix(in srgb, var(--breaking) 40%, transparent)' }} />
          <span>EDITOR’S PICK</span>
        </div>
        <p className="dropcap" style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--msg-size)', lineHeight: 1.42, color: 'var(--ink-strong)', textWrap: 'pretty', overflowWrap: 'anywhere' }}>
          {msg.text}
        </p>
        <Byline msg={msg} deskColor={hc} below />
      </article>
    );
  }

  return (
    <article
      className="brief-rise"
      style={{ '--host-c': hc, paddingLeft: 12, borderLeft: `2px solid ${hc}`, paddingBottom: last ? 0 : 'var(--row-pad)', borderBottom: last ? 'none' : '1px solid var(--rule)' }}
      onDoubleClick={() => onTogglePin(msg.id)}
      title="double-click to flag as breaking"
    >
      <Byline msg={msg} deskColor={hc} />
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--msg-size)', lineHeight: 1.42, color: newest ? 'var(--ink-strong)' : 'var(--ink-dim)', textWrap: 'pretty', overflowWrap: 'anywhere' }}>
        {newest ? (
          <>
            <span className="brief-quote">“</span>
            {msg.text}
            <span className="brief-quote">”</span>
          </>
        ) : (
          msg.text
        )}
      </p>
    </article>
  );
}

export default memo(Brief);
