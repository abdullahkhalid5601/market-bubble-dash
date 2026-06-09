// Real platform brand logos as inline SVG. Color via CSS `fill: currentColor`.
const MB_LOGO_PATHS = {
  twitch: { vb: '0 0 24 24', d: ['M11.64 5.93h1.43v4.28h-1.43m3.93-4.28H17v4.28h-1.43M7 2L3.43 5.57v12.86h4.28V22l3.58-3.57h2.85L20.57 12V2m-1.43 9.29l-2.86 2.85h-2.85l-2.5 2.5v-2.5H7.71V3.43h11.43z'] },
  kick: { vb: '0 0 24 24', d: ['M3 3h5.5v7L13 3h6.5l-6 9 6 9H13l-4.5-7v7H3V3z'] },
  x: { vb: '0 0 24 24', d: ['M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'] },
  mb: { vb: '0 0 24 24', d: ['M4 4h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'] },
};

export function PlatformLogo({ id, size = 16, className = '' }) {
  const def = MB_LOGO_PATHS[id];
  if (!def) return null;
  return (
    <svg className={`plogo ${className}`} width={size} height={size} viewBox={def.vb} fill="currentColor" aria-hidden="true">
      {def.d.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

export function FullscreenIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}
export function PopoutIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3h7v7M21 3l-9 9M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
    </svg>
  );
}
export const ExpandIcon = FullscreenIcon;

// Official Polymarket mark — outlined leaning rectangle split into two
// triangles. Drawn with currentColor so it reads in both editions.
export function PolymarketLogo({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 36" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <g transform="skewX(-7)" style={{ transformOrigin: '20px 18px' }}>
        <path d="M11 4 H31 V32 H11 Z" />
        <path d="M11 4 L31 18 L11 32" />
      </g>
    </svg>
  );
}
