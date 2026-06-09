import { useEffect, useRef, useState } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Decode the profile out of a Google ID-token JWT (no library needed).
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(payload))));
  } catch {
    return null;
  }
}

// Sign in with Google so a viewer can chat in the shared live room. Uses
// Google Identity Services (the real "Sign in with Google" button). Falls back
// to a display-name entry only until VITE_GOOGLE_CLIENT_ID is configured.
export default function SignIn({ onClose, onSignIn }) {
  const btnRef = useRef(null);
  const [name, setName] = useState('');
  const configured = Boolean(GOOGLE_CLIENT_ID);

  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  // Render the real Google button once the GSI script + client id are present.
  useEffect(() => {
    if (!configured) return;
    let tries = 0;
    const init = () => {
      const g = window.google?.accounts?.id;
      if (!g) { if (tries++ < 40) setTimeout(init, 100); return; }
      g.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: ({ credential }) => {
          const p = decodeJwt(credential);
          const display = (p?.given_name || p?.name || 'guest').toString().slice(0, 24);
          onSignIn(display, { picture: p?.picture, email: p?.email });
        },
      });
      if (btnRef.current) {
        g.renderButton(btnRef.current, { theme: 'filled_black', size: 'large', shape: 'pill', text: 'signin_with', width: 280 });
      }
    };
    init();
  }, [configured, onSignIn]);

  const submit = (e) => {
    e.preventDefault();
    const n = name.trim().replace(/^@/, '').slice(0, 24);
    if (n) onSignIn(n);
  };

  return (
    <div className="signin-backdrop" onMouseDown={onClose}>
      <div className="signin-card" onMouseDown={(e) => e.stopPropagation()}>
        <img className="signin-logo" src="/mb-logo.png" alt="Market Bubble" draggable="false" />
        <div className="signin-title">Join the conversation</div>
        <p className="signin-sub">You’re watching on marketbubble.com — sign in to chat in the shared live room.</p>

        {configured ? (
          <div className="gbtn-wrap" ref={btnRef} />
        ) : (
          <form onSubmit={submit}>
            <p className="signin-note">Add <code>VITE_GOOGLE_CLIENT_ID</code> to <code>web/.env</code> to turn on “Sign in with Google.” For now, pick a display name:</p>
            <input className="signin-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="your display name" autoFocus maxLength={24} />
            <button type="submit" className="signin-go" disabled={!name.trim()}>Enter chat</button>
          </form>
        )}
      </div>
    </div>
  );
}
