import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Copy, Flag, Gauge, Shield, ShieldCheck, Swords, Target, Trophy, Users, Zap } from 'lucide-react';
import { BATTLE_PRESETS, battleObjective, encodeRule, type BattleFormat } from '../lib/battle-rules';
import { createPersistedBattleRoom, joinPersistedBattleRoom } from '../lib/room-service';
import type { AuthUser } from '../types';

type BattleMode = '1v1' | '2v2' | '3v3';

type VerifiedAccount = {
  name: string;
  startingBalance: number;
  balance: number;
  equity: number;
  pnl: number;
  returnPct: number;
  tradeCount: number;
  wins: number;
  losses: number;
  verified: boolean;
  dashboardUrl: string;
};

const MODES: Array<{ value: BattleMode; label: string; desc: string; icon: typeof Swords }> = [
  { value: '1v1', label: '1V1', desc: 'Head-to-head duel', icon: Swords },
  { value: '2v2', label: '2V2', desc: 'Two traders per side', icon: Users },
  { value: '3v3', label: '3V3', desc: 'Full squad showdown', icon: Shield },
];

function generateRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function PracticeBattles({ user }: { user: AuthUser }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<BattleMode>('1v1');
  const [format, setFormat] = useState<BattleFormat>('spotlight');
  const [traderName, setTraderName] = useState('');
  const [dashboardUrl, setDashboardUrl] = useState('');
  const [verifiedAccount, setVerifiedAccount] = useState<VerifiedAccount | null>(null);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [roomId, setRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [launchBusy, setLaunchBusy] = useState(false);

  const dashboardValid = useMemo(() => {
    try {
      const parsed = new URL(dashboardUrl.trim());
      return parsed.protocol === 'https:' &&
        parsed.hostname === 'hybridfundingdashboard.propaccount.com' &&
        /^\/[a-z]{2}\/public-overview\/[0-9a-f-]+\/?$/i.test(parsed.pathname);
    } catch {
      return false;
    }
  }, [dashboardUrl]);

  const verifyDashboard = async () => {
    setVerifyBusy(true);
    setVerifyError('');
    setVerifiedAccount(null);
    try {
      if (!dashboardValid) throw new Error('Paste your public Hybrid Funding dashboard link. No password is needed.');
      const response = await fetch('/api/arena/quick-leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: [{
            id: 'connection',
            name: traderName.trim() || 'Trader',
            dashboardUrl: dashboardUrl.trim(),
            division: 'trading',
            platform: 'other',
          }],
          seasonName: 'Practice Battle',
        }),
      });
      const data = await response.json();
      const account = data?.standings?.[0] as VerifiedAccount | undefined;
      if (!response.ok || !account?.verified) throw new Error('Dashboard unavailable. Check the public link and try again.');
      setVerifiedAccount(account);
      setDashboardUrl(account.dashboardUrl || dashboardUrl.trim());
    } catch (e) {
      setVerifyError(e instanceof Error ? e.message : 'Could not verify dashboard.');
    } finally {
      setVerifyBusy(false);
    }
  };

  const launch = async (id: string, joining = false) => {
    if (!traderName.trim()) { setError('Enter your trader name.'); return; }
    if (!id.trim()) { setError(joining ? 'Enter the Room ID.' : 'Generate a Room ID first.'); return; }

    setError('');
    setLaunchBusy(true);

    try {
      const normalizedId = id.trim().toUpperCase();
      let roomMode = mode;
      let roomRule = BATTLE_PRESETS[format];

      if (joining) {
        const room = await joinPersistedBattleRoom({
          roomId: normalizedId,
          participant: {
            id: user.id,
            name: traderName.trim(),
            dashboardUrl: dashboardUrl.trim(),
          },
        });
        roomMode = room.mode;
        roomRule = room.rule;
      } else {
        const created = await createPersistedBattleRoom({
          roomId: normalizedId,
          hostUserRef: user.id,
          hostName: traderName.trim(),
          hostDashboardUrl: dashboardUrl.trim(),
          mode,
          rule: BATTLE_PRESETS[format],
        });

        sessionStorage.setItem('tradehouse-room-host:' + normalizedId, created.hostToken);
        roomMode = created.room.mode;
        roomRule = created.room.rule;
      }

      const params = new URLSearchParams({
        mode: roomMode,
        name: traderName.trim(),
        side: joining ? 'right' : 'left',
        joining: joining ? '1' : '0',
      });

      if (dashboardUrl.trim()) params.set('dashboardUrl', dashboardUrl.trim());
      const ruleParams = encodeRule(roomRule);
      ruleParams.forEach((value, key) => params.set(key, value));

      navigate('/battle/' + normalizedId + '?' + params.toString());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open this battle room.');
    } finally {
      setLaunchBusy(false);
    }
  };

  const copyRoomId = async () => {
    if (!roomId) return;
    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className="min-h-screen bg-[#070a12] px-4 py-10 text-white sm:px-6">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,.11),transparent_38%),radial-gradient(circle_at_85%_25%,rgba(139,92,246,.09),transparent_32%)]" />
      <div className="relative mx-auto max-w-2xl">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
            <Swords className="h-3.5 w-3.5" /> Practice Battles
          </div>
          <h1 className="mt-5 text-4xl font-black uppercase tracking-tight sm:text-6xl">
            Launch a battle in <span className="text-cyan-300">minutes.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400">
            Use your Hybrid Funding public dashboard as verified proof, choose the room size, share the code, and go.
          </p>
        </div>

        <div className="mt-9 space-y-4">
          <section className="rounded-3xl border border-white/10 bg-[#0d1320] p-5 sm:p-6">
            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Trader name</label>
            <input value={traderName} onChange={(e) => setTraderName(e.target.value)} placeholder="e.g. HybridKing" maxLength={24}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-lg font-bold text-white outline-none focus:border-cyan-300/50" />
          </section>

          <section className="rounded-3xl border border-cyan-300/20 bg-[#091521] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-cyan-200">Connect Hybrid Funding proof</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Paste the public Hybrid Funding dashboard URL. No username, password, or broker credentials are needed.</p>
              </div>
              {verifiedAccount && <ShieldCheck className="h-6 w-6 flex-shrink-0 text-emerald-300" />}
            </div>
            <input value={dashboardUrl} onChange={(e) => { setDashboardUrl(e.target.value); setVerifiedAccount(null); setVerifyError(''); }}
              type="url" placeholder="https://hybridfundingdashboard.propaccount.com/en/public-overview/…"
              className="mt-4 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50" />
            <button type="button" disabled={verifyBusy || !dashboardUrl.trim()} onClick={verifyDashboard}
              className="mt-3 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950 disabled:opacity-40">
              {verifyBusy ? 'Checking dashboard…' : 'Verify dashboard'}
            </button>
            {verifyError && <p className="mt-3 text-sm font-semibold text-rose-300">{verifyError}</p>}
            {verifiedAccount && (
              <div className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.05] p-4">
                <p className="text-xs font-black uppercase tracking-wider text-emerald-300">Verified Hybrid Funding feed</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div><span className="block text-xs text-slate-500">Balance</span>${Number(verifiedAccount.balance).toLocaleString()}</div>
                  <div><span className="block text-xs text-slate-500">Equity</span>${Number(verifiedAccount.equity).toLocaleString()}</div>
                  <div><span className="block text-xs text-slate-500">P&amp;L</span>${Number(verifiedAccount.pnl).toLocaleString()}</div>
                  <div><span className="block text-xs text-slate-500">Trades</span>{verifiedAccount.tradeCount}</div>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#0d1320] p-5 sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Battle mode</p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {MODES.map(({ value, label, desc, icon: Icon }) => {
                const active = value === mode;
                return (
                  <button key={value} type="button" onClick={() => setMode(value)}
                    className={active ? 'rounded-2xl border border-cyan-300/50 bg-cyan-300/[0.08] p-4 text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,.08)]' : 'rounded-2xl border border-white/10 bg-black/20 p-4 text-slate-500'}>
                    <Icon className="mx-auto h-6 w-6" />
                    <p className="mt-3 text-lg font-black">{label}</p>
                    <p className="mt-1 hidden text-[10px] sm:block">{desc}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#0d1320] p-5 sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Battle rules</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {([
                ['spotlight', 'Spotlight', Swords],
                ['sprint', 'Sprint', Gauge],
                ['target', 'Target', Target],
                ['prop', 'Prop', ShieldCheck],
                ['league', 'League', Trophy],
              ] as const).map(([value, label, Icon]) => {
                const active = format === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormat(value)}
                    className={active
                      ? 'rounded-2xl border border-violet-300/50 bg-violet-300/[0.08] p-4 text-violet-200'
                      : 'rounded-2xl border border-white/10 bg-black/20 p-4 text-slate-500'}
                  >
                    <Icon className="mx-auto h-5 w-5" />
                    <p className="mt-2 text-sm font-black">{label}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-violet-300" />
                <p className="text-sm font-black">{BATTLE_PRESETS[format].label}</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">{battleObjective(BATTLE_PRESETS[format])}</p>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d1320]">
            <div className="grid grid-cols-2 border-b border-white/10">
              <button type="button" onClick={() => { setTab('create'); setError(''); }}
                className={tab === 'create' ? 'py-3 text-xs font-black uppercase tracking-[0.16em] bg-cyan-300/[0.06] text-cyan-300' : 'py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-600'}>Create room</button>
              <button type="button" onClick={() => { setTab('join'); setError(''); }}
                className={tab === 'join' ? 'py-3 text-xs font-black uppercase tracking-[0.16em] bg-cyan-300/[0.06] text-cyan-300' : 'py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-600'}>Join room</button>
            </div>
            <div className="p-5 sm:p-6">
              {tab === 'create' ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex min-h-14 flex-1 items-center rounded-2xl border border-white/10 bg-black/25 px-4 font-mono text-xl font-black tracking-[0.28em] text-cyan-300">
                      {roomId || <span className="font-sans text-sm font-medium tracking-normal text-slate-700">Generate a room ID…</span>}
                    </div>
                    {roomId && (
                      <button type="button" onClick={copyRoomId} className="rounded-2xl border border-white/10 bg-black/25 px-4 text-slate-400 hover:text-white">
                        {copied ? <Check className="h-5 w-5 text-emerald-300" /> : <Copy className="h-5 w-5" />}
                      </button>
                    )}
                  </div>
                  <button type="button" onClick={() => setRoomId(generateRoomId())}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.05] px-4 py-3 text-sm font-black text-cyan-300">
                    <Zap className="h-4 w-4" /> Generate room ID
                  </button>
                  {error && <p className="text-center text-sm font-semibold text-rose-300">{error}</p>}
                  <button type="button" disabled={launchBusy} onClick={() => launch(roomId)}
                    className="w-full rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-500 py-4 text-sm font-black uppercase tracking-[0.15em] text-[#070a12] disabled:opacity-50">{launchBusy ? 'Creating room…' : 'Enter the arena'}</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <input value={joinRoomId} onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())} placeholder="ROOM ID" maxLength={8}
                    className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-center font-mono text-xl font-black tracking-[0.28em] text-cyan-300 outline-none focus:border-cyan-300/50" />
                  {error && <p className="text-center text-sm font-semibold text-rose-300">{error}</p>}
                  <button type="button" disabled={launchBusy} onClick={() => launch(joinRoomId, true)}
                    className="w-full rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-500 py-4 text-sm font-black uppercase tracking-[0.15em] text-[#070a12] disabled:opacity-50">{launchBusy ? 'Joining room…' : 'Join battle'}</button>
                </div>
              )}
            </div>
          </section>

          <p className="text-center text-[11px] leading-5 text-slate-600">
            Verified scoring remains sourced from the public Hybrid Funding dashboard. The standalone arena does not replace or modify your Hybrid Funding account.
          </p>
        </div>
      </div>
    </main>
  );
}