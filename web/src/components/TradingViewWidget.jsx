import { useEffect, useRef } from 'react';

// Generic TradingView embed wrapper. Injects the official embed script with a
// JSON config into a fresh container and tears it down on unmount / config
// change. `colorTheme` follows the active edition so the widget matches our
// evening / morning palettes. Re-mounts via React `key` when the data source
// flips (crypto ⇄ stocks).
//
// IMPORTANT: depend on the *serialized* config, not the object reference. The
// page re-renders frequently (live data + viewer ticks) and passes a fresh
// config object each time; keying the effect on the object would re-inject the
// script every render → the widget blinks / never finishes loading.
export default function TradingViewWidget({ script, config }) {
  const ref = useRef(null);
  const json = JSON.stringify(config);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.innerHTML = '';
    const mount = document.createElement('div');
    mount.className = 'tradingview-widget-container__widget';
    mount.style.height = '100%';
    mount.style.width = '100%';
    host.appendChild(mount);

    const s = document.createElement('script');
    s.src = script;
    s.type = 'text/javascript';
    s.async = true;
    s.innerHTML = json;
    host.appendChild(s);

    return () => { host.innerHTML = ''; };
  }, [script, json]);

  return <div className="tradingview-widget-container" ref={ref} style={{ height: '100%', width: '100%' }} />;
}
