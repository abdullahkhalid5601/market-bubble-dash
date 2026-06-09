import { useState } from 'react';

// Comment into the shared live chat. Locked until the viewer signs in.
export default function Composer({ onSend, user, onSignIn, onSignOut }) {
  const [text, setText] = useState('');

  if (!user) {
    return (
      <button type="button" className="composer-signin" onClick={onSignIn}>
        Sign in to join the chat
      </button>
    );
  }

  const submit = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText('');
  };

  return (
    <form className="composer" onSubmit={submit}>
      <button type="button" className="composer-handle composer-handle-btn" onClick={onSignOut} title="Sign out">{user}</button>
      <input
        className="composer-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Join the chat…"
        maxLength={300}
        aria-label="Send a message"
      />
      <button type="submit" className="composer-send" disabled={!text.trim()} aria-label="Send">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h13M13 6l6 6-6 6" />
        </svg>
      </button>
    </form>
  );
}
