import { normalize } from '../normalize.js';

// Synthetic CT/degen chatter. The demo runs on this — no network required.
// Reads a mutable `cfg` each tick so the Tweaks panel can steer cadence + bias.
const LINES = [
  'wagmi', 'ngmi tbh', 'ser the chart', '100x or nothing', 'is this financial advice lol',
  'probably nothing', 'few understand', 'gm degens', 'number go up', 'liquidated again',
  'diamond hands only', 'paper hands ngmi', 'lfg', 'to the moon', 'based', 'zoom out',
  'chart looks bullish ngl', 'one more candle bro', 'exit liquidity = you', 'HODL',
  'wen lambo', 'secure the bag', 'cope harder', 'this is the bottom trust me',
  'green candle incoming', 'rugged AGAIN', 'jpow do something', 'rate cut wen',
  'my bags are so heavy', 'ape first ask later', 'valuation makes zero sense',
  'we are so back', 'it is so over', 'touch grass ser', 'funds are safu', 'send it',
  'banks vs ansem who wins', 'ansem cooking rn', 'banks down bad', 'chat is this real',
];
const USERS = [
  'degenape', '0xWhale', 'chartwizard', 'liquidated_again', 'satoshisghost', 'gmfrenz',
  'moonboy42', 'exitliquidity', 'probablynothing', 'serpending', 'bagholder99', 'cryptobry',
  'wagmicapital', 'jpegcollector', 'ngmikid', 'fomo_frank', 'rektrachel', 'hodlharold',
];
const pick = (a) => a[(Math.random() * a.length) | 0];

export function start({ sources, onMessage, cfg }) {
  const conf = cfg || { cadenceMs: 1100, biasHost: null, biasUntil: 0 };
  let stopped = false;
  let timer = null;

  function chooseSource() {
    if (conf.biasHost && Date.now() < conf.biasUntil && Math.random() < 0.72) {
      const biased = sources.filter((s) => s.host === conf.biasHost);
      if (biased.length) return pick(biased);
    }
    return pick(sources);
  }

  function tick() {
    if (stopped) return;
    const s = chooseSource();
    onMessage(normalize({ host: s.host, platform: s.platform, user: pick(USERS), text: pick(LINES) }));
    const base = conf.cadenceMs;
    timer = setTimeout(tick, base * 0.7 + Math.random() * base * 0.6);
  }
  tick();
  return { close() { stopped = true; clearTimeout(timer); } };
}
