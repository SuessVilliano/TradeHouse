import { useRemoteParticipants } from '@livekit/components-react';
import { useMemo } from 'react';

export default function AudienceGrid() {
  const remoteParticipants = useRemoteParticipants();
  const audience = useMemo(() => remoteParticipants.filter(p => !p.isSpeaking).slice(0, 40), [remoteParticipants]);
  if (!audience.length) return null;
  return (
    <div className="mt-6 px-4">
      <p className="text-[10px] font-semibold text-th-muted uppercase tracking-wider mb-3">👂 Listening ({audience.length})</p>
      <div className="flex flex-wrap gap-3">
        {audience.map(p => (
          <div key={p.identity} className="flex flex-col items-center gap-1 group">
            <div className="w-10 h-10 rounded-full bg-th-border flex items-center justify-center text-sm font-semibold text-th-muted group-hover:text-th-text group-hover:bg-th-accent-dim transition-colors">
              {(p.name || p.identity)[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-[9px] text-th-muted group-hover:text-th-text transition-colors max-w-[44px] truncate text-center">{p.name || p.identity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
