// Adapter registry. Live adapters share the common per-source interface:
//   connect({ source, onMessage, onStatus }) -> { close() }
// mock and replay are whole-feed adapters (one instance, started by the gateway).
import * as twitch from './twitch.js';
import * as kick from './kick.js';
import * as x from './x.js';

export const liveAdapters = {
  twitch: twitch.connect,
  kick: kick.connect,
  x: x.connect,
};
