import { useLayoutEffect, useRef, useState } from 'react';

// Apple segmented control with a sliding thumb.
export default function Segmented({ value, options, onChange, className = '' }) {
  const ref = useRef(null);
  const [thumb, setThumb] = useState(null);
  const idx = options.findIndex((o) => o.id === value);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const btn = el.querySelectorAll('button')[idx];
    if (!btn) return;
    setThumb({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [idx, options.length]);

  return (
    <div className={`segmented ${className}`} ref={ref}>
      {thumb ? <span className="thumb" style={{ transform: `translateX(${thumb.left - 3}px)`, width: thumb.width }} /> : null}
      {options.map((o) => (
        <button key={o.id} className={o.id === value ? 'active' : ''} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
