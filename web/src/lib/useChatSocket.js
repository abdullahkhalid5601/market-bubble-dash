import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_BUFFER = 600; // client windows the buffer; server caps nothing

function wsUrl() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}/ws`;
}

// Connects to the gateway, keeps a rolling buffer of normalized messages (each
// stamped with recvAt for the sync-delay feature), and exposes mode + sources
// from the initial status frame.
export function useChatSocket() {
  const [connected, setConnected] = useState(false);
  const [mode, setMode] = useState('mock');
  const [sources, setSources] = useState([]);
  const [feed, setFeed] = useState([]);
  const [statuses, setStatuses] = useState({}); // sourceId -> { state, detail }
  // Running totals, never reset — drive the real stats panel.
  const [stats, setStats] = useState({ total: 0, platform: { twitch: 0, kick: 0, x: 0 }, host: { banks: 0, ansem: 0 }, hp: {} });
  const wantRef = useRef(true);
  const sockRef = useRef(null);
  const retryRef = useRef(null);

  const send = useCallback((obj) => {
    const s = sockRef.current;
    if (s && s.readyState === WebSocket.OPEN) s.send(JSON.stringify(obj));
  }, []);

  useEffect(() => {
    wantRef.current = true;

    function open() {
      const sock = new WebSocket(wsUrl());
      sockRef.current = sock;

      sock.onopen = () => setConnected(true);
      sock.onmessage = (ev) => {
        let m;
        try { m = JSON.parse(ev.data); } catch { return; }
        if (m.type === 'status') {
          setMode(m.mode);
          setSources(m.sources || []);
        } else if (m.type === 'reset') {
          setFeed([]);
          setStatuses({});
          setStats({ total: 0, platform: { twitch: 0, kick: 0, x: 0 }, host: { banks: 0, ansem: 0 }, hp: {} });
        } else if (m.type === 'sourceStatus') {
          setStatuses((prev) => ({
            ...prev,
            [m.id]: { state: m.state, detail: m.detail, viewers: m.viewers, uptime: m.uptime, videoId: m.videoId },
          }));
        } else if (m.type === 'message') {
          const msg = { ...m.data, recvAt: Date.now() };
          setFeed((prev) => {
            const next = prev.length >= MAX_BUFFER ? prev.slice(prev.length - MAX_BUFFER + 1) : prev;
            return [...next, msg];
          });
          setStats((prev) => {
            const key = `${msg.host}:${msg.platform}`;
            return {
              total: prev.total + 1,
              platform: { ...prev.platform, [msg.platform]: (prev.platform[msg.platform] || 0) + 1 },
              host: { ...prev.host, [msg.host]: (prev.host[msg.host] || 0) + 1 },
              hp: { ...prev.hp, [key]: (prev.hp[key] || 0) + 1 },
            };
          });
        }
      };
      sock.onclose = () => {
        setConnected(false);
        sockRef.current = null;
        if (wantRef.current) retryRef.current = setTimeout(open, 1200);
      };
      sock.onerror = () => { try { sock.close(); } catch { /* */ } };
    }

    open();
    return () => {
      wantRef.current = false;
      clearTimeout(retryRef.current);
      try { sockRef.current?.close(); } catch { /* */ }
    };
  }, []);

  return { connected, mode, sources, feed, statuses, stats, send };
}
