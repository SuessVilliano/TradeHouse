import { Mic, MicOff, Hand } from 'lucide-react';

interface SpeakerTileProps {
  identity: string; name: string; isSpeaking: boolean; isMuted: boolean; isHandRaised: boolean; isHost?: boolean; size?: 'large' | 'small';
}

export default function SpeakerTile({ identity: _identity, name, isSpeaking, isMuted, isHandRaised, isHost = false, size = 'large' }: SpeakerTileProps) {
  const isLarge = size === 'large';
  const avatarSize = isLarge ? 'w-20 h-20' : 'w-12 h-12';
  const textSize = isLarge ? 'text-base' : 'text-xs';
  const iconSize = isLarge ? 16 : 11;
  return (
    <div className={`flex flex-col items-center gap-2 ${isLarge ? 'p-3' : 'p-1.5'}`}>
      <div className="relative">
        <div className={`${avatarSize} rounded-full bg-th-accent-dim flex items-center justify-center font-bold text-white transition-all duration-200 ${
          isSpeaking ? 'ring-4 ring-th-accent ring-offset-2 ring-offset-th-bg animate-pulse-ring' : 'ring-2 ring-th-border ring-offset-2 ring-offset-th-bg'
        } ${isLarge ? 'text-2xl' : 'text-base'}`}>{name[0]?.toUpperCase() || '?'}</div>
        <div className={`absolute bottom-0 right-0 rounded-full flex items-center justify-center ${isLarge ? 'w-6 h-6' : 'w-4 h-4'} ${isMuted ? 'bg-th-red' : 'bg-th-green'} border-2 border-th-bg`}>
          {isMuted ? <MicOff size={iconSize - 3} className="text-white" /> : <Mic size={iconSize - 3} className="text-white" />}
        </div>
        {isHandRaised && (
          <div className={`absolute -top-1 -right-1 rounded-full flex items-center justify-center bg-yellow-500 border-2 border-th-bg ${isLarge ? 'w-7 h-7' : 'w-5 h-5'}`}>
            <Hand size={isLarge ? 14 : 10} className="text-white" />
          </div>
        )}
      </div>
      <div className={`${textSize} font-medium text-th-text text-center leading-tight`}>
        <span>{name}</span>
        {isHost && <span className={`block text-th-accent font-semibold ${isLarge ? 'text-xs' : 'text-[9px]'}`}>HOST</span>}
      </div>
    </div>
  );
}
