import { useMemo } from 'react';
import { HOSTS } from '../data/config.js';

function dateline() {
  return new Date()
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

const Divider = () => <span className="mx-3 inline-block h-3 w-px align-middle" style={{ background: 'var(--rule-strong)' }} />;

function EditionToggle({ edition, onEdition }) {
  return (
    <span className="meta inline-flex items-center gap-2 text-[10px] tracking-[0.16em]">
      {[['evening', 'EVENING'], ['morning', 'MORNING']].map(([id, label], i) => (
        <span key={id} className="inline-flex items-center gap-2">
          {i === 1 ? <span className="text-[var(--ink-faint)]">·</span> : null}
          <button
            onClick={() => onEdition(id)}
            className="press-btn rounded-[3px] px-1.5 py-0.5"
            style={
              edition === id
                ? { border: '1px solid var(--ink-dim)', color: 'var(--ink-strong)' }
                : { border: '1px solid transparent', color: 'var(--ink-faint)' }
            }
          >
            {label}
          </button>
        </span>
      ))}
    </span>
  );
}

function ViewToggle({ view, onView }) {
  return (
    <div className="flex overflow-hidden rounded-[2px] border border-[var(--rule-strong)]">
      {[['unified', 'UNIFIED'], ['split', 'SPLIT']].map(([id, label]) => (
        <button
          key={id}
          onClick={() => onView(id)}
          className="press-btn meta px-3 py-1.5 text-[10px] tracking-[0.16em]"
          style={{ background: view === id ? 'var(--ink)' : 'transparent', color: view === id ? 'var(--paper)' : 'var(--ink-dim)' }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function Masthead({ edition, onEdition, circulation, view, onView, live }) {
  const date = useMemo(dateline, []);
  return (
    <header className="glass rule-double-bottom relative z-20" style={{ background: 'color-mix(in srgb, var(--paper) 84%, transparent)' }}>
      {/* Top strip */}
      <div className="flex items-center justify-between border-b px-6 py-1.5" style={{ borderColor: 'var(--rule)' }}>
        <div className="flex items-center">
          <span className={`inline-block h-[7px] w-[7px] rounded-full ${live ? 'pulse' : ''}`} style={{ background: live ? 'var(--breaking)' : 'var(--ink-faint)' }} />
          <span className="meta ml-2 text-[10px] tracking-[0.18em] text-[var(--ink)]">{live ? 'LIVE EDITION' : 'QUIET EDITION'}</span>
          <Divider />
          <span className="meta text-[10px] tracking-[0.18em] text-[var(--ink-dim)]">{date}</span>
        </div>
        <div className="flex items-center">
          <EditionToggle edition={edition} onEdition={onEdition} />
          <Divider />
          <span className="meta text-[10px] tracking-[0.18em] text-[var(--ink-dim)]">
            CIRCULATION <span className="tnum ml-1 text-[var(--ink-strong)]">{circulation.toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Nameplate — WSJ-style single full-width line */}
      <div className="px-6 pt-2 text-center">
        <h1
          className="w-full text-center text-[var(--ink-strong)]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600, fontSize: 'clamp(30px,5vw,60px)', lineHeight: 1, letterSpacing: '0.005em' }}
        >
          The Market Bubble
        </h1>
      </div>

      {/* Sub-row: legend · tagline · view toggle */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 pb-2 pt-1.5">
        <div className="flex items-center gap-4">
          {['banks', 'ansem'].map((h) => (
            <span key={h} className="meta flex items-center gap-1.5 text-[9px] tracking-[0.16em] text-[var(--ink-dim)]">
              <span className="inline-block h-[8px] w-[8px]" style={{ background: HOSTS[h].accent }} />
              {HOSTS[h].desk}
            </span>
          ))}
        </div>
        <p className="italic text-[var(--ink-dim)]" style={{ fontFamily: 'var(--font-head)', fontSize: '11.5px' }}>
          “All the Chats That’s Fit to Print”
        </p>
        <div className="flex justify-end">
          <ViewToggle view={view} onView={onView} />
        </div>
      </div>
    </header>
  );
}
