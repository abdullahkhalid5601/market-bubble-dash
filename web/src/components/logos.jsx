// Real platform brand logos as inline SVG. Color via CSS `fill: currentColor`.
const MB_LOGO_PATHS = {
  twitch: { vb: '0 0 24 24', d: ['M11.64 5.93h1.43v4.28h-1.43m3.93-4.28H17v4.28h-1.43M7 2L3.43 5.57v12.86h4.28V22l3.58-3.57h2.85L20.57 12V2m-1.43 9.29l-2.86 2.85h-2.85l-2.5 2.5v-2.5H7.71V3.43h11.43z'] },
  kick: { vb: '0 0 24 24', d: ['M3 3h5.5v7L13 3h6.5l-6 9 6 9H13l-4.5-7v7H3V3z'] },
  x: { vb: '0 0 24 24', d: ['M17.53 3h3.2l-7 8 8.23 10h-6.44l-5.05-6.6L8.6 21H5.4l7.49-8.56L5 3h6.6l4.56 6.03L17.53 3zm-1.12 16.1h1.77L8.18 4.82H6.28l10.13 14.28z'] },
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

export function PolymarketLogo({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="currentColor" aria-hidden="true">
      <path d="M4 3 L30 9.5 L30 14 L4 7.5 Z" />
      <path d="M4 10.5 L30 17 L30 21.5 L4 15 Z" opacity="0.65" />
      <path d="M4 18 L30 24.5 L30 33 L4 26.5 Z" />
    </svg>
  );
}
