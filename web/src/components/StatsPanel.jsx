import { useEffect, useRef, useState } from 'react';
import { fmtN } from '../data/mb.js';
import { PlatformLogo } from './logos.jsx';
import Segmented from './Segmented.jsx';

// smooth count-up when a number changes (tab switch, live tick)
function useCountUp(target, dur = 650) {
  const [val, setVal] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    const to = target;
    if (from === to) return;
    let raf, start;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); fromRef.current = to; };
  }, [target, dur]);
  return val;
}

function CountValue({ value }) {
  return <span className="value tnum">{fmtN(useCountUp(value))}</span>;
}

function ViewerPop({ rows }) {
  return (
    <div className="pop" role="tooltip">
      <div className="pop-head">Viewers by platform</div>
      {rows.map((p) => (
        <div className="row" key={p.id}>
          <span className={`plat-logo ${p.id}`}><PlatformLogo id={p.id} size={13} /></span>
          <span className="plat">{p.name}</span>
          <span className="num">{fmtN(p.count)}</span>
          <span className="pct">{p.pct}%</span>
        </div>
      ))}
    </div>
  );
}

function StatBlock({ label, value, delta, deltaTone, hoverable, popRows }) {
  return (
    <div className={`stat${hoverable ? ' hoverable' : ''}`} tabIndex={hoverable ? 0 : undefined}>
      <span className="label">{label}{hoverable ? <span className="info">i</span> : null}</span>
      <CountValue value={value} />
      {delta ? <span className={`delta${deltaTone ? ' ' + deltaTone : ''}`}>{delta}</span> : null}
      {hoverable && popRows ? <ViewerPop rows={popRows} /> : null}
    </div>
  );
}

function PlatformBar({ p }) {
  return (
    <div className="bar">
      <div className="head">
        <span className={`icon ${p.id}`}><PlatformLogo id={p.id} size={12} /></span>
        <span className="name">{p.name}</span>
        <span className="num">{fmtN(p.count)}</span>
        <span className="pct">· {p.pct}%</span>
      </div>
      <div className="track">
        <div className="fill" style={{ '--w': `${p.pct}%`, '--c': `var(--${p.id})` }} />
      </div>
    </div>
  );
}

const deltaTone = (s) => (s && s.startsWith('+')) ? 'up' : (s && s.startsWith('-')) ? 'down' : '';

function StatsTabs({ tab, onTab }) {
  return (
    <Segmented className="stats-tabs" value={tab} onChange={onTab}
      options={[{ id: 'ansem', label: 'Ansem' }, { id: 'banks', label: 'Banks' }, { id: 'both', label: 'Both' }]} />
  );
}

export function StatsPanel({ tab, onTab, data }) {
  const d = data.deltas || {};
  return (
    <div className="stats-col">
      <StatsTabs tab={tab} onTab={onTab} />
      <div className="stat-grid">
        <StatBlock label="Total viewers" value={data.viewers} delta={d.viewers} deltaTone={deltaTone(d.viewers)} hoverable popRows={data.viewerBreak} />
        <StatBlock label="Active chatters" value={data.chatters} delta={d.chatters} deltaTone={deltaTone(d.chatters)} />
        <StatBlock label="Total messages" value={data.messages} delta={d.messages} />
        <StatBlock label="Messages / min" value={data.msgsPerMin} delta={d.msgsPerMin} deltaTone={deltaTone(d.msgsPerMin)} />
      </div>
      <div className="bars">
        {data.platforms.map((p) => <PlatformBar key={p.id} p={p} />)}
      </div>
    </div>
  );
}

export function StatsStrip({ data }) {
  return (
    <div className="stats-strip">
      <div className="nums">
        <StatBlock label="Viewers" value={data.viewers} />
        <StatBlock label="Chatters" value={data.chatters} />
        <StatBlock label="Messages" value={data.messages} />
        <StatBlock label="Msgs / min" value={data.msgsPerMin} />
      </div>
      <div className="strip-bars">
        {data.platforms.map((p) => <PlatformBar key={p.id} p={p} />)}
      </div>
    </div>
  );
}
