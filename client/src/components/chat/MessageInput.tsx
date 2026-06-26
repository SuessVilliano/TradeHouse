import { useState, useRef, useCallback } from 'react';
import { Send, X, TrendingUp, Smile } from 'lucide-react';
import type { Message, SignalData } from '../../types';

const EMOJI_LIST = ['😊', '🔥', '💰', '📈', '📉', '🎯', '💎', '🚀', '❌', '✅', '⚡', '🐂', '🐻'];

interface MessageInputProps {
  onSend: (content: string, replyTo?: string, signalData?: object) => void;
  replyTo: Message | null; onCancelReply: () => void; sending: boolean; channelName: string;
}

export default function MessageInput({ onSend, replyTo, onCancelReply, sending, channelName }: MessageInputProps) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSignal, setShowSignal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    onSend(trimmed, replyTo?.id);
    setText(''); setShowEmoji(false); textareaRef.current?.focus();
  }, [text, sending, onSend, replyTo]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const insertEmoji = (emoji: string) => { setText(prev => prev + emoji); setShowEmoji(false); textareaRef.current?.focus(); };

  return (
    <div className="flex-shrink-0 px-4 pb-4 pt-2">
      {replyTo && (
        <div className="flex items-center gap-2 bg-th-border/50 rounded-t-lg px-3 py-2 border-l-2 border-th-accent mb-0.5">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-th-accent font-semibold">Replying to {replyTo.members?.username || 'user'}</span>
            <p className="text-[10px] text-th-muted truncate">{replyTo.content}</p>
          </div>
          <button onClick={onCancelReply} className="text-th-muted hover:text-th-text transition-colors"><X size={14} /></button>
        </div>
      )}
      {showSignal && (
        <SignalComposer onSend={(signal) => { onSend(`📊 Signal: ${signal.ticker}`, replyTo?.id, signal); setShowSignal(false); setText(''); }} onClose={() => setShowSignal(false)} />
      )}
      <div className={`flex items-end gap-2 bg-th-input-bg border border-th-border rounded-xl px-3 py-2 focus-within:border-th-accent/50 transition-colors ${replyTo ? 'rounded-tl-none rounded-tr-none' : ''}`}>
        <button onClick={() => setShowSignal(!showSignal)} className={`mb-1 flex-shrink-0 transition-colors ${showSignal ? 'text-th-accent' : 'text-th-muted hover:text-th-text'}`} title="Post a trade signal">
          <TrendingUp size={18} />
        </button>
        <textarea ref={textareaRef} value={text}
          onChange={e => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
          onKeyDown={handleKeyDown} placeholder={`Message #${channelName}`} rows={1}
          className="flex-1 bg-transparent text-th-text placeholder-th-muted text-sm resize-none outline-none min-h-[24px] max-h-[120px] leading-relaxed"
          style={{ height: '24px' }} />
        <div className="relative mb-1 flex-shrink-0">
          <button onClick={() => setShowEmoji(!showEmoji)} className={`transition-colors ${showEmoji ? 'text-th-accent' : 'text-th-muted hover:text-th-text'}`}>
            <Smile size={18} />
          </button>
          {showEmoji && (
            <div className="absolute bottom-full right-0 mb-2 bg-th-sidebar border border-th-border rounded-xl p-2 shadow-xl z-50 flex flex-wrap gap-1.5 w-48">
              {EMOJI_LIST.map(emoji => <button key={emoji} onClick={() => insertEmoji(emoji)} className="text-xl hover:scale-125 transition-transform">{emoji}</button>)}
            </div>
          )}
        </div>
        <button onClick={handleSend} disabled={!text.trim() || sending}
          className="mb-1 flex-shrink-0 w-7 h-7 rounded-lg bg-th-accent disabled:opacity-30 disabled:cursor-not-allowed hover:bg-th-accent-hover flex items-center justify-center transition-colors">
          <Send size={13} className="text-white" />
        </button>
      </div>
    </div>
  );
}

function SignalComposer({ onSend, onClose }: { onSend: (s: SignalData) => void; onClose: () => void }) {
  const [signal, setSignal] = useState<Partial<SignalData>>({ direction: 'LONG' });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signal.ticker || !signal.entry || !signal.stopLoss || !signal.takeProfit) return;
    onSend(signal as SignalData);
  };
  return (
    <div className="bg-th-sidebar border border-th-border rounded-xl p-4 mb-2 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-th-text flex items-center gap-2"><TrendingUp size={14} className="text-th-accent" /> Post Trade Signal</span>
        <button onClick={onClose} className="text-th-muted hover:text-th-text"><X size={14} /></button>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2">
        <input placeholder="Ticker (e.g. AAPL)" className="col-span-2 bg-th-input-bg border border-th-border rounded-lg px-3 py-1.5 text-th-text placeholder-th-muted text-xs focus:outline-none focus:border-th-accent" onChange={e => setSignal(prev => ({ ...prev, ticker: e.target.value.toUpperCase() }))} required />
        <div className="col-span-2 flex gap-2">
          {(['LONG', 'SHORT'] as const).map(dir => (
            <button key={dir} type="button" onClick={() => setSignal(prev => ({ ...prev, direction: dir }))}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${signal.direction === dir ? dir === 'LONG' ? 'bg-th-green text-black' : 'bg-th-red text-white' : 'bg-th-border text-th-muted'}`}>
              {dir === 'LONG' ? '📈' : '📉'} {dir}
            </button>
          ))}
        </div>
        {[['Entry', 'entry'], ['Stop Loss', 'stopLoss'], ['Take Profit', 'takeProfit']].map(([label, key]) => (
          <input key={key} placeholder={label} type="number" step="any"
            className="bg-th-input-bg border border-th-border rounded-lg px-3 py-1.5 text-th-text placeholder-th-muted text-xs focus:outline-none focus:border-th-accent"
            onChange={e => setSignal(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))} required />
        ))}
        <input placeholder="Timeframe (e.g. 1H)" className="bg-th-input-bg border border-th-border rounded-lg px-3 py-1.5 text-th-text placeholder-th-muted text-xs focus:outline-none focus:border-th-accent" onChange={e => setSignal(prev => ({ ...prev, timeframe: e.target.value }))} />
        <textarea placeholder="Rationale (optional)" className="col-span-2 bg-th-input-bg border border-th-border rounded-lg px-3 py-1.5 text-th-text placeholder-th-muted text-xs focus:outline-none focus:border-th-accent resize-none" rows={2} onChange={e => setSignal(prev => ({ ...prev, rationale: e.target.value }))} />
        <button type="submit" className="col-span-2 bg-th-accent hover:bg-th-accent-hover text-white text-xs font-semibold py-2 rounded-lg transition-colors">Post Signal</button>
      </form>
    </div>
  );
}
