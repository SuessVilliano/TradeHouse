import { useMemo, useState } from 'react';
import { Check, Clipboard, Download, ExternalLink, Hash, Plus, Radio, ShieldCheck, Swords, Trash2, Trophy, UserRound, Users } from 'lucide-react';
import { encodeQuickRoster, type QuickBattleEntry } from '../lib/quick-roster';
import { downloadOBSCollection, downloadTradeHybridShowCollection, TRADE_HYBRID_SHOWS } from '../lib/tradehouse-obs';
import { getPersistedBattleRoom } from '../lib/room-service';

type Standing = {
  id: string;
  name: string;
  rank: number;
  dashboardUrl: string;
  pnl: number;
  returnPct: number;
  tradeCount: number;
  verified: boolean;
};

type DraftEntry = QuickBattleEntry & { key: string };

const makeEntry = (index: number): DraftEntry => ({
  key: crypto.randomUUID(),
  id: 'seat-' + String(index + 1),
  name: '',
  dashboardUrl: '',
  division: 'trading',
  platform: 'other',
});

function validDashboard(url: string) {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' &&
      parsed.hostname === 'hybridfundingdashboard.propaccount.com' &&
      /^\/[a-z]{2}\/public-overview\/[0-9a-f-]+\/?$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

export default function ProducerStudio() {
  const [entries, setEntries] = useState<DraftEntry[]>([makeEntry(0), makeEntry(1)]);
  const [season, setSeason] = useState('Quick Battle');
  const [standings, setStandings] = useState<Standing[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roomLoading, setRoomLoading] = useState(false);

  const cleanEntries = useMemo(() => entries
    .filter((entry) => entry.name.trim() && entry.dashboardUrl.trim())
    .map((entry, index) => ({
      id: entry.id || 'seat-' + String(index + 1),
      name: entry.name.trim(),
      dashboardUrl: entry.dashboardUrl.trim(),
      division: entry.division || 'trading',
      platform: entry.platform || 'other',
    })), [entries]);

  const quick = cleanEntries.length ? encodeQuickRoster(cleanEntries) : '';
  const base = typeof window !== 'undefined' ? window.location.origin : '';

  const sourceUrl = (view: string, extras: Record<string, string> = {}) => {
    if (!base || !quick) return '';
    const url = new URL('/overlay/' + view, base);
    url.search = new URLSearchParams({
      overlay: '1',
      quick,
      season,
      ...(left ? { left } : {}),
      ...(right ? { right } : {}),
      ...extras,
    }).toString();
    return url.toString();
  };

  const sources = [
    { id: 'duel', title: 'Head-to-head Duel', description: 'Two verified trader stat boards for the featured matchup.', url: sourceUrl('duel'), icon: Swords },
    { id: 'grid', title: 'Eight-trader Wall', description: 'Top eight contestants in one broadcast graphics wall.', url: sourceUrl('grid'), icon: Users },
    { id: 'leaderboard', title: 'Live Leaderboard', description: 'Full-screen verified standings for breaks and intermissions.', url: sourceUrl('leaderboard'), icon: Trophy },
    { id: 'scorebug', title: 'Leader Scorebug', description: 'Compact current-leader graphic for a live show.', url: sourceUrl('scorebug'), icon: Radio },
    { id: 'lowerthird', title: 'Trader Lower Third', description: 'Individual verified trader stats for intros and interviews.', url: sourceUrl('lowerthird', { trader: left || standings[0]?.id || '' }), icon: UserRound },
  ];

  const updateEntry = (key: string, patch: Partial<DraftEntry>) => {
    setEntries((current) => current.map((entry) => entry.key === key ? { ...entry, ...patch } : entry));
    setStandings([]);
  };

  const addEntry = () => {
    if (entries.length >= 8) return;
    setEntries((current) => [...current, makeEntry(current.length)]);
  };

  const removeEntry = (key: string) => {
    setEntries((current) => current.filter((entry) => entry.key !== key));
    setStandings([]);
  };
  const loadRoom = async () => {
    const code = roomCode.trim().toUpperCase();
    if (!code) {
      setError('Enter a Trade House room code.');
      return;
    }

    setError('');
    setRoomLoading(true);

    try {
      const room = await getPersistedBattleRoom(code);
      const nextEntries: DraftEntry[] = (room.roster || []).map((entry, index) => ({
        key: crypto.randomUUID(),
        id: entry.id || 'seat-' + String(index + 1),
        name: entry.name || 'Trader ' + String(index + 1),
        dashboardUrl: entry.dashboardUrl || '',
        division: 'trading',
        platform: 'other',
      }));

      if (!nextEntries.length) {
        throw new Error('This room does not have any persisted trader proof yet.');
      }

      const roomSeason = 'Room ' + code;
      setEntries(nextEntries);
      setSeason(roomSeason);

      const roster = nextEntries.map(({ id, name, dashboardUrl, division, platform }) => ({
        id,
        name,
        dashboardUrl,
        division,
        platform,
      }));

      const response = await fetch('/api/arena/quick-leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: roster, seasonName: roomSeason }),
      });
      const data = await response.json();

      if (!response.ok || !Array.isArray(data?.standings)) {
        throw new Error(data?.error || 'Could not verify the room roster.');
      }

      const next = data.standings as Standing[];
      setStandings(next);
      setLeft(next[0]?.id || '');
      setRight(next[1]?.id || next[0]?.id || '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load that room.');
    } finally {
      setRoomLoading(false);
    }
  };


  const verify = async () => {
    setError('');
    setBusy(true);
    try {
      if (!cleanEntries.length) throw new Error('Add at least one trader and public Hybrid Funding dashboard URL.');
      const invalid = cleanEntries.find((entry) => !validDashboard(entry.dashboardUrl));
      if (invalid) throw new Error('Every contestant needs a valid public Hybrid Funding dashboard URL.');

      const response = await fetch('/api/arena/quick-leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: cleanEntries, seasonName: season }),
      });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data?.standings)) throw new Error(data?.error || 'Could not verify roster.');

      const next = data.standings as Standing[];
      if (next.some((trader) => !trader.verified)) throw new Error('One or more public dashboards could not be verified.');
      setStandings(next);
      setLeft((value) => value || next[0]?.id || '');
      setRight((value) => value || next[1]?.id || next[0]?.id || '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not verify roster.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (key: string, value: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(''), 1400);
  };

  return (
    <main className="min-h-screen bg-[#050810] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
              <Radio className="h-3.5 w-3.5" /> Producer Studio
            </div>
            <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-6xl">Build the show.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Verify the contestants once, then generate every OBS graphic from the same Hybrid Funding proof feed.
            </p>
          </div>
          <a href="/clubhouse" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-black text-slate-200">Open clubhouse</a>
        </header>

        <section className="mt-8 rounded-[28px] border border-violet-300/15 bg-gradient-to-br from-violet-500/[0.08] to-cyan-400/[0.04] p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">Weekly show scene pack</p>
              <h2 className="mt-2 text-2xl font-black">Trade Hybrid TV + OBS backdrops</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Five branded 1920×1080 browser-source scenes for the recurring Trade Hybrid programming schedule.</p>
            </div>
            <button
              type="button"
              onClick={() => downloadTradeHybridShowCollection(base)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2.5 text-sm font-black text-slate-950"
            >
              <Download className="h-4 w-4" /> Download weekly OBS scenes
            </button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {TRADE_HYBRID_SHOWS.map(([name, slug]) => (
              <a key={slug} href={'/show/' + slug} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-cyan-300/30">
                <Radio className="h-4 w-4 text-cyan-300" />
                <p className="mt-4 text-sm font-black">{name}</p>
                <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-600">Preview backdrop</p>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-[#0a0f1a] p-5 sm:p-7">
          <div className="mb-6 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
              <Hash className="h-4 w-4" /> Load a live battle room
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ROOM ID"
                maxLength={8}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-mono font-black tracking-[0.16em] text-cyan-200 outline-none focus:border-cyan-300/40"
              />
              <button
                type="button"
                onClick={loadRoom}
                disabled={roomLoading}
                className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50"
              >
                {roomLoading ? 'Loading room…' : 'Load room'}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Pulls the persisted contestants and verified Hybrid Funding proof from the room so the producer does not have to enter the roster twice.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Battle / season name</span>
              <input value={season} onChange={(e) => setSeason(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-300/40" />
            </label>
            <button type="button" onClick={verify} disabled={busy} className="rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-500 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50">
              {busy ? 'Verifying…' : 'Verify roster'}
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {entries.map((entry, index) => (
              <div key={entry.key} className="grid gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 lg:grid-cols-[70px_1fr_2fr_46px] lg:items-center">
                <div className="text-2xl font-black text-cyan-300">#{index + 1}</div>
                <input value={entry.name} onChange={(e) => updateEntry(entry.key, { name: e.target.value })} placeholder="Trader name" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/40" />
                <input value={entry.dashboardUrl} onChange={(e) => updateEntry(entry.key, { dashboardUrl: e.target.value })} placeholder="https://hybridfundingdashboard.propaccount.com/en/public-overview/…" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/40" />
                <button type="button" disabled={entries.length <= 1} onClick={() => removeEntry(entry.key)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-slate-600 hover:text-rose-300 disabled:opacity-20"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={addEntry} disabled={entries.length >= 8} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-black text-slate-300 disabled:opacity-30">
              <Plus className="h-4 w-4" /> Add contestant
            </button>
            <p className="text-xs text-slate-600">Up to 8 verified public dashboards.</p>
          </div>

          {error && <p className="mt-4 rounded-xl border border-rose-300/15 bg-rose-300/[0.05] p-3 text-sm font-semibold text-rose-300">{error}</p>}

          {standings.length > 0 && (
            <div className="mt-6 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-300"><ShieldCheck className="h-4 w-4" /> Verified roster ready</div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {standings.map((trader) => (
                  <div key={trader.id} className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                    <div className="flex items-center justify-between"><span className="truncate font-black">{trader.name}</span><span className="text-xs font-black text-cyan-300">#{trader.rank}</span></div>
                    <div className={trader.pnl >= 0 ? 'mt-2 font-mono text-sm font-black text-emerald-300' : 'mt-2 font-mono text-sm font-black text-rose-300'}>
                      {trader.pnl >= 0 ? '+' : ''}${Math.round(trader.pnl).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {standings.length > 0 && (
          <>
            <section className="mt-6 rounded-[28px] border border-white/10 bg-[#0a0f1a] p-5 sm:p-7">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">Duel setup</p>
                  <h2 className="mt-2 text-2xl font-black">Choose the featured matchup.</h2>
                </div>
                <button type="button" onClick={() => downloadOBSCollection(base, left, right, quick, season)} className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-black text-white">
                  <Download className="h-4 w-4" /> Download OBS scene collection
                </button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="text-xs font-bold text-slate-400">Left trader</span>
                  <select value={left} onChange={(e) => setLeft(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#07101b] px-4 py-3 text-sm text-white">
                    {standings.map((trader) => <option key={trader.id} value={trader.id}>{trader.rank}. {trader.name}</option>)}
                  </select>
                </label>
                <label>
                  <span className="text-xs font-bold text-slate-400">Right trader</span>
                  <select value={right} onChange={(e) => setRight(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#07101b] px-4 py-3 text-sm text-white">
                    {standings.map((trader) => <option key={trader.id} value={trader.id}>{trader.rank}. {trader.name}</option>)}
                  </select>
                </label>
              </div>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sources.map(({ id, title, description, url, icon: Icon }) => (
                <div key={id} className="rounded-3xl border border-white/10 bg-[#0b111e] p-5">
                  <Icon className="h-5 w-5 text-cyan-300" />
                  <h3 className="mt-4 text-lg font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                  <div className="mt-4 break-all rounded-xl border border-white/[0.07] bg-black/25 p-3 font-mono text-[11px] text-slate-500">{url}</div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => copy(id, url)} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950">
                      {copied === id ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
                      {copied === id ? 'Copied' : 'Copy source'}
                    </button>
                    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-slate-300">
                      Preview <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}