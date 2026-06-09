import { useEffect, useRef, useState } from 'react';
import { userColor, hostColor, hostName } from '../data/mb.js';

const PARENT = typeof location !== 'undefined' ? location.hostname : 'localhost';

// Build the Twitch player URL: live channel when live, latest VOD (videoId)
// when the gateway resolved one, else the plain channel embed.
function twitchSrc({ live, videoId }) {
  if (!live && videoId) return `https://player.twitch.tv/?video=v${String(videoId).replace(/^v/, '')}&parent=${PARENT}&autoplay=true&muted=true`;
  return `https://player.twitch.tv/?channel=fazebanks&parent=${PARENT}&autoplay=true&muted=true`;
}

// The live window. Priority: LIVE stream → latest VOD → (bulletproof fallback)
// the most recent Market Bubble clip, so it's never the empty Twitch offline
// page. Optional transparent chat overlay floats on top.
export default function StreamFrame({ title, streamTitle = '', lastViews = 0, watch = 'banks', live = false, videoId = null, clip = null, messages = [] }) {
  const isBanks = watch === 'banks';
  const [showChat, setShowChat] = useState(false);
  const clipRef = useRef(null);
  const overlay = messages.slice(-10);

  // Show the clip only when there's no live stream and no resolvable VOD (e.g.
  // Twitch creds missing or no archive) — guarantees something always plays.
  const useClip = isBanks && !live && !videoId && Boolean(clip?.video);

  // React's `muted` attribute on <video> is unreliable, so the browser can see
  // it as unmuted and block autoplay (black frame). Force muted + play via ref.
  useEffect(() => {
    if (!useClip) return;
    const v = clipRef.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
  }, [useClip, clip?.video]);
  const src = isBanks ? twitchSrc({ live, videoId }) : `https://player.kick.com/ansem?autoplay=true&muted=true`;

  const fmtViews = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${n}`);
  const caption = useClip ? (clip.title || title) : ((streamTitle && streamTitle.trim()) || title);
  const hasTitle = Boolean(caption && caption.trim());
  const flagLabel = live ? 'LIVE' : useClip ? 'LATEST CLIP' : 'LAST STREAM';

  return (
    <div className="stream-col">
      <div className="stream-frame">
        {useClip ? (
          <video
            ref={clipRef}
            className="stream-clip"
            src={clip.video}
            poster={clip.media || undefined}
            autoPlay muted loop playsInline preload="auto"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', border: 0 }}
          />
        ) : (
          <iframe
            title="live stream"
            src={src}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        )}

        <span className={`stream-status ${live ? 'on' : 'off'}`}>
          <span className="ss-dot" />{live ? 'LIVE' : 'OFFLINE'}
        </span>

        {showChat ? (
          <div className="stream-chat-overlay" aria-hidden="true">
            {overlay.map((m) => (
              <div key={m.id} className="sco-line">
                <span className="sco-rail" style={{ background: hostColor(m.host) }} />
                <span className="sco-user" style={{ color: userColor(m.user) }}>{m.user}</span>
                <span className="sco-host" style={{ color: hostColor(m.host) }}>{hostName(m.host)}</span>
                <span className="sco-text">{m.text}</span>
              </div>
            ))}
          </div>
        ) : null}

        <button className={`stream-chat-toggle ${showChat ? 'on' : ''}`} onClick={() => setShowChat((v) => !v)} title="Overlay chat on the stream">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
          </svg>
          {showChat ? 'Hide chat' : 'Chat'}
        </button>
      </div>

      <p className="stream-caption">
        {hasTitle ? (
          <>
            <span className={`cap-flag ${live ? 'live' : 'last'}`}>{flagLabel}</span>
            <span className="cap-title">“{caption}”</span>
            <span className="cap-sep">·</span>
            <span className="cap-host">with {isBanks ? 'FaZeBanks' : 'Ansem'}</span>
            {!live && !useClip && lastViews ? <span className="cap-views">{fmtViews(lastViews)} views</span> : null}
          </>
        ) : (
          <span className="cap-title cap-soon">The next livestream title will appear here when {isBanks ? 'FaZeBanks' : 'Ansem'} goes live</span>
        )}
      </p>
    </div>
  );
}
