import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useChatSocket } from './lib/useChatSocket.js';
import { useStats, totalViewers } from './lib/useStats.js';
import Header from './components/Header.jsx';
import ChatColumn from './components/ChatColumn.jsx';
import StreamFrame from './components/StreamFrame.jsx';
import { StatsPanel, StatsStrip } from './components/StatsPanel.jsx';
import Footer from './components/Footer.jsx';
import MarketBubbleLogo from './components/MarketBubbleLogo.jsx';
import SignIn from './components/SignIn.jsx';
import { NewsGridSkeleton, MarketsSkeleton } from './components/Skeletons.jsx';
import { FullscreenIcon, PopoutIcon } from './components/logos.jsx';

// Markets + Content are split out so the home page ships a smaller, faster
// initial bundle (TradingView widgets + the clip player load on demand).
const MarketsPage = lazy(() => import('./components/MarketsPage.jsx'));
const NewsPage = lazy(() => import('./components/NewsPage.jsx'));

const STREAM_TITLE = 'Let’s Talk About View Botting';
const IS_POPOUT = typeof location !== 'undefined' && location.hash === '#popout';
const IS_OVERLAY = typeof location !== 'undefined' && location.hash === '#overlay';
const dateline = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
const rateOf = (arr) => arr.filter((m) => (m.recvAt || m.ts) > Date.now() - 60000).length;

function useRuntime() {
  const [t, setT] = useState('05:16:17');
  useEffect(() => {
    const id = setInterval(() => setT((cur) => {
      let [h, m, s] = cur.split(':').map(Number);
      if (++s === 60) { s = 0; m++; } if (m === 60) { m = 0; h++; }
      return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
    }), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function useScaleToFit() {
  useEffect(() => {
    const compute = () => document.documentElement.style.setProperty('--mb-scale', Math.min(window.innerWidth / 1680, window.innerHeight / 940));
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);
}

/* ----- right-click context menu ----- */
function ChatContextMenu({ x, y, onFullscreen, onPopout, onOverlay, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', esc);
    return () => { window.removeEventListener('mousedown', close); window.removeEventListener('keydown', esc); };
  }, [onClose]);
  return (
    <div className="ctx-menu" style={{ left: x, top: y }} ref={ref} role="menu">
      <button onClick={onFullscreen}><FullscreenIcon /> Full screen chat</button>
      <button onClick={onPopout}><PopoutIcon /> Pop out chat</button>
      <button onClick={onOverlay}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="13" rx="2" /><path d="M7 21h10M8 14h6" />
        </svg>
        Chat overlay (stream)
      </button>
    </div>
  );
}

/* ----- full-screen chat overlay ----- */
function FullscreenChat({ messages, msgsPerMin, tab, onTab, data, onClose }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div className="fs-overlay">
      <div className="fs-head">
        <div className="fs-name"><MarketBubbleLogo className="mb-mast-sm" /><span className="fs-sub">Live Chat</span></div>
        <button className="fs-close" onClick={onClose} aria-label="Close full screen"><span className="kbd">Esc</span> Close</button>
      </div>
      <div className="fs-grid">
        <div className="fs-chat"><ChatColumn messages={messages} msgsPerMin={msgsPerMin} title="The Chat" /></div>
        <aside className="fs-stats"><StatsPanel tab={tab} onTab={onTab} data={data} /></aside>
      </div>
    </div>
  );
}

/* ----- pop-out window (chat only) ----- */
function PopoutApp() {
  const { feed } = useChatSocket();
  const rate = useMemo(() => rateOf(feed), [feed]);
  useEffect(() => { document.documentElement.dataset.edition = 'evening'; document.title = 'Market Bubble — Chat'; }, []);
  return (
    <div className="popout-root">
      <ChatColumn messages={feed} msgsPerMin={rate} title="The Chat" />
    </div>
  );
}

/* ----- chat-only overlay (transparent — drop onto the stream / OBS) ----- */
function OverlayApp() {
  const { feed } = useChatSocket();
  const rate = useMemo(() => rateOf(feed), [feed]);
  useEffect(() => {
    document.documentElement.dataset.edition = 'evening';
    document.body.classList.add('overlay-body');
    document.title = 'Market Bubble — Chat Overlay';
  }, []);
  return (
    <div className="overlay-root">
      <ChatColumn messages={feed} msgsPerMin={rate} title="Live Chat" />
    </div>
  );
}

function MainApp() {
  const { feed, stats, statuses, news, market, send } = useChatSocket();
  const [tab, setTab] = useState('both');
  const [mode, setMode] = useState('unified');
  const [edition, setEdition] = useState('evening');
  const [page, setPage] = useState('home');
  const [user, setUser] = useState(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const sendChat = (text) => {
    if (!user) { setSignInOpen(true); return; }
    send({ type: 'chat', user, text });
  };
  const [ctx, setCtx] = useState(null);
  const [fs, setFs] = useState(false);
  const [viewers, setViewers] = useState(() => totalViewers({}));

  useScaleToFit();
  useEffect(() => { document.documentElement.dataset.edition = edition; }, [edition]);
  const runtime = useRuntime();
  const dateText = useMemo(dateline, []);

  const data = useStats(feed, stats, statuses, tab);

  // Header "watching": real viewers when the gateway provides them, else a
  // gently drifting seed so the readout feels alive.
  useEffect(() => {
    const real = totalViewers(statuses);
    setViewers(real);
    const id = setInterval(() => setViewers((x) => Math.max(1000, x + Math.round((Math.random() - 0.45) * 180))), 2600);
    return () => clearInterval(id);
  }, [statuses]);

  // Latest Market Bubble clip — bulletproof fallback for the stream window when
  // nobody's live and no VOD resolved (so it never shows Twitch's offline page).
  const latestClip = useMemo(() => (news || []).find((n) => n.video) || null, [news]);

  const banksMsgs = useMemo(() => feed.filter((m) => m.host === 'banks'), [feed]);
  const ansemMsgs = useMemo(() => feed.filter((m) => m.host === 'ansem'), [feed]);
  const allRate = useMemo(() => rateOf(feed), [feed]);
  const banksRate = useMemo(() => rateOf(banksMsgs), [banksMsgs]);
  const ansemRate = useMemo(() => rateOf(ansemMsgs), [ansemMsgs]);

  const openCtx = (e) => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY }); };
  const popOut = () => { setCtx(null); window.open(location.pathname + '#popout', 'mb_chat_popout', 'width=440,height=800'); };
  const openOverlay = () => { setCtx(null); window.open(location.pathname + '#overlay', 'mb_chat_overlay', 'width=520,height=820'); };
  const goFs = () => { setCtx(null); setFs(true); };

  return (
    <>
      <div className="stage">
        <div className="app">
          <Header dateText={dateText} mode={mode} onMode={setMode} viewers={viewers} edition={edition} onEdition={setEdition} page={page} onPage={setPage} />

          <div className="page-stage" key={page}>
          {page !== 'home' ? (
            <Suspense fallback={page === 'markets' ? <MarketsSkeleton /> : <NewsGridSkeleton />}>
              {page === 'markets' ? <MarketsPage data={market} news={news} edition={edition} /> : <NewsPage items={news} />}
            </Suspense>
          ) : (
          <div className="front" data-mode={mode}>
            <div className="zone zone-left">
              <div className="chat-layer chat-all">
                <ChatColumn title="The Chat" messages={feed} msgsPerMin={allRate} onContextMenu={openCtx} onExpand={goFs} onSend={sendChat} user={user} onSignIn={() => setSignInOpen(true)} onSignOut={() => setUser(null)} />
              </div>
              <div className="chat-layer chat-banks">
                <ChatColumn title="The Banks Desk" accent="banks" showHost={false} messages={banksMsgs} msgsPerMin={banksRate} onContextMenu={openCtx} onExpand={goFs} />
              </div>
            </div>

            <div className="zone zone-center">
              <StreamFrame title={STREAM_TITLE} streamTitle={statuses['banks:twitch']?.title} lastViews={statuses['banks:twitch']?.lastViews} watch="banks" live={statuses['banks:twitch']?.state === 'live'} videoId={statuses['banks:twitch']?.videoId} clip={latestClip} messages={feed} />
              <div className="stats-dock"><StatsStrip data={data} /></div>
            </div>

            <div className="zone zone-right">
              <div className="stats-rail"><StatsPanel tab={tab} onTab={setTab} data={data} /></div>
              <div className="desk-ansem"><ChatColumn title="The Ansem Desk" accent="ansem" showHost={false} messages={ansemMsgs} msgsPerMin={ansemRate} onContextMenu={openCtx} /></div>
            </div>
          </div>
          )}
          </div>

          <Footer />
        </div>
      </div>

      {signInOpen ? <SignIn onClose={() => setSignInOpen(false)} onSignIn={(name) => { setUser(name); setSignInOpen(false); }} /> : null}
      {ctx ? <ChatContextMenu x={ctx.x} y={ctx.y} onFullscreen={goFs} onPopout={popOut} onOverlay={openOverlay} onClose={() => setCtx(null)} /> : null}
      {fs ? <FullscreenChat messages={feed} msgsPerMin={allRate} tab={tab} onTab={setTab} data={data} onClose={() => setFs(false)} /> : null}
    </>
  );
}

export default function App() {
  if (IS_OVERLAY) return <OverlayApp />;
  if (IS_POPOUT) return <PopoutApp />;
  return <MainApp />;
}
