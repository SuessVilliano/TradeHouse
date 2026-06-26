import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Reply, Pin } from 'lucide-react';
import type { Message } from '../../types';
import SignalCard from '../trading/SignalCard';

const QUICK_REACTIONS = ['👍', '🔥', '💰', '📈', '❌'];

interface MessageBubbleProps {
  message: Message; isOwn: boolean; onReact: (messageId: string, emoji: string) => void;
  onReply: (message: Message) => void; onPin: (messageId: string, isPinned: boolean) => void; currentUserId: string;
}

export default function MessageBubble({ message, isOwn, onReact, onReply, onPin, currentUserId }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const username = message.members?.username || 'Unknown';
  const timeAgo = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });
  const reactionCounts: Record<string, { count: number; hasReacted: boolean }> = {};
  (message.reactions || []).forEach(r => {
    if (!reactionCounts[r.emoji]) reactionCounts[r.emoji] = { count: 0, hasReacted: false };
    reactionCounts[r.emoji].count++;
    if (r.user_id === currentUserId) reactionCounts[r.emoji].hasReacted = true;
  });

  return (
    <div className={`flex items-end gap-2 group mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactionPicker(false); }}>
      {!isOwn && (
        <div className="w-7 h-7 rounded-full bg-th-accent-dim flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 mb-1">
          {username[0]?.toUpperCase() || '?'}
        </div>
      )}
      <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <div className="flex items-center gap-2 mb-0.5 px-1">
            <span className="text-xs font-semibold text-th-accent">{username}</span>
            <span className="text-[10px] text-th-muted">{timeAgo}</span>
          </div>
        )}
        {message.reply_message && (
          <div className={`text-[10px] text-th-muted bg-th-border/50 rounded-t-lg px-3 py-1 border-l-2 border-th-accent mb-0.5 max-w-full ${isOwn ? 'text-right' : 'text-left'}`}>
            <span className="font-medium text-th-accent">{message.reply_message.members?.username}: </span>
            <span className="truncate">{message.reply_message.content?.slice(0, 60)}</span>
          </div>
        )}
        <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed break-words max-w-full ${
          isOwn ? 'bg-th-bubble-own text-th-text rounded-br-sm' : 'bg-th-bubble-other text-th-text rounded-bl-sm'
        } ${message.id.startsWith('temp-') ? 'opacity-60' : ''}`}>
          {message.signal_data ? <SignalCard signal={message.signal_data} /> : <span className="whitespace-pre-wrap">{message.content}</span>}
        </div>
        {isOwn && <span className="text-[10px] text-th-muted px-1 mt-0.5">{timeAgo}</span>}
        {Object.keys(reactionCounts).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(reactionCounts).map(([emoji, { count, hasReacted }]) => (
              <button key={emoji} onClick={() => onReact(message.id, emoji)}
                className={`flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border transition-colors ${hasReacted ? 'bg-th-accent/20 border-th-accent/40 text-th-accent' : 'bg-th-border/50 border-th-border hover:bg-th-border text-th-muted'}`}>
                <span>{emoji}</span><span className="font-medium">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={`flex items-center gap-1 mb-2 transition-opacity ${showActions ? 'opacity-100' : 'opacity-0'} ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className="relative">
          <button onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-th-muted hover:text-th-text hover:bg-th-border transition-colors text-xs">
            😊
          </button>
          {showReactionPicker && (
            <div className={`absolute bottom-full mb-1 flex gap-1 bg-th-sidebar border border-th-border rounded-xl p-1.5 shadow-xl z-50 ${isOwn ? 'right-0' : 'left-0'}`}>
              {QUICK_REACTIONS.map(emoji => (
                <button key={emoji} onClick={() => { onReact(message.id, emoji); setShowReactionPicker(false); }} className="text-base hover:scale-125 transition-transform">{emoji}</button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => onReply(message)} className="w-7 h-7 rounded-lg flex items-center justify-center text-th-muted hover:text-th-text hover:bg-th-border transition-colors" title="Reply">
          <Reply size={13} />
        </button>
        <button onClick={() => onPin(message.id, !message.is_pinned)}
          className={`w-7 h-7 rounded-lg flex items-center justify-center hover:bg-th-border transition-colors ${message.is_pinned ? 'text-th-accent' : 'text-th-muted hover:text-th-text'}`}
          title={message.is_pinned ? 'Unpin' : 'Pin message'}>
          <Pin size={13} />
        </button>
      </div>
    </div>
  );
}
