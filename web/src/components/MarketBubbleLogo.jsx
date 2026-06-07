// Masthead wordmark — the exact MARKET BUBBLE image. The white background is
// dropped via per-edition blend (see .mb-mast in index.css) so it sits cleanly
// on both the dark and light paper.
export default function MarketBubbleLogo({ className = '' }) {
  return <img className={`mb-mast ${className}`} src="/masthead.png" alt="Market Bubble" draggable="false" />;
}
