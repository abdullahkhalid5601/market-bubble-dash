import fs from 'node:fs';
import readline from 'node:readline';
import { normalize } from '../normalize.js';

// Plays back a recorded .jsonl of normalized messages at their original spacing,
// looping forever. Indistinguishable from live for an on-stage demo.
export function start({ file, onMessage, onStatus }) {
  let stopped = false;
  let timer = null;

  async function load() {
    const rows = [];
    try {
      const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
      for await (const line of rl) {
        const t = line.trim();
        if (!t) continue;
        try { rows.push(JSON.parse(t)); } catch { /* skip bad line */ }
      }
    } catch {
      onStatus?.('error', `cannot read ${file}`);
      return [];
    }
    return rows;
  }

  (async () => {
    const rows = await load();
    if (!rows.length) {
      onStatus?.('error', 'replay file empty — record one with npm run record');
      return;
    }
    onStatus?.('ok', `replaying ${rows.length} messages`);

    let i = 0;
    function step() {
      if (stopped) return;
      const row = rows[i];
      // Re-id + restamp so replayed messages look freshly live.
      onMessage(normalize({ host: row.host, platform: row.platform, user: row.user, text: row.text }));
      const next = (i + 1) % rows.length;
      // Gap to the next message; loop wrap uses a 1.5s breather.
      let gap = next === 0 ? 1500 : Math.max(60, (rows[next].ts || 0) - (row.ts || 0));
      if (!Number.isFinite(gap)) gap = 800;
      i = next;
      timer = setTimeout(step, Math.min(gap, 8000));
    }
    step();
  })();

  return { close() { stopped = true; clearTimeout(timer); } };
}
