// Shimmer skeletons shown while a page's code chunk and live data load.
export function NewsGridSkeleton({ count = 9 }) {
  return (
    <div className="page page-news">
      <div className="news-top">
        <div className="news-id"><h2>Content</h2><span className="news-handle">@MarketBubble</span></div>
        <div className="news-meta"><span className="sk sk-pill" /></div>
      </div>
      <div className="news-grid">
        {Array.from({ length: count }).map((_, i) => (
          <div className={`bento-card sk ${i % 9 === 0 ? 'bento-feat' : i % 5 === 3 ? 'bento-wide' : ''}`} key={i} />
        ))}
      </div>
    </div>
  );
}

export function MarketsSkeleton() {
  return (
    <div className="page page-markets-term">
      <div className="mt-bar">
        <div className="mt-bar-l"><div className="sk sk-title" /></div>
        <div className="sk sk-seg" />
      </div>
      <div className="sk sk-tape" />
      <div className="mt-grid">
        <div className="mt-panel"><div className="sk sk-fill" /></div>
        <div className="mt-panel"><div className="sk sk-fill" /></div>
        <div className="mt-panel"><div className="sk sk-fill" /></div>
      </div>
    </div>
  );
}
