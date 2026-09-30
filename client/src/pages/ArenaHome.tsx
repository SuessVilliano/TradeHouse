import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Moon,
  Radio,
  ShieldCheck,
  Sparkles,
  Sun,
  Swords,
  Trophy,
  Tv2,
  Users,
  Video,
  X,
  Zap,
} from 'lucide-react';
import type { AuthUser } from '../types';
import { supabase } from '../lib/supabase';

type Standing = {
  id: string;
  name: string;
  rank: number;
  pnl: number;
  returnPct: number;
  tradeCount: number;
  verified: boolean;
};

type LiveRoom = {
  name?: string;
  roomName?: string;
  numParticipants?: number;
  participants?: number;
};

const CLUB_LAUNCH = 'https://pro.tradehybrid.co/launch/tradehouse';

const weeklyShows = [
  {
    day: 'SUN',
    title: 'Hybrid Picks',
    text: 'Sunday-night prediction show, matchup board, picks, recap and live audience conversation.',
    icon: Trophy,
  },
  {
    day: 'MON',
    title: 'Market Watch Mondays',
    text: 'Start the week with market context, watchlists, levels and the setups worth tracking.',
    icon: BarChart3,
  },
  {
    day: 'WED',
    title: 'Wednesday Live',
    text: 'Live trading sessions, screen share, process review and real-time community discussion.',
    icon: Video,
  },
  {
    day: 'SAT',
    title: 'Super Saturdays',
    text: 'Presentations, evergreen sessions, Club education, Hybrid Funding and affiliate training.',
    icon: Tv2,
  },
];

function money(value = 0) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function MarketBuddyLauncher({ user }: { user?: AuthUser }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user'|'ai'; text: string }>>([
    {
      role: 'ai',
      text: 'I’m Market Buddy. Ask me about Trade House, battle prep, your process, or what to do next inside Trade Hybrid.',
    },
  ]);

  const send = async (preset?: string) => {
    const message = String(preset || prompt).trim();
    if (!message || sending) return;

    if (!user) {
      window.location.href = CLUB_LAUNCH;
      return;
    }

    setMessages((current) => [...current, { role: 'user', text: message }, { role: 'ai', text: '' }]);
    setPrompt('');
    setSending(true);

    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        window.location.href = CLUB_LAUNCH;
        return;
      }

      const response = await fetch('/api/market-buddy/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + accessToken,
        },
        body: JSON.stringify({
          message,
          context: {
            surface: 'trade-house',
            recentMessages: messages.slice(-5).map((item) => ({
              type: item.role === 'ai' ? 'ai' : 'user',
              message: item.text,
            })),
          },
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Market Buddy is unavailable.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let answer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n');
        buffer = chunks.pop() || '';

        for (const line of chunks) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload);
            answer += String(parsed.chunk || '');
            setMessages((current) => {
              const next = [...current];
              next[next.length - 1] = { role: 'ai', text: answer };
              return next;
            });
          } catch {
            // Ignore malformed stream fragments.
          }
        }
      }
    } catch {
      setMessages((current) => {
        const next = [...current];
        next[next.length - 1] = {
          role: 'ai',
          text: 'I hit a temporary connection issue. Open full Market Buddy in the Club and I’ll pick it up there.',
        };
        return next;
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-[70] flex max-h-[72vh] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-[24px] border border-violet-200 bg-white shadow-[0_24px_80px_rgba(76,29,149,.22)] dark:border-white/10 dark:bg-[#0c1220]">
          <div className="bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100">Trade Hybrid AI</p>
                  <p className="font-black">Market Buddy</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close Market Buddy">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {messages.map((item, index) => (
                <div
                  key={index}
                  className={item.role === 'user'
                    ? 'ml-8 rounded-2xl rounded-br-md bg-gradient-to-r from-violet-600 to-blue-500 px-3 py-2.5 text-sm text-white'
                    : 'mr-8 rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2.5 text-sm leading-6 text-slate-700 dark:bg-white/[0.07] dark:text-slate-200'}
                >
                  {item.text || (sending && index === messages.length - 1 ? 'Thinking…' : '')}
                </div>
              ))}
            </div>

            {messages.length <= 1 && (
              <div className="mt-4 grid gap-2">
                {['How do Trade House battles work?', 'Help me prepare for a battle', 'What should I review before I compete?'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => void send(item)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-bold text-slate-700 hover:border-violet-200 hover:bg-violet-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 p-3 dark:border-white/10">
            {user ? (
              <div className="flex gap-2">
                <input
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void send();
                  }}
                  placeholder="Ask Market Buddy…"
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-black/20 dark:text-white"
                />
                <button type="button" disabled={sending} onClick={() => void send()} className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white disabled:opacity-50">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <a href={CLUB_LAUNCH} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 px-4 py-3 text-sm font-black text-white">
                Sign in to chat with Market Buddy <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-5 right-4 z-[70] inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 px-4 py-3 text-sm font-black text-white shadow-[0_14px_42px_rgba(79,70,229,.28)] transition hover:-translate-y-0.5"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline">Market Buddy</span>
      </button>
    </>
  );
}

export default function ArenaHome({ user }: { user?: AuthUser }) {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [intro, setIntro] = useState(true);
  const [dark, setDark] = useState(() => localStorage.getItem('tradehouse-theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('tradehouse-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntro(false), 850);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;
    let timer: number | undefined;

    const load = async () => {
      try {
        const [leaderboardResponse, roomsResponse] = await Promise.all([
          fetch('/api/arena/leaderboard', { cache: 'no-store' }),
          fetch('/api/livekit/rooms', { cache: 'no-store' }),
        ]);

        const leaderboardData = await leaderboardResponse.json().catch(() => ({}));
        const roomsData = await roomsResponse.json().catch(() => ({}));

        if (!active) return;
        setStandings(Array.isArray(leaderboardData?.standings) ? leaderboardData.standings : []);
        setRooms(Array.isArray(roomsData?.rooms) ? roomsData.rooms : []);
      } catch {
        if (!active) return;
      } finally {
        if (active) {
          setLoading(false);
          timer = window.setTimeout(load, 15000);
        }
      }
    };

    void load();

    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const stats = useMemo(() => ({
    contestants: standings.length,
    verified: standings.filter((item) => item.verified).length,
    trades: standings.reduce((sum, item) => sum + Number(item.tradeCount || 0), 0),
    live: rooms.length,
  }), [standings, rooms]);

  if (intro) {
    return (
      <main className="grid min-h-screen place-items-center overflow-hidden bg-white text-slate-950 dark:bg-[#070b14] dark:text-white">
        <div className="text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-[24px] bg-gradient-to-br from-violet-600 via-blue-500 to-cyan-500 text-white shadow-[0_24px_80px_rgba(79,70,229,.28)] th-pulse-logo">
            <Swords className="h-9 w-9" />
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.35em] text-violet-600 dark:text-violet-300">Trade House</p>
          <p className="mt-2 text-sm text-slate-500">Loading the arena…</p>
          <div className="mx-auto mt-5 h-1.5 w-44 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 th-loader-bar" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-950 transition-colors dark:bg-[#070b14] dark:text-white">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#070b14]/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-600 via-blue-500 to-cyan-500 text-white shadow-md">
              <Swords className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black tracking-[0.16em]">TRADE HOUSE</p>
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300">by Trade Hybrid</p>
            </div>
          </a>

          <div className="hidden items-center gap-6 lg:flex">
            <a href="#how" className="text-sm font-bold text-slate-600 hover:text-violet-600 dark:text-slate-300">How it works</a>
            <a href="#leaderboard" className="text-sm font-bold text-slate-600 hover:text-violet-600 dark:text-slate-300">Leaderboard</a>
            <a href="#shows" className="text-sm font-bold text-slate-600 hover:text-violet-600 dark:text-slate-300">Shows</a>
            <a href="#broadcast" className="text-sm font-bold text-slate-600 hover:text-violet-600 dark:text-slate-300">Broadcast</a>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setDark((value) => !value)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {user ? (
              <Link to="/practice" className="rounded-xl bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 px-4 py-2.5 text-xs font-black text-white shadow-lg">
                Launch battle
              </Link>
            ) : (
              <a href={CLUB_LAUNCH} className="rounded-xl bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 px-4 py-2.5 text-xs font-black text-white shadow-lg">
                Enter Arena
              </a>
            )}
          </div>
        </div>
      </nav>

      <section className="relative isolate overflow-hidden border-b border-slate-100 dark:border-white/10">
        <div className="absolute -left-40 top-0 -z-10 h-[520px] w-[520px] rounded-full bg-violet-300/30 blur-[120px] th-float-slow dark:bg-violet-600/15" />
        <div className="absolute -right-40 top-20 -z-10 h-[520px] w-[520px] rounded-full bg-cyan-300/30 blur-[120px] th-float-reverse dark:bg-cyan-500/10" />

        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div className="th-reveal-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-violet-700 dark:border-violet-300/20 dark:bg-violet-300/[0.08] dark:text-violet-200">
              <Sparkles className="h-3.5 w-3.5" /> Competition meets content
            </div>

            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[.93] tracking-[-0.055em] sm:text-7xl">
              Trade for
              <span className="block bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">the house.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              A live trader competition network with practice battles, verified Hybrid Funding proof, cameras, screen share, leaderboards, show production and a public record that can follow the trader.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <Link to="/practice" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 px-6 py-3.5 font-black text-white shadow-xl shadow-violet-500/20">
                  Launch a battle <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <a href={CLUB_LAUNCH} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 px-6 py-3.5 font-black text-white shadow-xl shadow-violet-500/20">
                  Enter with Trade Hybrid Club <ArrowRight className="h-4 w-4" />
                </a>
              )}
              <a href="#leaderboard" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 font-black text-slate-800 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
                View leaderboard <Trophy className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-9 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Contestants', stats.contestants],
                ['Verified feeds', stats.verified],
                ['Trades tracked', stats.trades],
                ['Live rooms', stats.live],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
                  <p className="text-2xl font-black">{loading ? '—' : value}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative th-reveal-up th-delay-2">
            <div className="rounded-[32px] bg-gradient-to-br from-violet-600 via-blue-500 to-cyan-500 p-[1px] shadow-[0_30px_90px_rgba(79,70,229,.22)]">
              <div className="overflow-hidden rounded-[31px] bg-white p-5 dark:bg-[#0c1220] sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Arena status</p>
                    <h2 className="mt-1 text-2xl font-black">Built for the show.</h2>
                  </div>
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:bg-emerald-300/10 dark:text-emerald-300">
                    Live system
                  </div>
                </div>

                <div className="mt-5 aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1020] via-[#131a35] to-[#24104c] p-5 text-white">
                  <div className="flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200">Battle broadcast</span>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-300"><Radio className="h-3.5 w-3.5 text-rose-400" /> LIVE</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {['TRADER A', 'TRADER B'].map((name, index) => (
                        <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                          <div className="h-20 rounded-xl bg-gradient-to-br from-white/10 to-white/[0.03]" />
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs font-black">{name}</span>
                            <span className={index === 0 ? 'font-mono text-xs font-black text-emerald-300' : 'font-mono text-xs font-black text-rose-300'}>
                              {index === 0 ? '+$349' : '-$42'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                      <span>Verified proof</span><span>Camera + screen</span><span>OBS ready</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    ['Practice', Swords],
                    ['Live rooms', Video],
                    ['Broadcast', Radio],
                  ].map(([label, Icon]: any) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-3 text-center dark:bg-white/[0.04]">
                      <Icon className="mx-auto h-4 w-4 text-violet-600 dark:text-violet-300" />
                      <p className="mt-2 text-[10px] font-black uppercase tracking-wider">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">How Trade House works</p>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">From practice room to broadcast.</h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['01', 'Enter with Club', 'Use one Trade Hybrid identity. No separate Trade House account.', Users],
            ['02', 'Create or join', 'Launch 1v1, 2v2 or 3v3 practice and competition rooms.', Swords],
            ['03', 'Verify the proof', 'Official competition stats can pull from public Hybrid Funding dashboards.', ShieldCheck],
            ['04', 'Turn it into content', 'Cameras, screen share, scorebugs, leaderboards and OBS-ready production.', Radio],
          ].map(([number, title, text, Icon]: any) => (
            <article key={number} className="group rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.035]">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-violet-200 dark:text-violet-800">{number}</span>
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="mt-6 text-xl font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="leaderboard" className="border-y border-slate-100 bg-slate-50/70 py-20 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 sm:px-8 lg:grid-cols-[1.25fr_.75fr]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0c1220]">
            <div className="flex items-end justify-between border-b border-slate-100 p-5 dark:border-white/10 sm:p-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">Official board</p>
                <h2 className="mt-2 text-2xl font-black">Season leaderboard</h2>
                <p className="mt-1 text-xs text-slate-500">Powered by verified public Hybrid Funding dashboard data.</p>
              </div>
              <Trophy className="h-6 w-6 text-violet-500" />
            </div>

            <div>
              {loading ? (
                <div className="space-y-1 p-4">
                  {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-white/[0.05]" />)}
                </div>
              ) : standings.length ? (
                standings.slice(0, 8).map((trader) => (
                  <div key={trader.id} className="grid grid-cols-[52px_1fr_auto] items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0 dark:border-white/[0.07] sm:grid-cols-[52px_1fr_120px_100px]">
                    <div className={trader.rank <= 3 ? 'text-xl font-black text-violet-600 dark:text-violet-300' : 'text-xl font-black text-slate-400'}>#{trader.rank}</div>
                    <div>
                      <div className="flex items-center gap-2 font-black">
                        {trader.name}
                        {trader.verified && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      </div>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{trader.tradeCount} trades tracked</p>
                    </div>
                    <div className={trader.pnl >= 0 ? 'text-right font-mono text-sm font-black text-emerald-600' : 'text-right font-mono text-sm font-black text-rose-500'}>
                      {trader.pnl >= 0 ? '+' : ''}{money(trader.pnl)}
                    </div>
                    <div className="hidden text-right font-mono text-xs text-slate-500 sm:block">
                      {trader.returnPct >= 0 ? '+' : ''}{Number(trader.returnPct || 0).toFixed(2)}%
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-slate-500">The next verified board will appear here when a competition roster is active.</div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0c1220]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300">Live rooms</p>
                  <h3 className="mt-2 text-2xl font-black">What’s happening now</h3>
                </div>
                <span className="text-3xl font-black text-violet-500">{rooms.length}</span>
              </div>

              <div className="mt-5 space-y-2">
                {rooms.length ? rooms.slice(0, 5).map((room, index) => (
                  <div key={(room.roomName || room.name || 'room') + index} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                    <div>
                      <p className="text-sm font-black">{room.roomName || room.name || 'Live battle'}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">{room.numParticipants ?? room.participants ?? 0} participants</p>
                    </div>
                    <Radio className="h-4 w-4 text-rose-500" />
                  </div>
                )) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500 dark:border-white/10">No LiveKit rooms are active right now.</div>
                )}
              </div>

              {user ? (
                <Link to="/clubhouse" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white dark:bg-white dark:text-slate-950">
                  Open room directory <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <a href={CLUB_LAUNCH} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white dark:bg-white dark:text-slate-950">
                  Sign in to enter rooms <ArrowRight className="h-4 w-4" />
                </a>
              )}
            </div>

            <div className="rounded-[28px] bg-gradient-to-br from-violet-600 via-blue-500 to-cyan-500 p-6 text-white shadow-xl shadow-violet-500/15">
              <ShieldCheck className="h-6 w-6" />
              <h3 className="mt-4 text-2xl font-black">Proof, not self-report.</h3>
              <p className="mt-3 text-sm leading-6 text-white/80">
                Hybrid Funding public dashboard URLs remain the official proof source for supported competitions. Trade House adds the show, rooms, production and audience layer around that verified record.
              </p>
              <a href="https://hybridfunding.co/tradehouse" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-black">
                View Hybrid Funding Trade House <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="shows" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">Trade Hybrid programming</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">The Arena is part of a weekly network.</h2>
          </div>
          <a href="https://pro.tradehybrid.co/tv" className="inline-flex items-center gap-2 text-sm font-black text-violet-600 dark:text-violet-300">
            Open Trade Hybrid TV <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {weeklyShows.map(({ day, title, text, icon: Icon }, index) => (
            <article key={title} className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.035]">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-violet-300/40 to-cyan-300/30 blur-3xl dark:from-violet-500/10 dark:to-cyan-500/10" />
              <div className="relative flex items-start gap-4">
                <div className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-blue-500 to-cyan-500 text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">{day} · Show {String(index + 1).padStart(2, '0')}</p>
                  <h3 className="mt-2 text-2xl font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{text}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="broadcast" className="border-y border-slate-100 bg-slate-950 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
              <Radio className="h-3.5 w-3.5" /> Producer + OBS
            </div>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Turn every battle into a show.</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Load a room by code, verify the same public proof feed, then generate duel graphics, an eight-trader wall, leaderboard, leader scorebug and lower thirds for OBS.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {user ? (
                <Link to="/producer" className="rounded-xl bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 px-5 py-3 font-black text-white">
                  Open Producer Studio
                </Link>
              ) : (
                <a href={CLUB_LAUNCH} className="rounded-xl bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 px-5 py-3 font-black text-white">
                  Sign in for Producer Studio
                </a>
              )}
              <a href="https://pro.tradehybrid.co/tv" className="rounded-xl border border-white/15 bg-white/[0.05] px-5 py-3 font-black text-white">
                Watch Trade Hybrid TV
              </a>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Duel overlay', 'Two-trader scoreboards with verified stats.', Swords],
              ['Eight-trader wall', 'A full competition grid for large shows.', Users],
              ['Scorebug + lower thirds', 'Broadcast graphics for the live program.', Radio],
              ['TV-ready scenes', 'A reusable visual system for weekly Trade Hybrid programming.', Tv2],
            ].map(([title, text, Icon]: any) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <Icon className="h-5 w-5 text-cyan-300" />
                <p className="mt-5 font-black">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 p-8 text-white shadow-2xl shadow-violet-500/20 sm:p-12">
          <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Trade House by Trade Hybrid</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Practice it. Prove it. Broadcast it.</h2>
            <p className="mt-4 text-base leading-7 text-white/80">
              Build the public record, the community and the content around how traders actually perform—not just what they say online.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={user ? '/practice' : CLUB_LAUNCH} className="rounded-xl bg-white px-5 py-3 font-black text-slate-950">
                Enter the Arena
              </a>
              <a href="https://pro.tradehybrid.co" className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-black text-white">
                Explore Trade Hybrid Club
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-500 dark:border-white/10 dark:bg-[#070b14] dark:text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>Trade House · A Trade Hybrid competition product</span>
          <div className="flex flex-wrap gap-4">
            <a href="https://pro.tradehybrid.co">Club</a>
            <a href="https://hybridfunding.co">Hybrid Funding</a>
            <a href="https://pro.tradehybrid.co/tv">Trade Hybrid TV</a>
          </div>
        </div>
      </footer>

      <MarketBuddyLauncher user={user} />
    </main>
  );
}
