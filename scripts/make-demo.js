import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Generate a seed recordings/demo.jsonl so FEED_MODE=replay works immediately.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LINES = [
  'wagmi', 'ngmi tbh', 'ser the chart', '100x or nothing', 'is this financial advice lol',
  'few understand', 'number go up', 'liquidated again 💀', 'diamond hands only', 'lfg',
  'banks vs ansem who wins', 'ansem cooking rn', 'zoom out', 'rugged AGAIN', 'wen lambo',
  'green candle incoming', 'cope harder', 'we are so back', "it's so over", 'send it',
];
const USERS = ['degenape', '0xWhale', 'chartwizard', 'gmfrenz', 'moonboy42', 'bagholder99', 'rektrachel', 'ngmikid'];
const SOURCES = [
  { host: 'banks', platform: 'twitch' }, { host: 'banks', platform: 'x' },
  { host: 'ansem', platform: 'x' }, { host: 'ansem', platform: 'kick' },
];
const pick = (a) => a[(Math.random() * a.length) | 0];

let ts = 0;
const rows = [];
for (let i = 0; i < 80; i++) {
  ts += 700 + Math.floor(Math.random() * 1100);
  const s = pick(SOURCES);
  rows.push({ host: s.host, platform: s.platform, user: pick(USERS), text: pick(LINES), ts });
}
const out = path.join(__dirname, '..', 'recordings', 'demo.jsonl');
fs.writeFileSync(out, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
console.log('wrote', out, rows.length, 'rows');
