// Live News feed — pulls Market Bubble's own content API (the same data the
// marketbubble.vercel.app/content page renders). It returns real tweets with
// media, video clips, metrics and permalinks, and needs no API key, so it's
// the primary source. We poll it every couple of minutes so the dashboard
// reflects new posts within minutes of the site updating.
const CONTENT_API = process.env.MB_CONTENT_API || 'https://marketbubble.vercel.app/api/x-feed';
const HANDLE = (process.env.NEWS_HANDLE || 'MarketBubble').replace(/^@/, '');

const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' };

// Always available — the source is keyless.
export const newsConfigured = () => true;

function shortTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export async function getNews() {
  try {
    const res = await fetch(`${CONTENT_API}?handle=${encodeURIComponent(HANDLE)}`, {
      headers: UA,
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) return [];
    const j = await res.json();
    const tweets = Array.isArray(j.tweets) ? j.tweets : Array.isArray(j) ? j : [];
    return tweets
      .filter((t) => t && (t.text || (t.media && t.media.length) || t.videoUrl))
      .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
      .slice(0, 40)
      .map((t) => {
        const handle = (t.author || `@${HANDLE}`).replace(/^@/, '');
        return {
          id: t.id,
          handle,
          title: t.title || t.text || '',
          text: t.text || t.title || '',
          ts: shortTime(t.publishedAt),
          publishedAt: t.publishedAt || null,
          url: t.url || `https://x.com/${handle}/status/${t.id}`,
          media: Array.isArray(t.media) && t.media.length ? t.media[0] : null,
          video: t.videoUrl || null,
          duration: Number.isFinite(t.duration) ? t.duration : null,
          metrics: t.metrics || null,
          rt: Boolean(t.isRetweet),
        };
      });
  } catch {
    return [];
  }
}
