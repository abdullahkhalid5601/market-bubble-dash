import { useState } from 'react';
import { userColor, hostColor, hostName } from '../data/mb.js';

const PARENT = typeof location !== 'undefined' ? location.hostname : 'localhost';

// Build the player URL: live channel when live, latest VOD (videoId) when the
// gateway resolved one (offline), else the channel embed.
function twitchSrc({ live, videoId }) {
  if (!live && videoId) return `https://player.twitch.tv/?video=v${String(videoId).replace(/^v/, '')}&parent=${PARENT}&autoplay=true&muted=true`;
  return `https://player.twitch.tv/?channel=fazebanks&parent=${PARENT}&autoplay=true&muted=true`;
}

// The live window — real embedded player, with an optional transparent chat
// overlay floating on top of the video (toggle, top-right).
export default function StreamFrame({ title, streamTitle = '', lastViews = 0, watch = 'banks', live = false, videoId = null, messages = [] }) {
  const isBanks = watch === 'banks';
  const [showChat, setShowChat] = useState(false);
  const src = isBanks ? twitchSrc({ live, videoId }) : `https://player.kick.com/ansem?autoplay=true&muted=true`;
  const overlay = messages.slice(-10);
  // Real title from Twitch: current stream when live, latest VOD when offline.
  const caption = (streamTitle && streamTitle.trim()) || title;
  const hasTitle = Boolean(caption && caption.trim());
  const fmtViews = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${n}`);

  return (
    <div className="stream-col">
      <div className="stream-frame">
        <iframe
          title="live stream"
          src={src}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        />
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
            <span className={`cap-flag ${live ? 'live' : 'last'}`}>{live ? 'LIVE' : 'LAST STREAM'}</span>
            <span className="cap-title">“{caption}”</span>
            <span className="cap-sep">·</span>
            <span className="cap-host">with {isBanks ? 'FaZeBanks' : 'Ansem'}</span>
            {!live && lastViews ? <span className="cap-views">{fmtViews(lastViews)} views</span> : null}
          </>
        ) : (
          <span className="cap-title cap-soon">The next livestream title will appear here when {isBanks ? 'FaZeBanks' : 'Ansem'} goes live</span>
        )}
      </p>
    </div>
  );
}
