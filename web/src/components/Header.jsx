import Segmented from './Segmented.jsx';
import MarketBubbleLogo from './MarketBubbleLogo.jsx';

const NAV = [['home', 'Home'], ['markets', 'Markets'], ['news', 'Content']];

export default function Header({ dateText, mode, onMode, viewers, edition, onEdition, page = 'home', onPage }) {
  return (
    <header className="header">
      {/* Kicker is now the site nav — same serif small-caps */}
      <nav className="kicker kicker-nav">
        {NAV.map(([id, label]) => (
          <button key={id} className={`line ${page === id ? 'active' : ''}`} onClick={() => onPage && onPage(id)}>{label}</button>
        ))}
      </nav>

      <div className="nameplate-wrap">
        <MarketBubbleLogo />
        <div className="nameplate-sub">{dateText}</div>
      </div>

      <div className="header-right">
        <Segmented value={mode} onChange={onMode} options={[{ id: 'unified', label: 'Unified' }, { id: 'separate', label: 'Separate' }]} />
        <Segmented value={edition} onChange={onEdition} options={[{ id: 'evening', label: 'Evening' }, { id: 'morning', label: 'Morning' }]} />
        <span className="live-readout">
          <span className="dot" />
          <b className="tnum">{viewers.toLocaleString('en-US')}</b> watching
        </span>
      </div>
    </header>
  );
}
