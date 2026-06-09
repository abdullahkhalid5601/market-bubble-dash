// Optional: Twitch Helix for real live state + viewer_count. Needs a free
// Twitch app's TWITCH_CLIENT_ID + TWITCH_CLIENT_SECRET (client-credentials).
// Dormant without them — the UI falls back to seed viewer numbers.
let cache = { token: null, exp: 0 };

async function getToken() {
  const id = process.env.TWITCH_CLIENT_ID;
  const secret = process.env.TWITCH_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (cache.token && Date.now() < cache.exp) return cache.token;
  try {
    const res = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${id}&client_secret=${secret}&grant_type=client_credentials`,
      { method: 'POST', signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const j = await res.json();
    cache = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 - 60000 };
    return cache.token;
  } catch {
    return null;
  }
}

// Returns { live, viewers, startedAt } | null.
export async function getTwitchStatus(login) {
  if (!login) return null;
  try {
    const token = await getToken();
    if (!token) return null;
    const res = await fetch(`https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(login)}`, {
      headers: { 'Client-Id': process.env.TWITCH_CLIENT_ID, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const s = Array.isArray(j.data) ? j.data[0] : null;
    if (!s) return { live: false, viewers: 0, startedAt: null };
    return { live: true, viewers: s.viewer_count || 0, startedAt: s.started_at || null };
  } catch {
    return null;
  }
}

// Resolve what to PLAY and what to SAY: live channel + title if live, else the
// latest archived VOD (its id, title and view count). Everything here is real
// data from Helix — title drives the on-screen stream caption.
// Returns { live, viewers, videoId, title, startedAt, lastViews } | null.
export async function getTwitchStream(login) {
  if (!login) return null;
  try {
    const token = await getToken();
    if (!token) return null;
    const headers = { 'Client-Id': process.env.TWITCH_CLIENT_ID, Authorization: `Bearer ${token}` };
    const u = await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(login)}`, { headers, signal: AbortSignal.timeout(8000) });
    if (!u.ok) return null;
    const user = (await u.json()).data?.[0];
    if (!user) return null;
    const s = await fetch(`https://api.twitch.tv/helix/streams?user_id=${user.id}`, { headers, signal: AbortSignal.timeout(8000) });
    const stream = s.ok ? (await s.json()).data?.[0] : null;
    // Always look up the latest archive too (its title is the "last stream").
    const v = await fetch(`https://api.twitch.tv/helix/videos?user_id=${user.id}&type=archive&first=1`, { headers, signal: AbortSignal.timeout(8000) });
    const vod = v.ok ? (await v.json()).data?.[0] : null;
    if (stream) {
      return { live: true, viewers: stream.viewer_count || 0, videoId: null, title: stream.title || '', startedAt: stream.started_at || null, lastViews: vod?.view_count || 0 };
    }
    return { live: false, viewers: 0, videoId: vod?.id || null, title: vod?.title || '', startedAt: vod?.published_at || null, lastViews: vod?.view_count || 0 };
  } catch {
    return null;
  }
}

export const twitchApiConfigured = () => Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET);
