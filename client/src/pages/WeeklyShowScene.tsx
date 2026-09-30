import { useParams } from 'react-router-dom';
import { BarChart3, Presentation, Radio, Swords, Trophy, Tv2 } from 'lucide-react';

const SHOWS: Record<string, {
  title: string;
  eyebrow: string;
  day: string;
  subtitle: string;
  icon: typeof Trophy;
  layout: 'picks'|'battle'|'market'|'live'|'presentation';
}> = {
  'hybrid-picks': {
    title: 'HYBRID PICKS',
    eyebrow: 'TRADE HYBRID TV',
    day: 'SUNDAY NIGHT',
    subtitle: 'Predictions · Matchups · Picks · Recap',
    icon: Trophy,
    layout: 'picks',
  },
  'trade-battles': {
    title: 'TRADE BATTLES',
    eyebrow: 'TRADE HOUSE',
    day: 'ALL WEEK',
    subtitle: 'Verified traders · Live rooms · Public proof',
    icon: Swords,
    layout: 'battle',
  },
  'market-watch-mondays': {
    title: 'MARKET WATCH MONDAYS',
    eyebrow: 'TRADE HYBRID TV',
    day: 'MONDAY',
    subtitle: 'Context · Watchlist · Levels · Setups',
    icon: BarChart3,
    layout: 'market',
  },
  'wednesday-live': {
    title: 'WEDNESDAY LIVE',
    eyebrow: 'TRADE HYBRID TV',
    day: 'WEDNESDAY',
    subtitle: 'Live session · Screen share · Community',
    icon: Radio,
    layout: 'live',
  },
  'super-saturdays': {
    title: 'SUPER SATURDAYS',
    eyebrow: 'TRADE HYBRID CLUB',
    day: 'SATURDAY',
    subtitle: 'Education · Funding · Affiliates · Presentations',
    icon: Presentation,
    layout: 'presentation',
  },
};

function Frame({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div className={'relative overflow-hidden rounded-[28px] border border-white/20 bg-white/[0.08] backdrop-blur ' + className}>
      <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[12px] font-black uppercase tracking-[0.18em] text-white/75">{label}</div>
      <div className="absolute inset-0 grid place-items-center">
        <div className="h-16 w-16 rounded-full border border-white/10 bg-white/[0.04]" />
      </div>
    </div>
  );
}

export default function WeeklyShowScene() {
  const { slug = 'trade-battles' } = useParams();
  const show = SHOWS[slug] || SHOWS['trade-battles'];
  const Icon = show.icon;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#070b14] text-white">
      <div className="absolute -left-52 -top-52 h-[720px] w-[720px] rounded-full bg-violet-600/35 blur-[160px]" />
      <div className="absolute -right-48 top-12 h-[720px] w-[720px] rounded-full bg-cyan-500/25 blur-[170px]" />
      <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-400" />

      <header className="relative z-10 flex h-[118px] items-center justify-between border-b border-white/10 px-12">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-blue-500 to-cyan-500 shadow-2xl">
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[13px] font-black uppercase tracking-[0.3em] text-cyan-300">{show.eyebrow}</p>
            <h1 className="mt-1 text-[34px] font-black tracking-[-0.04em]">{show.title}</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[13px] font-black uppercase tracking-[0.24em] text-violet-300">{show.day}</p>
          <p className="mt-1 text-[14px] text-white/55">{show.subtitle}</p>
        </div>
      </header>

      <section className="relative z-10 h-[calc(100vh-118px)] p-10">
        {show.layout === 'picks' && (
          <div className="grid h-full grid-cols-[1.18fr_.82fr] gap-6">
            <Frame label="Hosts / cameras" />
            <div className="grid gap-6">
              <div className="rounded-[28px] border border-white/20 bg-white/[0.08] p-6">
                <p className="text-[13px] font-black uppercase tracking-[0.2em] text-cyan-300">Tonight’s board</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {Array.from({length:8}).map((_,i)=><div key={i} className="h-14 rounded-xl border border-white/10 bg-black/20" />)}
                </div>
              </div>
              <div className="rounded-[28px] bg-gradient-to-r from-violet-600/80 via-blue-500/80 to-cyan-500/80 p-6">
                <p className="text-[12px] font-black uppercase tracking-[0.2em] text-white/70">Recap / results</p>
                <p className="mt-2 text-[28px] font-black">✓ Wins · ✕ Losses · Live record</p>
              </div>
            </div>
          </div>
        )}

        {show.layout === 'battle' && (
          <div className="grid h-full grid-cols-2 gap-6">
            <Frame label="Trader A · camera + screen" />
            <Frame label="Trader B · camera + screen" />
            <div className="absolute inset-x-0 bottom-10 mx-auto flex w-[860px] items-center justify-between rounded-2xl border border-white/15 bg-black/55 px-7 py-4 backdrop-blur-xl">
              <span className="text-[18px] font-black">VERIFIED P&L</span>
              <span className="text-[18px] font-mono font-black text-emerald-300">+$0</span>
              <span className="text-[12px] font-black uppercase tracking-[0.2em] text-cyan-300">Trade House · Live</span>
            </div>
          </div>
        )}

        {show.layout === 'market' && (
          <div className="grid h-full grid-cols-[1.35fr_.65fr] gap-6">
            <Frame label="Primary chart / screen share" />
            <div className="grid gap-6">
              <Frame label="Host camera" className="min-h-0" />
              <div className="rounded-[28px] border border-white/20 bg-white/[0.08] p-6">
                <p className="text-[13px] font-black uppercase tracking-[0.2em] text-cyan-300">Watchlist</p>
                <div className="mt-5 space-y-3">
                  {['NQ','ES','GC','EURUSD','BTC'].map((s)=><div key={s} className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3"><span className="font-black">{s}</span><span className="text-white/40">LEVELS</span></div>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {show.layout === 'live' && (
          <div className="grid h-full grid-cols-[1.45fr_.55fr] gap-6">
            <Frame label="Live trading / screen share" />
            <div className="grid gap-6">
              <Frame label="Host" />
              <div className="rounded-[28px] border border-white/20 bg-white/[0.08] p-6">
                <p className="text-[13px] font-black uppercase tracking-[0.2em] text-violet-300">Community chat</p>
                <div className="mt-4 space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-11 rounded-xl bg-black/20" />)}</div>
              </div>
            </div>
          </div>
        )}

        {show.layout === 'presentation' && (
          <div className="grid h-full grid-cols-[1.35fr_.65fr] gap-6">
            <Frame label="Presentation / evergreen video" />
            <div className="grid gap-6">
              <Frame label="Presenter / host" />
              <div className="rounded-[28px] bg-gradient-to-br from-violet-600/80 to-cyan-500/70 p-6">
                <Tv2 className="h-7 w-7" />
                <p className="mt-5 text-[24px] font-black">Trade Hybrid Club</p>
                <p className="mt-1 text-[15px] text-white/65">Hybrid Funding · Academy · Affiliate opportunity</p>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
