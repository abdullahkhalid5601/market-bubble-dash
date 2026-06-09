import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { userColor, hostColor, hostName, formatTime, PLATFORM_META } from '../data/mb.js';
import { PlatformLogo, ExpandIcon } from './logos.jsx';
import Composer from './Composer.jsx';

// Render only the most recent slice — the buffer holds up to 600 for stats, but
// painting them all on every new message is what makes the feed stutter.
const MAX_VISIBLE = 120;

function PlatformHoverTag({ platform }) {
  const meta = PLATFORM_META[platform] || { name: platform?.toUpperCase() };
  return (
    <span className="hover-tag" aria-hidden="true">
      <span className={`hover-glyph ${platform}`}>
        {platform === 'mb' ? <img className="hg-mb" src="/mb-logo.png" alt="" /> : <PlatformLogo id={platform} size={13} />}
      </span>
      <span>{meta.name}</span>
    </span>
  );
}

// Memoized so a re-render of the list only repaints the rows that actually
// changed (the new one + the one losing `newest`), not every visible brief.
const Brief = memo(function Brief({ msg, newest, showHost }) {
  return (
    <article className={`brief ${newest ? 'newest' : ''}`} style={{ '--u-c': userColor(msg.user), '--host-c': hostColor(msg.host) }}>
      <div className="head">
        <span className="ts">{formatTime(msg.ts)}</span>
        <span className="user">{msg.user}</span>
        {showHost ? <span className="host">· {hostName(msg.host)}</span> : null}
      </div>
      <p className="text">{msg.text}</p>
      <PlatformHoverTag platform={msg.platform} />
    </article>
  );
});

export default function ChatColumn({ messages, msgsPerMin, title = 'The Chat', accent = null, showHost = true, onContextMenu, onExpand, onSend, user, onSignIn, onSignOut }) {
  const listRef = useRef(null);
  const stickRef = useRef(true);
  const frozenRef = useRef([]);     // the snapshot shown while paused
  const pauseLenRef = useRef(0);    // buffer length at the moment we paused
  const [paused, setPaused] = useState(false);
  const [newCount, setNewCount] = useState(0);

  const liveView = messages.length > MAX_VISIBLE ? messages.slice(messages.length - MAX_VISIBLE) : messages;
  // While paused (scrolled up), freeze the rendered list so incoming messages
  // don't push the view — just like Twitch/Kick's "chat paused" behaviour.
  const view = paused ? frozenRef.current : liveView;

  // Count buffered messages while paused so the pill can show how many are new.
  useEffect(() => {
    if (paused) setNewCount(Math.max(0, messages.length - pauseLenRef.current));
  }, [messages, paused]);

  // Pin to the bottom only while live (not paused) and stuck to the bottom.
  useLayoutEffect(() => {
    if (paused) return;
    const el = listRef.current;
    if (!el || !stickRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, paused]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const isAway = el.scrollHeight - el.scrollTop - el.clientHeight > 80;
    stickRef.current = !isAway;
    if (isAway && !paused) {
      frozenRef.current = liveView;          // freeze what's on screen now
      pauseLenRef.current = messages.length;
      setNewCount(0);
      setPaused(true);
    } else if (!isAway && paused) {
      setPaused(false);
    }
  };

  const jumpToPresent = () => {
    stickRef.current = true;
    setPaused(false);
    setNewCount(0);
    // scroll happens in the layout effect once the live list renders
    requestAnimationFrame(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; });
  };

  const accentC = accent === 'banks' ? 'var(--banks)' : accent === 'ansem' ? 'var(--ansem)' : null;

  return (
    <div className="chat-col">
      <div className="col-head">
        <span className="label" style={accentC ? { '--accent-c': accentC } : undefined}>
          {accent ? <span className="swatch" /> : null}
          {title}
        </span>
        <div className="col-head-right">
          <span className="count"><span className="live-dot" />{msgsPerMin}/MIN</span>
          {onExpand ? (
            <button type="button" className="expand-btn" onClick={onExpand} title="Full-screen chat" aria-label="Full-screen chat">
              <ExpandIcon size={14} />
            </button>
          ) : null}
        </div>
      </div>
      <div className="chat-list-wrap">
        <div className="chat-list" ref={listRef} onScroll={onScroll} onContextMenu={onContextMenu}>
          {view.map((m, i) => (
            <Brief key={m.id} msg={m} newest={i === view.length - 1} showHost={showHost} />
          ))}
        </div>
        <button type="button" className={`sync-pill ${paused ? 'show' : ''}`} onClick={jumpToPresent} aria-label="Jump to present">
          <span className="arrow">↓</span>
          <span>{newCount > 0 ? `${newCount} new message${newCount === 1 ? '' : 's'}` : 'Jump to Present'}</span>
        </button>
      </div>
      {onSend ? <Composer onSend={onSend} user={user} onSignIn={onSignIn} onSignOut={onSignOut} /> : null}
    </div>
  );
}
