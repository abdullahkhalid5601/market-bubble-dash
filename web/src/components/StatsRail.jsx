import { PLATFORMS } from '../data/config.js';

const PLAT_ORDER = ['twitch', 'kick', 'x'];

function Stat({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="meta text-[8px] tracking-[0.18em] text-[var(--ink-faint)]">{label}</span>
      <span className="tnum text-[var(--ink-strong)]" style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, lineHeight: 1.1 }}>{value}</span>
    </div>
  );
}

// Right column of the front page. Headline interaction (Banks' ask): hover the
// viewer count to see where it's coming from, per platform.
export default function StatsRail({ viewers, stats, perMin }) {
  const totalViewers = viewers.twitch + viewers.kick + viewers.x;
  const totalMsgs = stats.total || 0;

  return (
    <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto px-4 pb-4 pt-2.5">
      <div className="meta flex items-center gap-3 text-[9px] tracking-[0.2em] text-[var(--ink-faint)]">
        THE DESK TAPE
        <span className="h-px flex-1" style={{ background: 'var(--rule)' }} />
      </div>

      {/* Viewers — hover reveals the per-platform source breakdown */}
      <div className="group relative">
        <span className="meta text-[8px] tracking-[0.18em] text-[var(--ink-faint)]">TOTAL VIEWERS · HOVER FOR SOURCE</span>
        <div className="tnum text-[var(--ink-strong)]" style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, lineHeight: 1 }}>
          {totalViewers.toLocaleString()}
        </div>
        <div
          className="pointer-events-none absolute left-0 top-full z-30 mt-2 w-full rounded-[3px] p-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          style={{ background: 'var(--paper-3)', border: '1px solid var(--rule-strong)' }}
        >
          <div className="meta mb-2 text-[8px] tracking-[0.18em] text-[var(--ink-faint)]">VIEWERS BY SOURCE</div>
          {PLAT_ORDER.map((p) => {
            const v = viewers[p] || 0;
            const pct = totalViewers ? Math.round((v / totalViewers) * 100) : 0;
            return (
              <div key={p} className="mb-1.5 flex items-center gap-2">
                <span className="inline-block h-2 w-2" style={{ background: PLATFORMS[p].color }} />
                <span className="meta w-14 text-[9px] tracking-[0.1em]" style={{ color: PLATFORMS[p].color }}>{PLATFORMS[p].tag}</span>
                <span className="tnum meta flex-1 text-right text-[10px] text-[var(--ink)]">{v.toLocaleString()}</span>
                <span className="tnum meta w-9 text-right text-[9px] text-[var(--ink-faint)]">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-6">
        <Stat label="MESSAGES" value={totalMsgs.toLocaleString()} />
        <Stat label="MSGS / MIN" value={perMin} />
      </div>

      {/* Per-platform message share */}
      <div>
        <div className="meta mb-2 text-[8px] tracking-[0.18em] text-[var(--ink-faint)]">CHATTER BY SOURCE</div>
        {PLAT_ORDER.map((p) => {
          const c = stats[p] || 0;
          const pct = totalMsgs ? Math.round((c / totalMsgs) * 100) : 0;
          return (
            <div key={p} className="mb-2">
              <div className="mb-1 flex items-center gap-2">
                <span className="meta text-[9px] tracking-[0.1em]" style={{ color: PLATFORMS[p].color }}>{PLATFORMS[p].tag}</span>
                <span className="tnum meta ml-auto text-[9px] text-[var(--ink-dim)]">{c.toLocaleString()}</span>
                <span className="tnum meta w-8 text-right text-[9px] text-[var(--ink-faint)]">{pct}%</span>
              </div>
              <div className="h-[7px] w-full" style={{ background: 'var(--paper-3)', border: '1px solid var(--rule)' }}>
                <div className="h-full" style={{ width: `${pct}%`, background: PLATFORMS[p].color, transition: 'width 520ms var(--ease-out)' }} />
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
