// Display config. Host accents live in CSS (--banks / --ansem, per edition);
// here we just map ids to labels and the platform tag colors from the brief.
export const HOSTS = {
  banks: { name: 'BANKS', accent: 'var(--banks)', desk: 'THE BANKS DESK' },
  ansem: { name: 'ANSEM', accent: 'var(--ansem)', desk: 'THE ANSEM DESK' },
};

export const PLATFORMS = {
  twitch: { tag: 'TWITCH', name: 'Twitch', color: '#8b6fd6' },
  kick: { tag: 'KICK', name: 'Kick', color: '#57a83f' },
  x: { tag: 'X', name: 'X', color: 'var(--ink-dim)' },
};

export const HOST_ORDER = ['banks', 'ansem'];

export const sid = (host, platform) => `${host}:${platform}`;
export const hostColor = (host) => (host === 'ansem' ? 'var(--ansem)' : 'var(--banks)');
