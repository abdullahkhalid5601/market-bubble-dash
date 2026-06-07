// Raw payload -> the ONE normalized shape the whole app consumes:
//   { id, host, platform, user, text, ts }
let seq = 0;

export function normalize({ host, platform, user, text, ts }) {
  seq = (seq + 1) % Number.MAX_SAFE_INTEGER;
  return {
    id: `${host}:${platform}:${Date.now()}:${seq}`,
    host,
    platform,
    user: String(user || 'anon').slice(0, 40),
    text: String(text == null ? '' : text).slice(0, 400),
    ts: ts || Date.now(),
  };
}
