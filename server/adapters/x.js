// X (Twitter) is the hard, paid leg — and there are two of them (Banks + Ansem).
// X has no native live-chat; you'd pull replies to the broadcast post via a
// filtered stream on conversation_id. As of 2026 the free tier is gone: it's
// pay-per-use (~$0.005 per post read), filtered stream is 1 concurrent
// connection with monthly read caps. So this is a DELIBERATE, documented stub:
// it conforms to the adapter interface and emits nothing in `live` unless an
// X_FEED endpoint (direct API or a third-party X stream reseller webhook) is
// wired in. Use mock/replay for X on stage.
export function connect({ source, onStatus }) {
  if (!process.env.X_FEED) {
    onStatus?.('stub', 'X live disabled — no X_FEED (paid, see README)');
    return { close() {} };
  }
  // Intentionally not implemented: wire your configured X_FEED endpoint here.
  onStatus?.('stub', 'X_FEED set but adapter not implemented — see README');
  return { close() {} };
}
