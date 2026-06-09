// Real market data — all free, no keys.
//  · CoinGecko   → crypto prices / 24h / sparklines
//  · Yahoo Finance → stock indices, commodities, single stocks
//  · Polymarket   → top prediction markets by volume

const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' };

const CRYPTO_IDS = 'bitcoin,ethereum,solana,hyperliquid,binancecoin,ripple,dogecoin,cardano,chainlink,avalanche-2,tron,sui';

async function getCrypto() {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CRYPTO_IDS}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`,
      { headers: UA, signal: AbortSignal.timeout(9000) }
    );
    if (!res.ok) return [];
    const j = await res.json();
    return j.map((c) => ({
      sym: (c.symbol || '').toUpperCase(),
      name: c.name,
      price: c.current_price,
      pct: c.price_change_percentage_24h ?? 0,
      spark: (c.sparkline_in_7d?.price || []).filter((_, i) => i % 6 === 0),
      img: c.image,
    }));
  } catch { return []; }
}

// Stocks / indices / commodities via Twelve Data (free key). Yahoo + Stooq both
// block server fetches now, so this is the reliable free path.
//
// Free-tier limits: 8 API credits / MINUTE and 800 / DAY, and each symbol in a
// batch quote costs 1 credit. So we (a) request ALL groups in ONE batched call
// (≤8 symbols) and (b) refresh at most every 15 min — 8 × 4/hr × 24 ≈ 768/day,
// safely under 800. Crypto + Polymarket are free and refresh every minute.
export const stocksConfigured = () => Boolean(process.env.TWELVEDATA_KEY);

// Kept to 8 symbols to fit the free tier's 8-credit/minute cap. Raw indices
// (SPX) and WTI crude are PREMIUM on Twelve Data — the free tier only serves
// US stocks/ETFs + forex metals, so we use the index-tracking ETFs (real,
// honest: labelled as the ETF ticker) plus Gold/Silver spot.
const TD = {
  indices: [['SPY', 'SPY · S&P 500'], ['QQQ', 'QQQ · Nasdaq 100'], ['DIA', 'DIA · Dow']],
  commodities: [['XAU/USD', 'Gold'], ['SLV', 'SLV · Silver']],
  stocks: [['TSLA', 'TSLA'], ['NVDA', 'NVDA'], ['AAPL', 'AAPL']],
};
const ALL_TD = [...TD.indices, ...TD.commodities, ...TD.stocks];

const blank = (list) => list.map(([, name]) => ({ sym: name, name, price: null, pct: null, spark: [] }));

// Cached Twelve Data snapshot + a 15-minute throttle so we never exceed 800/day.
let tdCache = { indices: blank(TD.indices), commodities: blank(TD.commodities), stocks: blank(TD.stocks), at: 0 };
const TD_TTL = 15 * 60 * 1000;

async function refreshTwelveData() {
  const key = process.env.TWELVEDATA_KEY;
  if (!key) return;
  if (Date.now() - tdCache.at < TD_TTL && tdCache.at) return; // throttle
  try {
    const symbols = ALL_TD.map((m) => m[0]).join(',');
    const res = await fetch(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbols)}&apikey=${key}`, { signal: AbortSignal.timeout(9000) });
    if (!res.ok) return;
    const j = await res.json();
    if (j && j.code) return; // 429 / error object — keep last good cache
    const pick = (list) => list.map(([sym, name]) => {
      const q = ALL_TD.length === 1 ? j : j[sym];
      const price = q && q.close != null ? Number(q.close) : null;
      const pct = q && q.percent_change != null ? Number(q.percent_change) : null;
      return { sym: name, name, price: Number.isFinite(price) ? price : null, pct: Number.isFinite(pct) ? pct : null, spark: [] };
    });
    tdCache = { indices: pick(TD.indices), commodities: pick(TD.commodities), stocks: pick(TD.stocks), at: Date.now() };
  } catch { /* keep last good cache */ }
}

async function getPolymarket() {
  try {
    const res = await fetch(
      'https://gamma-api.polymarket.com/markets?closed=false&active=true&order=volume24hr&ascending=false&limit=6',
      { headers: UA, signal: AbortSignal.timeout(9000) }
    );
    if (!res.ok) return [];
    const j = await res.json();
    const arr = Array.isArray(j) ? j : j.data || [];
    return arr.map((m) => {
      let prices = [];
      try { prices = JSON.parse(m.outcomePrices || '[]'); } catch { /* */ }
      const yes = Math.round((Number(prices[0]) || 0) * 100);
      const vol = Number(m.volume24hr || m.volume || 0);
      return { q: m.question || m.title || '', yes, no: 100 - yes, vol, slug: m.slug || '' };
    }).filter((m) => m.q);
  } catch { return []; }
}

export async function getMarketData() {
  const [crypto, , polymarket] = await Promise.all([
    getCrypto(), refreshTwelveData(), getPolymarket(),
  ]);
  return {
    crypto,
    indices: tdCache.indices,
    commodities: tdCache.commodities,
    stocks: tdCache.stocks,
    polymarket,
    updated: Date.now(),
    stocksAt: tdCache.at || null,
  };
}
