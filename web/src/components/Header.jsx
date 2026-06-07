import Segmented from './Segmented.jsx';
import MarketBubbleLogo from './MarketBubbleLogo.jsx';

export default function Header({ dateText, mode, onMode, viewers, edition, onEdition }) {
  return (
    <header className="header">
      <div className="kicker">
        <span className="line">Make Money</span>
        <span className="line">Command Attention</span>
        <span className="line">Leverage AI</span>
      </div>

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
