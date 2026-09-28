import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { RoomAudioRenderer, RoomContext, VideoConference } from '@livekit/components-react';
import { RoomEvent, type RemoteParticipant } from 'livekit-client';
import { ArrowLeft, Clock3, Flag, Loader2, ShieldCheck, Swords, Trophy } from 'lucide-react';
import { useLiveKit } from '../hooks/useLiveKit';
import type { AuthUser } from '../types';
import { battleClock, battleObjective, formatClock, parseRule } from '../lib/battle-rules';

type Entry = { id: string; name: string; dashboardUrl: string; division: string; platform: string };
type Standing = {
  id: string; name: string; rank: number; dashboardUrl: string; startingBalance: number;
  balance: number; equity: number; pnl: number; returnPct: number; tradeCount: number;
  wins: number; losses: number; biggestWin: number; openPositionCount: number;
  verified: boolean; status: 'live' | 'flat' | 'unavailable';
};

const decoder = new TextDecoder();
const encoder = new TextEncoder();

function upsert(list: Entry[], next: Entry) {
  const copy = [...list];
  const index = copy.findIndex((item) => item.id === next.id);
  if (index >= 0) copy[index] = next; else copy.push(next);
  return copy.slice(0, 8);
}

export default function BattleArenaRoom({ user }: { user: AuthUser }) {
  const { roomId = '' } = useParams();
  const [params] = useSearchParams();
  const name = params.get('name') || user.email.split('@')[0];
  const dashboardUrl = params.get('dashboardUrl') || '';
  const mode = params.get('mode') || '1v1';
  const rule = useMemo(() => parseRule(params), [params]);
  const [elapsed, setElapsed] = useState(0);
  const [roster, setRoster] = useState<Entry[]>(() => dashboardUrl ? [{
    id: user.id, name, dashboardUrl, division: 'trading', platform: 'other'
  }] : []);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [feedState, setFeedState] = useState<'idle' | 'loading' | 'fresh' | 'error'>('idle');

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const clock = battleClock(rule, elapsed);
  const objective = battleObjective(rule);

  const live = useLiveKit({
    roomName: 'battle-' + roomId.toUpperCase(),
    participantIdentity: user.id,
    participantName: name,
    canPublish: true,
  });

  const myEntry = useMemo<Entry | null>(() => dashboardUrl ? ({
    id: user.id, name, dashboardUrl, division: 'trading', platform: 'other'
  }) : null, [dashboardUrl, name, user.id]);

  useEffect(() => {
    if (!live.isConnected || !myEntry) return;

    const announce = async () => {
      await live.room.localParticipant.publishData(
        encoder.encode(JSON.stringify({ type: 'battle_profile', entry: myEntry })),
        { reliable: true }
      ).catch(() => undefined);
    };

    const onData = (payload: Uint8Array) => {
      try {
        const message = JSON.parse(decoder.decode(payload));
        if (message?.type === 'battle_profile' && message.entry?.id && message.entry?.name) {
          setRoster((current) => upsert(current, message.entry));
        }
      } catch {}
    };

    const onParticipant = (_participant: RemoteParticipant) => { void announce(); };

    live.room.on(RoomEvent.DataReceived, onData);
    live.room.on(RoomEvent.ParticipantConnected, onParticipant);
    void announce();

    return () => {
      live.room.off(RoomEvent.DataReceived, onData);
      live.room.off(RoomEvent.ParticipantConnected, onParticipant);
    };
  }, [live.isConnected, live.room, myEntry]);

  useEffect(() => {
    if (!roster.length) { setStandings([]); return; }
    let active = true;
    let timer: number | undefined;

    const load = async () => {
      setFeedState((state) => state === 'fresh' ? state : 'loading');
      try {
        const response = await fetch('/api/arena/quick-leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entries: roster, seasonName: 'Practice Battle ' + roomId.toUpperCase() }),
        });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data?.standings)) throw new Error('feed unavailable');
        if (active) { setStandings(data.standings); setFeedState('fresh'); }
      } catch {
        if (active) setFeedState('error');
      } finally {
        if (active) timer = window.setTimeout(load, 15000);
      }
    };

    void load();
    return () => { active = false; if (timer) window.clearTimeout(timer); };
  }, [roster, roomId]);

  return (
    <main className="min-h-screen bg-[#050810] text-white">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#080d18] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/practice" className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Swords className="h-4 w-4 text-cyan-300" />
              <span className="text-sm font-black uppercase tracking-[0.16em]">Room {roomId.toUpperCase()}</span>
            </div>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-600">{mode} · verified Hybrid Funding proof</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full border border-violet-300/15 bg-violet-300/[0.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-violet-300">
            {rule.label}
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] font-black text-white">
            <Clock3 className="h-3.5 w-3.5 text-cyan-300" />
            {clock.label} · {formatClock(clock.seconds)}
          </div>
          <div className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-300">
            {feedState === 'fresh' ? 'Stats live' : feedState === 'error' ? 'Stats retrying' : 'Connecting stats'}
          </div>
        </div>
      </header>

      <section className="border-b border-white/10 bg-[#070b14] px-4 py-3 sm:px-6">
        <div className="mx-auto mb-3 flex max-w-7xl items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
          <Flag className="h-4 w-4 flex-shrink-0 text-violet-300" />
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">Battle objective</p>
            <p className="mt-1 text-sm font-bold text-slate-200">{objective}</p>
          </div>
        </div>
        {standings.length ? (
          <div className="mx-auto grid max-w-7xl gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {standings.slice(0, 6).map((trader) => (
              <div key={trader.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                <div className={trader.rank <= 3 ? 'text-xl font-black text-cyan-300' : 'text-xl font-black text-white'}>#{trader.rank}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-black">{trader.name}</span>
                    {trader.verified && <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-emerald-300" />}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-600">{trader.tradeCount} trades · {trader.wins}/{trader.losses}</div>
                </div>
                <div className="text-right">
                  <div className={trader.pnl >= 0 ? 'font-mono text-sm font-black text-emerald-300' : 'font-mono text-sm font-black text-rose-300'}>
                    {trader.pnl >= 0 ? '+' : ''}${Math.round(trader.pnl).toLocaleString()}
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-slate-500">{trader.returnPct >= 0 ? '+' : ''}{trader.returnPct.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-auto flex max-w-7xl items-center gap-2 text-xs text-slate-500">
            <Trophy className="h-4 w-4 text-cyan-300" />
            Add verified dashboard proof to populate the live battle score strip.
          </div>
        )}
      </section>

      {!live.isConnected ? (
        <div className="grid min-h-[72vh] place-items-center px-5">
          <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#0b111e] p-7 text-center shadow-2xl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-violet-500 text-slate-950">
              <Swords className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-2xl font-black">Ready to enter {roomId.toUpperCase()}?</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Camera, mic, screen share, and room audio run through the standalone Trade House LiveKit arena.</p>
            <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/20 p-4 text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-300">{rule.label}</p>
              <p className="mt-2 text-sm font-bold text-white">{objective}</p>
              <p className="mt-2 font-mono text-xs text-cyan-300">{clock.label}: {formatClock(clock.seconds)}</p>
            </div>
            {live.error && <p className="mt-4 text-sm font-semibold text-rose-300">{live.error}</p>}
            <button type="button" onClick={live.connect} disabled={live.isConnecting}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-500 px-5 py-3 font-black text-slate-950 disabled:opacity-50">
              {live.isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
              {live.isConnecting ? 'Joining…' : 'Join battle room'}
            </button>
          </div>
        </div>
      ) : (
        <RoomContext.Provider value={live.room}>
          <RoomAudioRenderer />
          <div className="h-[calc(100vh-150px)] min-h-[620px] bg-[#03060c]">
            <VideoConference />
          </div>
        </RoomContext.Provider>
      )}
    </main>
  );
}