// Static seed data + helpers (ported from the redesign). Live chat comes from
// the gateway via useChatSocket; these seed numbers back the stats panel until
// the gateway provides real viewer counts.

export const USERNAMES = [
  'tickerreply', 'watchparty', 'chartlurker', 'spotbidder', 'hyperliquidated', 'solwatch',
  'bidwall', 'signalrunner', 'leverage_larry', 'apefan_69', 'wagmi.eth', 'rugpull_sam',
  'gm_gn', 'topcaller', 'orderblockz', 'cthulhu_capital', 'frontran', 'liqdwood', 'maxipad',
  'plebcanary', 'bobotrader', 'macro_brad', 'normieout', 'futdrop', 'pumpedonce',
  'degeneratedave', 'wickhunter', 'doublebottom', 'cope_dealer',
];

const USER_COLORS = ['var(--u1)', 'var(--u2)', 'var(--u3)', 'var(--u4)', 'var(--u5)', 'var(--u6)', 'var(--u7)', 'var(--u8)'];

export function hashStr(s) {
  let h = 0;
  for (let i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) | 0;
  return Math.abs(h);
}
export const userColor = (name) => USER_COLORS[hashStr(name || 'anon') % USER_COLORS.length];

export const TICKERS = [
  { sym: 'BTC', px: 104231, pct: 2.4 }, { sym: 'ETH', px: 3891, pct: 1.1 },
  { sym: 'SOL', px: 188.4, pct: -0.8 }, { sym: 'HYPE', px: 23.1, pct: 14.2 },
  { sym: 'BNKS', px: 0.421, pct: 6.8 }, { sym: 'WIF', px: 2.14, pct: -3.1 },
  { sym: 'POPCAT', px: 1.02, pct: 2.0 }, { sym: 'JUP', px: 1.41, pct: -0.4 },
  { sym: 'TIA', px: 6.27, pct: 4.4 }, { sym: 'PENGU', px: 0.039, pct: 11.8 },
];

// Seed viewer numbers per tab (used only until the gateway provides real ones).
export const STATS = {
  both: {
    viewers: 27740, deltas: { viewers: '+3.2% / hr', chatters: '+8.4% / hr', messages: 'this session', msgsPerMin: '+12% vs avg' },
    viewerBreak: [
      { id: 'twitch', name: 'Twitch', count: 4320, pct: 16 },
      { id: 'kick', name: 'Kick', count: 18491, pct: 66 },
      { id: 'x', name: 'X', count: 4929, pct: 18 },
    ],
  },
  ansem: {
    viewers: 18420, deltas: { viewers: '+5.1% / hr', chatters: '+9.0% / hr', messages: 'this session', msgsPerMin: '+18% vs avg' },
    viewerBreak: [
      { id: 'twitch', name: 'Twitch', count: 0, pct: 0 },
      { id: 'kick', name: 'Kick', count: 14988, pct: 81 },
      { id: 'x', name: 'X', count: 3432, pct: 19 },
    ],
  },
  banks: {
    viewers: 9320, deltas: { viewers: '+1.4% / hr', chatters: '+4.2% / hr', messages: 'this session', msgsPerMin: '+3% vs avg' },
    viewerBreak: [
      { id: 'twitch', name: 'Twitch', count: 4320, pct: 46 },
      { id: 'kick', name: 'Kick', count: 3503, pct: 38 },
      { id: 'x', name: 'X', count: 1497, pct: 16 },
    ],
  },
};

export const PLATFORMS = ['twitch', 'kick', 'x'];
export const PLATFORM_META = {
  twitch: { name: 'Twitch' }, kick: { name: 'Kick' }, x: { name: 'X' }, mb: { name: 'Market Bubble' },
};
export const hostColor = (h) => (h === 'banks' ? 'var(--banks)' : h === 'house' ? 'var(--ink-dim)' : 'var(--ansem)');
export const hostName = (h) => (h === 'banks' ? 'BANKS' : h === 'house' ? 'LIVE CHAT' : 'ANSEM');

export const formatTime = (ts) => {
  const d = new Date(ts);
  const h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
};
export const fmtN = (n) => Number(n || 0).toLocaleString('en-US');
export const fmtPx = (p) => (p < 10 ? p.toLocaleString(undefined, { maximumFractionDigits: 3 }) : p.toLocaleString(undefined, { maximumFractionDigits: 0 }));
