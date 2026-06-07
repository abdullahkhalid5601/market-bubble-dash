import { useLayoutEffect, useRef, useState } from 'react';
import { userColor, hostColor, hostName, formatTime, PLATFORM_META } from '../data/mb.js';
import { PlatformLogo, ExpandIcon } from './logos.jsx';
import Composer from './Composer.jsx';

function PlatformHoverTag({ platform }) {
  const meta = PLATFORM_META[platform] || { name: platform?.toUpperCase() };
  return (
    <span className="hover-tag" aria-hidden="true">
      <span className={`hover-glyph ${platform}`}><PlatformLogo id={platform} size={13} /></span>
      <span>{meta.name}</span>
    </span>
  );
}

function Brief({ msg, newest, showHost }) {
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
}

export default function ChatColumn({ messages, msgsPerMin, title = 'The Chat', accent = null, showHost = true, onContextMenu, onExpand, onSend, handle }) {
  const listRef = useRef(null);
  const stickRef = useRef(true);
  const [away, setAway] = useState(false);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el || !stickRef.current) return;
    el.scrollTop = el.scrollHeight;
  });

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const isAway = el.scrollHeight - el.scrollTop - el.clientHeight > 80;
    if (isAway !== away) setAway(isAway);
    stickRef.current = !isAway;
  };

  const jumpToPresent = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    stickRef.current = true;
    setAway(false);
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
          {messages.map((m, i) => (
            <Brief key={m.id} msg={m} newest={i === messages.length - 1} showHost={showHost} />
          ))}
        </div>
        <button type="button" className={`sync-pill ${away ? 'show' : ''}`} onClick={jumpToPresent} aria-label="Jump to present">
          <span className="arrow">↓</span>
          <span>Jump to Present</span>
        </button>
      </div>
      {onSend ? <Composer onSend={onSend} handle={handle} /> : null}
    </div>
  );
}
