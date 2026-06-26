import { Mic, MicOff, Hand, LogOut, Users } from 'lucide-react';

interface StageControlsProps {
  isMuted: boolean; isHandRaised: boolean; listenerCount: number;
  onToggleMic: () => void; onRaiseHand: () => void; onLeave: () => void;
}

export default function StageControls({ isMuted, isHandRaised, listenerCount, onToggleMic, onRaiseHand, onLeave }: StageControlsProps) {
  return (
    <div className="flex items-center justify-between px-8 py-5 border-t border-th-border bg-th-sidebar/80">
      <div className="flex items-center gap-2 text-th-muted">
        <Users size={16} /><span className="text-sm">{listenerCount} listening</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onRaiseHand} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${isHandRaised ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' : 'bg-th-border text-th-muted hover:text-th-text hover:bg-th-border/80'}`}>
          <Hand size={15} />{isHandRaised ? 'Lower Hand' : 'Raise Hand'}
        </button>
        <button onClick={onToggleMic} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${isMuted ? 'bg-th-red/20 text-th-red border border-th-red/30 hover:bg-th-red/30' : 'bg-th-accent text-white hover:bg-th-accent-hover shadow-md shadow-th-accent/30'}`}>
          {isMuted ? <MicOff size={15} /> : <Mic size={15} />}{isMuted ? 'Unmute' : 'Mute'}
        </button>
      </div>
      <button onClick={onLeave} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-th-border text-th-red hover:bg-th-red/10 border border-th-red/20 font-medium text-sm transition-colors">
        <LogOut size={15} />Leave
      </button>
    </div>
  );
}
