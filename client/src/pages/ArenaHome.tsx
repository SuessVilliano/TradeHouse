import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ExternalLink,
  Radio,
  ShieldCheck,
  Swords,
  Trophy,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import type { AuthUser } from '../types';

type Standing = {
  id: string;
  name: string;
  rank: number;
  dashboardUrl?: string;
  equity?: number;
  pnl?: number;
  returnPct?: number;
  tradeCount?: number;
  verified?: boolean;
  status?: 'live' | 'flat' | 'unavailable';
};

type LeaderboardPayload = {
  season?: {
    name?: string;
    status?: 'forming' | 'live' | 'complete';
    accountType?: string;
    refreshSeconds?: number;
    endsAt?: string | null;
  };
  standings?: Standing[];
  updatedAt?: string;
};

type LiveKitRoom = {
  name?: string;
  numParticipants?: number;
  creationTime?: number;
};

const money = (value = 0) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export default function ArenaHome({ user }: { user?: AuthUser }) {
  const [board, setBoard] = useState<LeaderboardPayload | null>(null);
  const [rooms, setRooms] = useState<LiveKitRoom[]>([]);
  const [boardState, setBoardState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    let timer: number | undefined;

    const load = async () => {
      try {
        const [boardRes, roomRes] = await Promise.all([
          fetch('/api/arena/leaderboard', { cache: 'no-store' }),
          fetch('/api/livekit/rooms', { cache: 'no-store' }),
        ]);

        if (!boardRes.ok) throw new Error('leaderboard unavailable');
        const boardData = await boardRes.json();
        const roomData = roomRes.ok ? await roomRes.json() : { rooms: [] };

        if (active) {
          setBoard(boardData);
          setRooms(Array.isArray(roomData.rooms) ? roomData.rooms : []);
          setBoardState('ready');
        }
      } catch {
        if (active) setBoardState('error');
      } finally {
        if (active) timer = window.setTimeout(load, 15000);
      }
    };

    load();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const standings = board?.standings || [];
  const totals = useMemo(
    () => ({
      traders: standings.length,
      verified: standings.filter((item) => item.verified).length,
      live: standings.filter((item) => item.status === 'live').length,
      trades: standings.reduce((sum, item) => sum + Number(item.tradeCount || 0), 0),
    }),
    [standings],
  );

  const activeRooms = rooms.filter((room) => Number(room.numParticipants || 0) > 0);

  return (
    <main className="min-h-screen bg-[#060913] text-white">
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,.20),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(139,92,246,.18),transparent_34%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-violet-500 text-[#050816] shadow-[0_0_40px_rgba(34,211,238,.22)]">
                <Swords className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-black tracking-[0.18em]">TRADE HOUSE</div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-300">by Trade Hybrid</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://hybridfunding.co/tradehouse"
                target="_blank"
                rel="noreferrer"
                className="hidden rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/[0.08] sm:inline-flex"
              >
                Rules & funding <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </a>
              <Link
                to="/producer"
                className="hidden rounded-xl border border-violet-300/20 bg-violet-300/[0.07] px-3 py-2 text-xs font-black text-violet-200 sm:inline-flex"
              >
                Producer Studio
              </Link>
              {user ? (
                <Link
                  to="/practice"
                  className="rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-100"
                >
                  Launch practice battle
                </Link>
              ) : (
                <a
                  href="https://pro.tradehybrid.co/launch/tradehouse"
                  className="rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-100"
                >
                  Enter with Trade Hybrid Club
                </a>
              )}
            </div>
          </header>

          <section className="grid gap-8 pb-10 pt-16 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:pt-24">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
                <Radio className="h-3.5 w-3.5" />
                {board?.season?.status === 'live' ? 'Season live' : 'Season forming'}
              </div>
              <h1 className="mt-5 max-w-4xl text-5xl font-black uppercase leading-[.9] tracking-[-0.05em] sm:text-7xl lg:text-8xl">
                Trade for the <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">House.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                One arena for verified competition, live rooms, trader cameras, public performance,
                broadcast production, and the community around the battle.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {user ? (
                  <Link
                    to="/practice"
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-500 px-5 py-3 text-sm font-black text-[#050816] shadow-[0_10px_40px_rgba(34,211,238,.18)]"
                  >
                    Launch a battle <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <a
                    href="https://pro.tradehybrid.co/launch/tradehouse"
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-500 px-5 py-3 text-sm font-black text-[#050816] shadow-[0_10px_40px_rgba(34,211,238,.18)]"
                  >
                    Enter the Arena <ArrowRight className="h-4 w-4" />
                  </a>
                )}
                <a
                  href="#leaderboard"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-black text-white"
                >
                  <Trophy className="h-4 w-4" /> View leaderboard
                </a>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl">
              {user ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">Your arena</p>
                      <p className="mt-1 text-lg font-black">{user.email}</p>
                    </div>
                    <div className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                      Connected
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Link to="/clubhouse" className="rounded-2xl border border-white/10 bg-[#0b1020] p-4 transition hover:border-cyan-300/30">
                      <Video className="h-5 w-5 text-cyan-300" />
                      <p className="mt-6 font-black">Battle rooms</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Video, screen share, chat and trader comms.</p>
                    </Link>
                    <Link to="/producer" className="rounded-2xl border border-white/10 bg-[#0b1020] p-4 transition hover:border-violet-300/30">
                      <Radio className="h-5 w-5 text-violet-300" />
                      <p className="mt-6 font-black">Producer Studio</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">OBS overlays, broadcast graphics and live production.</p>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">Trade House access</p>
                  <h2 className="mt-2 text-2xl font-black">Watch publicly. Compete with your Club identity.</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Leaderboards and live battle activity are public. Creating rooms, joining battles, video, chat, and producer tools use your Trade Hybrid Club account.
                  </p>
                  <a
                    href="https://pro.tradehybrid.co/launch/tradehouse"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950"
                  >
                    Continue with Trade Hybrid Club <ArrowRight className="h-4 w-4" />
                  </a>
                </>
              )}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 pb-6 sm:grid-cols-4">
            {[
              ['Contestants', totals.traders, Users],
              ['Verified feeds', totals.verified, ShieldCheck],
              ['Trades tracked', totals.trades, Activity],
              ['Live positions', totals.live, Radio],
            ].map(([label, value, Icon]: any) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <Icon className="h-4 w-4 text-cyan-300" />
                <p className="mt-4 text-2xl font-black">{value}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-8 sm:px-8 lg:grid-cols-[1.2fr_.8fr] lg:px-10 lg:py-12">
        <div id="leaderboard" className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0f1d]">
          <div className="flex items-end justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Official board</p>
              <h2 className="mt-2 text-2xl font-black">Season leaderboard</h2>
              <p className="mt-1 text-sm text-slate-500">Powered by Hybrid Funding verified public dashboard data.</p>
            </div>
            {board?.updatedAt && (
              <p className="hidden text-xs text-slate-600 sm:block">
                {new Date(board.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </p>
            )}
          </div>

          {boardState === 'loading' ? (
            <div className="p-12 text-center text-sm text-slate-500">Connecting to the battle feed…</div>
          ) : boardState === 'error' ? (
            <div className="p-12 text-center">
              <p className="font-black text-red-300">Battle feed temporarily unavailable</p>
              <p className="mt-2 text-sm text-slate-500">The arena will retry automatically.</p>
            </div>
          ) : standings.length === 0 ? (
            <div className="p-12 text-center">
              <Swords className="mx-auto h-8 w-8 text-cyan-300" />
              <p className="mt-4 font-black">The next roster is forming.</p>
              <p className="mt-2 text-sm text-slate-500">Verified contestants appear here as Hybrid Funding adds their public dashboards.</p>
            </div>
          ) : (
            <div>
              {standings.slice(0, 10).map((trader) => (
                <div
                  key={trader.id}
                  className="grid grid-cols-[52px_1fr_auto] items-center gap-3 border-b border-white/[0.07] px-5 py-4 last:border-b-0 sm:grid-cols-[64px_1fr_110px_95px_100px]"
                >
                  <div className={`text-lg font-black ${Number(trader.rank) <= 3 ? 'text-cyan-300' : 'text-white'}`}>
                    #{trader.rank}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-black">{trader.name}</span>
                      {trader.verified && <ShieldCheck className="h-4 w-4 flex-shrink-0 text-emerald-300" />}
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">{trader.status || 'flat'}</div>
                  </div>
                  <div className={`text-right font-mono font-bold ${Number(trader.pnl || 0) >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {Number(trader.pnl || 0) >= 0 ? '+' : ''}{money(Number(trader.pnl || 0))}
                  </div>
                  <div className="hidden text-right font-mono text-sm text-slate-300 sm:block">
                    {Number(trader.returnPct || 0) >= 0 ? '+' : ''}{Number(trader.returnPct || 0).toFixed(2)}%
                  </div>
                  <div className="hidden text-right font-mono text-sm text-slate-400 sm:block">{Number(trader.tradeCount || 0)} trades</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-[28px] border border-white/10 bg-[#0a0f1d] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">Live rooms</p>
                <h2 className="mt-2 text-xl font-black">What’s happening now</h2>
              </div>
              <div className="text-3xl font-black text-violet-300">{activeRooms.length}</div>
            </div>

            <div className="mt-5 space-y-2">
              {activeRooms.length ? activeRooms.slice(0, 5).map((room) => (
                <div key={room.name} className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
                  <div>
                    <p className="text-sm font-bold">{room.name || 'Trade House room'}</p>
                    <p className="mt-1 text-xs text-slate-600">{room.numParticipants || 0} participants</p>
                  </div>
                  <span className="rounded-full bg-red-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-red-300">live</span>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-500">
                  No LiveKit rooms are active right now.
                </div>
              )}
            </div>

            {user ? (
              <Link to="/clubhouse" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black">
                Open room directory <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <a href="https://pro.tradehybrid.co/launch/tradehouse" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black">
                Sign in to enter rooms <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>

          <div className="rounded-[28px] border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[0.08] to-violet-500/[0.08] p-5 sm:p-6">
            <Zap className="h-5 w-5 text-cyan-300" />
            <h2 className="mt-5 text-xl font-black">Built for the show, not just the score.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Trader cameras, back-to-back screens, live stats, OBS production, chat, and verified performance can live in one standalone arena while Hybrid Funding remains the official competition source.
            </p>
            <a
              href="https://hybridfunding.co/tradehouse"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm font-black text-cyan-300"
            >
              View official Trade House page <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
