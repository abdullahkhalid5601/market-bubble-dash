import { useState } from 'react';

// Lets a dashboard viewer comment into the shared live chat in real time.
export default function Composer({ onSend, handle }) {
  const [text, setText] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText('');
  };
  return (
    <form className="composer" onSubmit={submit}>
      <span className="composer-handle">{handle}</span>
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
