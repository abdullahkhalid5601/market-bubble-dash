import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Appends incoming normalized messages to a timestamped .jsonl so a real live
// session can be captured once and replayed on stage. Enabled with RECORD=1.
export function createRecorder() {
  const dir = path.join(__dirname, '..', 'recordings');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `session-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`);
  const stream = fs.createWriteStream(file, { flags: 'a' });
  console.log(`[record] writing to ${file}`);
  return {
    write(msg) {
      stream.write(JSON.stringify({ host: msg.host, platform: msg.platform, user: msg.user, text: msg.text, ts: msg.ts }) + '\n');
    },
    close() { stream.end(); },
  };
}
