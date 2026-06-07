function Segmented({ value, options, onChange }) {
  return (
    <div className="flex overflow-hidden rounded-[2px] border border-[var(--rule-strong)]">
      {options.map(([id, label]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className="press-btn meta flex-1 px-2 py-1.5 text-[9px] tracking-[0.14em]"
          style={{ background: value === id ? 'var(--ink)' : 'transparent', color: value === id ? 'var(--paper)' : 'var(--ink-dim)' }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Label({ children }) {
  return <div className="meta mb-2 text-[9px] tracking-[0.2em] text-[var(--ink-faint)]">{children}</div>;
}

export default function Tweaks({ open, onToggle, density, onDensity, cadence, onCadence, onSpike, animMult, onAnim }) {
  return (
    <>
      {/* Bottom-center handle */}
      <button
        onClick={onToggle}
        aria-label="open the composing room"
        className="press-btn fixed bottom-1.5 left-1/2 z-30 -translate-x-1/2"
        style={{ width: 54, height: 12, borderRadius: 9999, border: '1px solid var(--rule-strong)', background: 'var(--paper-2)' }}
        title="The Composing Room — design tweaks"
      />

      {/* Panel */}
      <aside
        className="glass fixed right-0 top-0 z-40 flex h-full w-[290px] flex-col gap-6 overflow-y-auto p-6 transition-transform duration-300"
        style={{
          background: 'color-mix(in srgb, var(--paper-2) 94%, transparent)',
          borderLeft: '3px double var(--rule-strong)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink-strong)' }}>The Composing Room</span>
          <button onClick={onToggle} className="press-btn meta text-[12px] text-[var(--ink-dim)]">✕</button>
        </div>

        <div>
          <Label>LAYOUT — DENSITY</Label>
          <Segmented value={density} onChange={onDensity} options={[['compact', 'COMPACT'], ['regular', 'REGULAR'], ['comfy', 'COMFY']]} />
        </div>

        <div>
          <Label>THE WIRE — CADENCE</Label>
          <input type="range" min="0.3" max="5" step="0.1" value={cadence} onChange={(e) => onCadence(Number(e.target.value))} className="w-full" style={{ accentColor: 'var(--banks)' }} />
          <div className="meta tnum mt-1 text-[10px] text-[var(--ink-dim)]">{cadence.toFixed(1)} / SEC</div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => onSpike('banks')} className="press-btn meta flex-1 px-2 py-2 text-[9px] tracking-[0.12em]" style={{ border: '1px solid var(--rule-strong)', color: 'var(--banks)' }}>RUN BANKS STORY</button>
            <button onClick={() => onSpike('ansem')} className="press-btn meta flex-1 px-2 py-2 text-[9px] tracking-[0.12em]" style={{ border: '1px solid var(--rule-strong)', color: 'var(--ansem)' }}>RUN ANSEM STORY</button>
          </div>
        </div>

        <div>
          <Label>MOTION — SPEED ×{animMult.toFixed(1)}</Label>
          <input type="range" min="0" max="2" step="0.1" value={animMult} onChange={(e) => onAnim(Number(e.target.value))} className="w-full" style={{ accentColor: 'var(--ansem)' }} />
        </div>
      </aside>
    </>
  );
}
