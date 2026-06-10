// Latest stream VOD via Market Bubble's own API (the same one the official site
// uses to play the stream). Keyless and reliable — no Twitch app creds needed —
// so the home window always has a VOD to play, even when our Twitch resolver
// can't reach Helix. Returns { videoId, title, lastViews, thumbnail } | null.
const BASE = (process.env.MB_TWITCH_API || 'https://marketbubble.vercel.app/api/twitch-videos');
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' };

export async function getLatestVod(channel = 'fazebanks') {
  try {
    const res = await fetch(`${BASE}?channel=${encodeURIComponent(channel)}&limit=1`, {
      headers: UA,
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const v = Array.isArray(j.videos) ? j.videos[0] : Array.isArray(j) ? j[0] : null;
    if (!v || !v.id) return null;
    return {
      videoId: String(v.id),
      title: v.title || '',
      lastViews: Number(v.viewCount) || 0,
      thumbnail: v.thumbnailUrl || null,
    };
  } catch {
    return null;
  }
}
