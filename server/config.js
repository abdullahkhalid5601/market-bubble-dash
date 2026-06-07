// Single source of truth for the show. Adding a host or a platform — or a 5th
// source — is a data change here, never a code change.
export const hosts = {
  banks: { id: 'banks', name: 'BANKS', accent: '#f5b73f' },
  ansem: { id: 'ansem', name: 'ANSEM', accent: '#4ad6ff' },
};

export const platforms = {
  twitch: { id: 'twitch', name: 'Twitch', tag: 'TW', color: '#b389ff' },
  kick: { id: 'kick', name: 'Kick', tag: 'KK', color: '#53fc18' },
  x: { id: 'x', name: 'X', tag: 'X', color: '#e7e9ea' },
};

// The atomic unit is a source = (host × platform). `handle` is what the live
// adapter needs: a Twitch channel, a Kick chatroom id, an X query/handle.
export const sources = [
  { host: 'banks', platform: 'twitch', handle: process.env.BANKS_TWITCH || 'fazebanks' },
  { host: 'banks', platform: 'x', handle: process.env.BANKS_X || 'fazebanks' },
  { host: 'ansem', platform: 'x', handle: process.env.ANSEM_X || 'blknoiz06' },
  // Ansem's real Kick room. handle = chatroom id (chat); channelId = channel id
  // (live events); slug = for the official-API live check.
  {
    host: 'ansem',
    platform: 'kick',
    handle: process.env.ANSEM_KICK_CHATROOM || '108796898',
    channelId: process.env.ANSEM_KICK_CHANNEL_ID || '109086406',
    slug: process.env.ANSEM_KICK_SLUG || 'ansem',
  },
];

export const sourceId = (s) => `${s.host}:${s.platform}`;
