import Desk from './Desk.jsx';
import StreamStage from './StreamStage.jsx';
import StatsRail from './StatsRail.jsx';
import { HOSTS, HOST_ORDER } from '../data/config.js';

const hostIsLive = (host, srcStates) =>
  Object.entries(srcStates).some(([id, st]) => id.startsWith(`${host}:`) && st === 'live');

// FRONT PAGE (unified): chat left · live stream center (the lead photo) · stats
// right — the Wall Street Journal layout. SPLIT: a chat desk per host.
export default function Dashboard({ view, messages, srcStates = {}, anyLive, pinned, onTogglePin, viewers, stats, perMin }) {
  if (view === 'split') {
    return (
      <div className="grid min-h-0 flex-1 grid-cols-2">
        {HOST_ORDER.map((host, i) => (
          <div key={host} className="flex min-h-0 flex-col" style={i === 0 ? { borderRight: '1px solid var(--rule-strong)' } : undefined}>
            <Desk
              title={HOSTS[host].desk}
              accent={HOSTS[host].accent}
              live={hostIsLive(host, srcStates)}
              messages={messages.filter((m) => m.host === host)}
              pinned={pinned}
              onTogglePin={onTogglePin}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(280px,1fr)_minmax(0,1.6fr)_300px]">
      <div className="flex min-h-0 flex-col" style={{ borderRight: '1px solid var(--rule-strong)' }}>
        <Desk title="THE WIRE" kicker="THE COMBINED WIRE" live={anyLive} messages={messages} pinned={pinned} onTogglePin={onTogglePin} />
      </div>
      <div className="flex min-h-0 flex-col" style={{ borderRight: '1px solid var(--rule-strong)' }}>
        <StreamStage />
      </div>
      <div className="flex min-h-0 flex-col">
        <StatsRail viewers={viewers} stats={stats} perMin={perMin} />
      </div>
    </div>
  );
}
