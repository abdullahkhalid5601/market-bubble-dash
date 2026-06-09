import { useMemo, useState } from 'react';
import { PolymarketLogo } from './logos.jsx';
import TradingViewWidget from './TradingViewWidget.jsx';

const fmtPrice = (p) => {
  if (p == null) return '—';
  if (p >= 1000) return p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (p >= 1) return p.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return p.toLocaleString('en-US', { maximumFractionDigits: 4 });
};
const fmtPct = (p) => (p == null ? '—' : `${p >= 0 ? '+' : ''}${p.toFixed(2)}%`);
const fmtVol = (v) => (v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(1)}K` : `$${Math.round(v)}`);

function Spark({ data, up }) {
  if (!data || data.length < 2) return <span className="spk-empty" />;
  const min = Math.min(...data), max = Math.max(...data), span = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${28 - ((v - min) / span) * 24 - 2}`).join(' ');
  return (
    <svg className="spk" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={up ? 'var(--up)' : 'var(--breaking)'} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Row({ r }) {
  const up = (r.pct ?? 0) >= 0;
  return (
    <div className="gm-row">
      <span className="gm-name">
        {r.img ? <img className="gm-logo" src={r.img} alt="" loading="lazy" /> : null}
        {r.name}
      </span>
      <span className="gm-px tnum">{r.price == null ? '—' : `$${fmtPrice(r.price)}`}</span>
      <span className={`gm-pct ${r.pct == null ? 'na' : up ? 'up' : 'down'}`}>{fmtPct(r.pct)}</span>
      <span className="gm-spk">{r.spark?.length ? <Spark data={r.spark} up={up} /> : null}</span>
    </div>
  );
}

// ---- TradingView configs (the source the user provided, themed to edition) ----
const tickerSymbols = {
  crypto: [
    { proName: 'BITSTAMP:BTCUSD', title: 'Bitcoin' },
    { proName: 'BITSTAMP:ETHUSD', title: 'Ethereum' },
    { proName: 'BINANCE:SOLUSD', title: 'Solana' },
    { proName: 'BINANCE:BNBUSD', title: 'BNB' },
    { proName: 'BITSTAMP:XRPUSD', title: 'XRP' },
    { proName: 'CMCMARKETS:GOLD', title: 'Gold' },
  ],
  stocks: [
    { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
    { proName: 'FOREXCOM:NSXUSD', title: 'Nasdaq 100' },
    { proName: 'FOREXCOM:DJI', title: 'Dow 30' },
    { proName: 'NASDAQ:AAPL', title: 'Apple' },
    { proName: 'NASDAQ:NVDA', title: 'Nvidia' },
    { proName: 'NASDAQ:TSLA', title: 'Tesla' },
  ],
};

// Top-stories news timeline — follows the toggle (crypto vs stock market news).
const TIMELINE_SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
const timelineCfg = (market, theme) => ({
  feedMode: 'market',
  market: market === 'crypto' ? 'crypto' : 'stock',
  displayMode: 'regular',
  colorTheme: theme,
  isTransparent: true,
  locale: 'en',
  width: '100%',
  height: '100%',
});

const HEATMAP = {
  crypto: {
    script: 'https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js',
    cfg: (theme) => ({
      dataSource: 'Crypto', blockSize: 'market_cap_calc', blockColor: '24h_close_change|5',
      locale: 'en', symbolUrl: '', colorTheme: theme, hasTopBar: false, isDataSetEnabled: false,
      isZoomEnabled: true, hasSymbolTooltip: true, isMonoSize: false, width: '100%', height: '100%',
    }),
  },
  stocks: {
    script: 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js',
    cfg: (theme) => ({
      dataSource: 'SPX500', blockSize: 'market_cap_basic', blockColor: 'change', grouping: 'sector',
      locale: 'en', symbolUrl: '', colorTheme: theme, exchanges: [], hasTopBar: false, isDataSetEnabled: false,
      isZoomEnabled: true, hasSymbolTooltip: true, isMonoSize: false, width: '100%', height: '100%',
    }),
  },
};

export default function MarketsPage({ data, news = [], edition = 'evening' }) {
  const [market, setMarket] = useState('crypto'); // crypto | stocks
  const theme = edition === 'morning' ? 'light' : 'dark';
  const d = data || {};
  const crypto = d.crypto || [];
  const updated = useMemo(() => (d.updated ? new Date(d.updated).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'), [d.updated]);

  const tickerCfg = useMemo(() => ({
    symbols: tickerSymbols[market], showSymbolLogo: true, isTransparent: true,
    displayMode: 'adaptive', colorTheme: theme, locale: 'en',
  }), [market, theme]);

  const heat = HEATMAP[market];
  const heatCfg = useMemo(() => heat.cfg(theme), [heat, theme]);

  // Left rail = live Polymarket embeds (top volume markets that expose a slug).
  const pmMarkets = (d.polymarket || []).filter((m) => m.slug).slice(0, 6);

  return (
    <div className="page page-markets-term">
      {/* ---- masthead bar: section title · Crypto/Stocks toggle ---- */}
      <div className="mt-bar">
        <div className="mt-bar-l">
          <h1 className="mt-title">The Markets</h1>
          <span className="mt-updated">Live · updated {updated}</span>
        </div>
        <div className="mt-seg" data-active={market}>
          <span className="mt-seg-thumb" />
          <button className={market === 'crypto' ? 'active' : ''} onClick={() => setMarket('crypto')}>Crypto</button>
          <button className={market === 'stocks' ? 'active' : ''} onClick={() => setMarket('stocks')}>Stock Market</button>
        </div>
      </div>

      {/* ---- TradingView ticker tape strip ---- */}
      <div className="mt-tape">
        <TradingViewWidget
          key={`tape-${market}-${theme}`}
          script="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"
          config={tickerCfg}
        />
      </div>

      <div className="mt-grid">
        {/* LEFT — Smart Money: live Polymarket embeds (top volume) */}
        <section className="mt-panel mt-panel-pm">
          <div className="mt-head"><h2><PolymarketLogo size={17} /> Smart Money</h2></div>
          <div className="sm-sub">Top Polymarket Volume</div>
          <div className="pm-embed-list">
            {pmMarkets.length ? pmMarkets.map((m, i) => (
              <figure className="pm-embed" key={m.slug || i}>
                <iframe
                  title={m.q}
                  src={`https://embed.polymarket.com/market?market=${m.slug}&theme=${theme}&liveactivity=true&height=300`}
                  allowTransparency="true"
                />
                <a className="pm-embed-link" href={`https://polymarket.com/market/${m.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`${m.q} — view on Polymarket`} />
              </figure>
            )) : Array.from({ length: 3 }).map((_, i) => <div className="pm-embed sk" key={i} />)}
          </div>
        </section>

        {/* CENTER — TradingView heatmap (crypto / stock) */}
        <section className="mt-panel mt-panel-heat">
          <div className="mt-head">
            <h2>{market === 'crypto' ? 'Crypto Heatmap' : 'S&P 500 Heatmap'}</h2>
            <span className="mt-upd">{market === 'crypto' ? 'by market cap · 24h change' : 'by sector · daily change'}</span>
          </div>
          <div className="tv-heat">
            <TradingViewWidget key={`heat-${market}-${theme}`} script={heat.script} config={heatCfg} />
          </div>
        </section>

        {/* RIGHT — News (TradingView Top Stories, full height) */}
        <section className="mt-panel mt-panel-news">
          <div className="mt-head"><h3>News Intelligence Feed</h3><span className="mt-upd">{market === 'crypto' ? 'Crypto wire' : 'Markets wire'}</span></div>
          <div className="tv-timeline tv-timeline-fill">
            <TradingViewWidget key={`news-${market}-${theme}`} script={TIMELINE_SCRIPT} config={timelineCfg(market, theme)} />
          </div>
        </section>
      </div>
    </div>
  );
}
