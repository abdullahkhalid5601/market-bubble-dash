import { useEffect, useMemo, useState } from 'react';
import { STATS, PLATFORMS, PLATFORM_META, USERNAMES } from '../data/mb.js';

const HOSTS_FOR = { both: ['banks', 'ansem'], ansem: ['ansem'], banks: ['banks'] };
const sid = (h, p) => `${h}:${p}`;

// Real viewers from the gateway (status.viewers) if present; else null → seed.
function realViewers(statuses, hosts) {
  let any = false;
  const byPlat = { twitch: 0, kick: 0, x: 0 };
  for (const h of hosts) {
    for (const p of PLATFORMS) {
      const v = statuses[sid(h, p)]?.viewers;
      if (typeof v === 'number') { any = true; byPlat[p] += v; }
    }
  }
  return any ? byPlat : null;
}

// One tab's snapshot in the shape StatsPanel/StatsStrip expect.
export function useStats(feed, stats, statuses, tab) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 1000); return () => clearInterval(id); }, []);

  return useMemo(() => {
    const hosts = HOSTS_FOR[tab] || HOSTS_FOR.both;
    const seed = STATS[tab] || STATS.both;

    // Real running message counts (from the live chat).
    const messages = hosts.reduce((a, h) => a + (stats.host?.[h] || 0), 0);
    const platforms = PLATFORMS.map((p) => {
      const count = hosts.reduce((a, h) => a + (stats.hp?.[sid(h, p)] || 0), 0);
      return { id: p, name: PLATFORM_META[p].name, count, pct: messages ? Math.round((count / messages) * 100) : 0 };
    });

    // Real msgs/min + unique chatters from the recent feed window.
    const cutoff = Date.now() - 60000;
    const recent = feed.filter((m) => hosts.includes(m.host) && (m.recvAt || m.ts) >= cutoff);
    const msgsPerMin = recent.length;
    const chatters = new Set(feed.filter((m) => hosts.includes(m.host)).map((m) => m.user)).size;

    // Viewers: real from gateway, else seed numbers so the panel reads complete.
    const rv = realViewers(statuses, hosts);
    let viewers, viewerBreak;
    if (rv) {
      viewers = rv.twitch + rv.kick + rv.x;
      viewerBreak = PLATFORMS.map((p) => ({
        id: p, name: PLATFORM_META[p].name, count: rv[p],
        pct: viewers ? Math.round((rv[p] / viewers) * 100) : 0,
      }));
    } else {
      viewers = seed.viewers;
      viewerBreak = seed.viewerBreak;
    }

    return { viewers, chatters, messages, msgsPerMin, deltas: seed.deltas, platforms, viewerBreak };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed, stats, statuses, tab, tick]);
}

// Header "watching" total (both hosts).
export function totalViewers(statuses) {
  const rv = realViewers(statuses, ['banks', 'ansem']);
  return rv ? rv.twitch + rv.kick + rv.x : STATS.both.viewers;
}
