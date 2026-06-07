// Optional: Kick's OFFICIAL API for authoritative current live-state. Only used
// if KICK_CLIENT_ID + KICK_CLIENT_SECRET are set (free Kick developer app, OAuth
// 2.1 client-credentials). Without them this is dormant and we fall back to the
// Pusher StreamerIsLive / StopStreamBroadcast transition events.
let cache = { token: null, exp: 0 };

async function getToken() {
  const id = process.env.KICK_CLIENT_ID;
  const secret = process.env.KICK_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (cache.token && Date.now() < cache.exp) return cache.token;
  try {
    const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret });
    const res = await fetch('https://id.kick.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const j = await res.json();
    cache = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 - 60000 };
    return cache.token;
  } catch {
    return null;
  }
}

// Returns true | false | null(unknown).
export async function getKickLive(slug) {
  if (!slug) return null;
  try {
    const token = await getToken();
    if (!token) return null;
    const res = await fetch(`https://api.kick.com/public/v1/channels?slug=${encodeURIComponent(slug)}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const ch = Array.isArray(j.data) ? j.data[0] : null;
    if (!ch) return null;
    if (typeof ch.stream?.is_live === 'boolean') return ch.stream.is_live;
    if ('livestream' in ch) return ch.livestream !== null;
    return null;
  } catch {
    return null;
  }
}

// Returns { live, viewers } | null.
export async function getKickStatus(slug) {
  if (!slug) return null;
  try {
    const token = await getToken();
    if (!token) return null;
    const res = await fetch(`https://api.kick.com/public/v1/channels?slug=${encodeURIComponent(slug)}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const ch = Array.isArray(j.data) ? j.data[0] : null;
    if (!ch) return null;
    const live = typeof ch.stream?.is_live === 'boolean' ? ch.stream.is_live : 'livestream' in ch ? ch.livestream !== null : false;
    const viewers = ch.stream?.viewer_count ?? ch.stream?.viewers ?? ch.livestream?.viewer_count ?? 0;
    return { live, viewers };
  } catch {
    return null;
  }
}

export const kickApiConfigured = () => Boolean(process.env.KICK_CLIENT_ID && process.env.KICK_CLIENT_SECRET);
