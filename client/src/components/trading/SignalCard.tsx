import type { SignalData } from '../../types';
import { TrendingUp, TrendingDown, Target, ShieldAlert, Clock } from 'lucide-react';

export default function SignalCard({ signal }: { signal: SignalData }) {
  const isLong = signal.direction === 'LONG';
  const riskReward = signal.takeProfit && signal.entry && signal.stopLoss
    ? Math.abs((signal.takeProfit - signal.entry) / (signal.entry - signal.stopLoss)).toFixed(2) : null;
  return (
    <div className={`rounded-xl border overflow-hidden my-1 w-full max-w-[320px] ${isLong ? 'border-th-green/30 bg-th-green/5' : 'border-th-red/30 bg-th-red/5'}`}>
      <div className={`flex items-center justify-between px-3 py-2 ${isLong ? 'bg-th-green/20' : 'bg-th-red/20'}`}>
        <div className="flex items-center gap-2">
          {isLong ? <TrendingUp size={14} className="text-th-green" /> : <TrendingDown size={14} className="text-th-red" />}
          <span className="font-bold text-th-text text-sm">{signal.ticker}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isLong ? 'bg-th-green/30 text-th-green' : 'bg-th-red/30 text-th-red'}`}>{signal.direction}</span>
      </div>
      <div className="px-3 py-2.5 grid grid-cols-3 gap-2">
        <PriceLevel label="Entry" value={signal.entry} icon={<span className="text-th-muted">→</span>} />
        <PriceLevel label="Stop Loss" value={signal.stopLoss} icon={<ShieldAlert size={11} className="text-th-red" />} valueColor="text-th-red" />
        <PriceLevel label="Take Profit" value={signal.takeProfit} icon={<Target size={11} className="text-th-green" />} valueColor="text-th-green" />
      </div>
      <div className="px-3 pb-2.5 flex items-center gap-3 flex-wrap">
        {signal.timeframe && <div className="flex items-center gap-1 text-[10px] text-th-muted"><Clock size={10} /><span>{signal.timeframe}</span></div>}
        {riskReward && <div className="text-[10px] font-medium"><span className="text-th-muted">R:R </span><span className="text-th-accent">1:{riskReward}</span></div>}
      </div>
      {signal.rationale && <div className="border-t border-th-border/50 px-3 py-2"><p className="text-[11px] text-th-muted leading-relaxed">{signal.rationale}</p></div>}
    </div>
  );
}

function PriceLevel({ label, value, icon, valueColor = 'text-th-text' }: { label: string; value: number; icon: React.ReactNode; valueColor?: string; }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-0.5 text-[9px] text-th-muted uppercase tracking-wider">{icon}<span>{label}</span></div>
      <span className={`text-xs font-bold font-mono ${valueColor}`}>{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
    </div>
  );
}
