import { PolymarketLogo } from './logos.jsx';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="l">“Invest in Yourself”</div>
      <div className="c">
        Live<span className="dot">·</span>Thursdays<span className="dot">·</span>1PM PST
      </div>
      <div className="r">
        <span className="presented">Presented by</span>
        <span className="polymark"><PolymarketLogo size={16} />Polymarket</span>
      </div>
    </footer>
  );
}
