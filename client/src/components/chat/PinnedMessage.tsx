import { Pin, X } from 'lucide-react';
import type { Message } from '../../types';

interface PinnedMessageProps { message: Message; onUnpin?: () => void; currentUserId: string; }

export default function PinnedMessage({ message, onUnpin }: PinnedMessageProps) {
  const username = message.members?.username || 'Unknown';
  const preview = message.content.length > 80 ? message.content.slice(0, 80) + '…' : message.content;
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-th-accent/10 border-b border-th-accent/20">
      <Pin size={14} className="text-th-accent flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-semibold text-th-accent uppercase tracking-wider mr-2">Pinned</span>
        <span className="text-xs text-th-muted">{username}: </span>
        <span className="text-xs text-th-text">{preview}</span>
      </div>
      {onUnpin && (
        <button onClick={onUnpin} className="text-th-muted hover:text-th-text transition-colors flex-shrink-0" title="Unpin message">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
