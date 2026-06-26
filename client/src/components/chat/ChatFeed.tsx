import { useEffect, useRef, useState } from 'react';
import { useChat } from '../../hooks/useChat';
import type { Channel, AuthUser, Message } from '../../types';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import PinnedMessage from './PinnedMessage';
import { Loader2 } from 'lucide-react';

interface ChatFeedProps { channel: Channel; user: AuthUser; }

export default function ChatFeed({ channel, user }: ChatFeedProps) {
  const { messages, pinnedMessage, loading, sending, sendMessage, addReaction, pinMessage } = useChat(channel, user);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  useEffect(() => { if (atBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, atBottom]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'instant' }); setAtBottom(true); }, [channel.id]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 100);
  };

  const groupedMessages = messages.reduce<{ type: 'date' | 'message'; date?: string; message?: Message }[]>(
    (acc, msg, i) => {
      const msgDate = new Date(msg.created_at).toDateString();
      const prevDate = i > 0 ? new Date(messages[i - 1].created_at).toDateString() : null;
      if (msgDate !== prevDate) acc.push({ type: 'date', date: msgDate });
      acc.push({ type: 'message', message: msg });
      return acc;
    }, []
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-th-chat">
      {pinnedMessage && (
        <PinnedMessage message={pinnedMessage} currentUserId={user.id} onUnpin={() => pinMessage(pinnedMessage.id, false)} />
      )}
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-3 th-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full"><Loader2 size={24} className="text-th-muted animate-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-th-text font-semibold mb-1">#{channel.name}</p>
            <p className="text-th-muted text-sm">Be the first to post in this channel</p>
          </div>
        ) : (
          <>
            {groupedMessages.map((item, i) => {
              if (item.type === 'date') {
                return (
                  <div key={`date-${i}`} className="flex items-center gap-3 my-4">
                    <div className="flex-1 border-t border-th-border" />
                    <span className="text-[10px] text-th-muted font-medium bg-th-chat px-2">
                      {item.date === new Date().toDateString() ? 'Today' : item.date}
                    </span>
                    <div className="flex-1 border-t border-th-border" />
                  </div>
                );
              }
              const message = item.message!;
              return (
                <MessageBubble key={message.id} message={message} isOwn={message.user_id === user.id}
                  currentUserId={user.id} onReact={addReaction} onReply={setReplyTo} onPin={pinMessage} />
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>
      {!atBottom && (
        <button onClick={() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setAtBottom(true); }}
          className="absolute bottom-20 right-8 bg-th-accent text-white text-xs px-3 py-1.5 rounded-full shadow-lg hover:bg-th-accent-hover transition-colors">
          ↓ Jump to latest
        </button>
      )}
      <MessageInput onSend={sendMessage} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} sending={sending} channelName={channel.name} />
    </div>
  );
}
