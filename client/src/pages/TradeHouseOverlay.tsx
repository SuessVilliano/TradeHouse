import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Trophy } from 'lucide-react';
import { decodeQuickRoster } from '../lib/quick-roster';

type Standing = {
  id: string;
  name: string;
  rank: number;
  dashboardUrl: string;
  startingBalance: number;
  balance: number;
  equity: number;
  pnl: number;
  returnPct: number;
  tradeCount: number;
  wins: number;
  losses: number;
  biggestWin: number;
  openPositionCount: number;
  verified: boolean;
  status: 'live' | 'flat' | 'unavailable';
};

function money(value = 0) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-1 font-mono text-xl font-black text-white">{value}</div>
    </div>
  );
}

export default function TradeHouseOverlay() {
  const { view = 'leaderboard' } = useParams();
  const [params] = useSearchParams();
  const roster = useMemo(() => decodeQuickRoster(params.get('quick')), [params]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [state, setState] = useState<'loading' | 'fresh' | 'stale'>('loading');
  const season = params.get('season') || 'Quick Battle';
  const transparent = params.get('overlay') === '1';
  const leftId = params.get('left') || '';
  const rightId = params.get('right') || '';
  const traderId = params.get('trader') || '';

  useEffect(() => {
    if (!roster.length) {
      setStandings([]);
      setState('stale');
      return;
    }

    let active = true;
    let timer: number | undefined;

    const load = async () => {
      try {
        const response = await fetch('/api/arena/quick-leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entries: roster, seasonName: season }),
          cache: 'no-store',
        });

        const data = await response.json();
        if (!response.ok || !Array.isArray(data?.standings)) throw new Error('feed unavailable');

        if (active) {
          setStandings(data.standings);
          setState('fresh');
        }
      } catch {
        if (active) setState('stale');
      } finally {
        if (active) timer = window.setTimeout(load, 15000);
      }
    };

    void load();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [roster, season]);

  const selected = (id: string, fallbackIndex: number) =>
    standings.find((item) => item.id === id) || standings[fallbackIndex];

  const leader = standings[0];
  const lowerThird = standings.find((item) => item.id === traderId) || leader;

  const shell = transparent
    ? 'min-h-screen bg-transparent text-white'
    : 'min-h-screen bg-[#050810] text-white';

  if (view === 'scorebug') {
    return (
      <main className={shell}>
        <div className="flex min-h-screen items-start justify-center p-6">
          {leader ? (
            <div className="mt-4 flex items-center gap-5 rounded-2xl border border-cyan-300/25 bg-[#07101b]/95 px-6 py-4 shadow-2xl backdrop-blur-xl">
              <Trophy className="h-7 w-7 text-cyan-300" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">Current leader</div>
                <div className="mt-1 flex items-center gap-2 text-xl font-black">
                  {leader.name}
                  {leader.verified && <ShieldCheck className="h-4 w-4 text-emerald-300" />}
                </div>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-right">
                <div className={leader.pnl >= 0 ? 'font-mono text-xl font-black text-emerald-300' : 'font-mono text-xl font-black text-rose-300'}>
                  {leader.pnl >= 0 ? '+' : ''}{money(leader.pnl)}
                </div>
                <div className="mt-1 font-mono text-xs text-slate-400">
                  {leader.returnPct >= 0 ? '+' : ''}{leader.returnPct.toFixed(2)}%
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    );
  }

  if (view === 'lowerthird') {
    return (
      <main className={shell}>
        <div className="flex min-h-screen items-end p-10">
          {lowerThird ? (
            <div className="w-[620px] rounded-3xl border border-white/10 bg-gradient-to-r from-[#08121f]/95 to-[#121027]/95 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Trade House</div>
                  <div className="mt-2 flex items-center gap-2 text-3xl font-black">
                    {lowerThird.name}
                    {lowerThird.verified && <ShieldCheck className="h-5 w-5 text-emerald-300" />}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Rank</div>
                  <div className="mt-1 text-3xl font-black text-violet-300">#{lowerThird.rank}</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-5 border-t border-white/10 pt-5">
                <Stat label="P&L" value={(lowerThird.pnl >= 0 ? '+' : '') + money(lowerThird.pnl)} />
                <Stat label="Return" value={(lowerThird.returnPct >= 0 ? '+' : '') + lowerThird.returnPct.toFixed(2) + '%'} />
                <Stat label="Trades" value={String(lowerThird.tradeCount)} />
                <Stat label="Record" value={lowerThird.wins + '-' + lowerThird.losses} />
              </div>
            </div>
          ) : null}
        </div>
      </main>
    );
  }

  if (view === 'duel') {
    const left = selected(leftId, 0);
    const right = selected(rightId, 1);

    return (
      <main className={shell}>
        <div className="flex min-h-screen items-end justify-center p-12">
          <div className="grid w-full max-w-[1820px] grid-cols-2 gap-8">
            {[left, right].map((trader, index) => (
              <div key={trader?.id || index} className="rounded-[28px] border border-white/10 bg-[#07101b]/92 p-7 shadow-2xl backdrop-blur-xl">
                {trader ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">{index === 0 ? 'Left corner' : 'Right corner'}</div>
                        <div className="mt-2 flex items-center gap-2 text-3xl font-black">
                          {trader.name}
                          {trader.verified && <ShieldCheck className="h-5 w-5 text-emerald-300" />}
                        </div>
                      </div>
                      <div className="text-5xl font-black text-violet-300">#{trader.rank}</div>
                    </div>
                    <div className="mt-6 grid grid-cols-4 gap-5 border-t border-white/10 pt-5">
                      <Stat label="P&L" value={(trader.pnl >= 0 ? '+' : '') + money(trader.pnl)} />
                      <Stat label="Return" value={(trader.returnPct >= 0 ? '+' : '') + trader.returnPct.toFixed(2) + '%'} />
                      <Stat label="Trades" value={String(trader.tradeCount)} />
                      <Stat label="Record" value={trader.wins + '-' + trader.losses} />
                    </div>
                  </>
                ) : (
                  <div className="py-16 text-center text-slate-600">Waiting for verified trader</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (view === 'grid') {
    return (
      <main className={shell}>
        <div className="grid min-h-screen grid-cols-4 grid-rows-2 gap-5 p-10">
          {Array.from({ length: 8 }).map((_, index) => {
            const trader = standings[index];
            return (
              <div key={trader?.id || index} className="rounded-3xl border border-white/10 bg-[#07101b]/92 p-5 shadow-2xl backdrop-blur-xl">
                {trader ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-black text-cyan-300">#{trader.rank}</div>
                      {trader.verified && <ShieldCheck className="h-5 w-5 text-emerald-300" />}
                    </div>
                    <div className="mt-8 text-2xl font-black">{trader.name}</div>
                    <div className={trader.pnl >= 0 ? 'mt-3 font-mono text-3xl font-black text-emerald-300' : 'mt-3 font-mono text-3xl font-black text-rose-300'}>
                      {trader.pnl >= 0 ? '+' : ''}{money(trader.pnl)}
                    </div>
                    <div className="mt-2 font-mono text-sm text-slate-400">
                      {trader.returnPct >= 0 ? '+' : ''}{trader.returnPct.toFixed(2)}% · {trader.tradeCount} trades
                    </div>
                  </>
                ) : (
                  <div className="grid h-full place-items-center text-sm text-slate-700">Open seat</div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  return (
    <main className={shell}>
      <div className="min-h-screen p-10">
        <div className="mx-auto max-w-[1500px] overflow-hidden rounded-3xl border border-white/10 bg-[#07101b]/94 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 p-6">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Trade House</div>
              <div className="mt-2 text-3xl font-black">{season}</div>
            </div>
            <div className={state === 'fresh' ? 'rounded-full bg-emerald-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-300' : 'rounded-full bg-amber-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-amber-300'}>
              {state === 'fresh' ? 'Verified feed live' : 'Feed reconnecting'}
            </div>
          </div>
          <div>
            {standings.slice(0, 8).map((trader) => (
              <div key={trader.id} className="grid grid-cols-[80px_1fr_180px_140px_120px] items-center gap-4 border-b border-white/[0.07] px-6 py-5 last:border-b-0">
                <div className={trader.rank <= 3 ? 'text-3xl font-black text-cyan-300' : 'text-3xl font-black text-white'}>#{trader.rank}</div>
                <div>
                  <div className="flex items-center gap-2 text-xl font-black">
                    {trader.name}
                    {trader.verified && <ShieldCheck className="h-4 w-4 text-emerald-300" />}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-slate-600">{trader.status}</div>
                </div>
                <div className={trader.pnl >= 0 ? 'text-right font-mono text-xl font-black text-emerald-300' : 'text-right font-mono text-xl font-black text-rose-300'}>
                  {trader.pnl >= 0 ? '+' : ''}{money(trader.pnl)}
                </div>
                <div className="text-right font-mono text-lg text-slate-300">
                  {trader.returnPct >= 0 ? '+' : ''}{trader.returnPct.toFixed(2)}%
                </div>
                <div className="text-right font-mono text-sm text-slate-500">{trader.tradeCount} trades</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
