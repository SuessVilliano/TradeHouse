import { useEffect, useState } from 'react';
import { Hash, Mic2, Video, Radio, Plus, ChevronDown, ChevronRight, X } from 'lucide-react';
import type { Channel } from '../../types';
import { useDemo } from '../../lib/demoContext';

interface ChannelListProps {
  channels: Channel[];
  activeChannelId: string | null;
  onSelectChannel: (channel: Channel) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const channelIcons: Record<string, React.ReactNode> = {
  text: <Hash size={15} />, audio: <Mic2 size={15} />, video: <Video size={15} />, stream: <Radio size={15} />,
};

const CATEGORY_EMOJIS: Record<string, string> = {
  'TEXT CHANNELS': '💬', 'VOICE ROOMS': '🎙️', 'VOICE CHANNELS': '🎙️', 'LIVE': '🔴',
};

export default function ChannelList({ channels, activeChannelId, onSelectChannel, isOpen = false, onClose }: ChannelListProps) {
  const { isDemoMode, addDemoChannel } = useDemo();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [newChannelCategory, setNewChannelCategory] = useState<string | null>(null);
  const [newChannelName, setNewChannelName] = useState('');

  const grouped = channels.reduce<Record<string, Channel[]>>((acc, ch) => {
    if (!acc[ch.category]) acc[ch.category] = [];
    acc[ch.category].push(ch);
    return acc;
  }, {});

  const toggleCategory = (cat: string) => setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));

  const handleAddClick = (e: React.MouseEvent, category: string) => {
    e.stopPropagation();
    if (isDemoMode) {
      setNewChannelCategory(category);
      setNewChannelName('');
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChannelName.trim()) {
      addDemoChannel(newChannelName.trim());
    }
    setNewChannelCategory(null);
    setNewChannelName('');
  };

  return (
    <>
      {/* Backdrop overlay — mobile only, shown when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Channel list panel */}
      <div
        className={[
          // Mobile: fixed drawer
          'fixed md:static inset-y-0 left-0 z-50',
          // Desktop: always visible; mobile: slide in/out
          'transform transition-transform duration-200 ease-in-out',
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Sizing & styling
          'w-[220px] h-full bg-th-sidebar border-r border-th-border flex flex-col',
        ].join(' ')}
      >
        {/* Header */}
        <div className="h-12 border-b border-th-border flex items-center px-4 flex-shrink-0">
          <span className="text-th-text font-semibold text-sm flex-1">TradeHouse</span>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="md:hidden text-th-muted hover:text-th-text transition-colors"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
          <ChevronDown size={16} className="text-th-muted hidden md:block" />
        </div>

        {/* Channel categories */}
        <div className="flex-1 overflow-y-auto py-2 th-scrollbar">
          {Object.entries(grouped).map(([category, chans]) => (
            <div key={category} className="mb-2">
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center gap-1 px-3 py-1 w-full text-left group"
              >
                {collapsed[category]
                  ? <ChevronRight size={10} className="text-th-muted" />
                  : <ChevronDown size={10} className="text-th-muted" />}
                <span className="text-[10px] font-semibold text-th-muted uppercase tracking-wider group-hover:text-th-text transition-colors">
                  {CATEGORY_EMOJIS[category] || ''} {category}
                </span>
                {/* + button */}
                <button
                  onClick={e => handleAddClick(e, category)}
                  className={`ml-auto transition-opacity text-th-muted hover:text-th-text ${isDemoMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  title={isDemoMode ? 'Add channel' : undefined}
                >
                  <Plus size={13} />
                </button>
              </button>

              {/* Inline new-channel input (demo mode) */}
              {isDemoMode && newChannelCategory === category && (
                <form onSubmit={handleAddSubmit} className="px-3 py-1.5" onClick={e => e.stopPropagation()}>
                  <input
                    autoFocus
                    type="text"
                    value={newChannelName}
                    onChange={e => setNewChannelName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Escape') { setNewChannelCategory(null); } }}
                    placeholder="channel-name"
                    className="w-full bg-th-bg border border-th-border rounded px-2 py-1 text-xs text-th-text placeholder:text-th-muted focus:outline-none focus:border-th-accent"
                  />
                  <div className="flex gap-1 mt-1">
                    <button type="submit" className="text-[10px] bg-th-accent text-white px-2 py-0.5 rounded hover:bg-th-accent/80 transition-colors">Add</button>
                    <button type="button" onClick={() => setNewChannelCategory(null)} className="text-[10px] text-th-muted hover:text-th-text px-2 py-0.5 rounded transition-colors">Cancel</button>
                  </div>
                </form>
              )}

              {!collapsed[category] && chans.map(channel => (
                <ChannelItem
                  key={channel.id}
                  channel={channel}
                  isActive={channel.id === activeChannelId}
                  onClick={() => onSelectChannel(channel)}
                />
              ))}
            </div>
          ))}
        </div>

        <UserStatusBar />
      </div>
    </>
  );
}

function ChannelItem({ channel, isActive, onClick }: { channel: Channel; isActive: boolean; onClick: () => void }) {
  const isLive = channel.type === 'stream' && channel.is_live;
  return (
    <button
      onClick={onClick}
      style={{ width: 'calc(100% - 8px)' }}
      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg mx-1 text-left transition-colors group ${isActive ? 'bg-th-accent/20 text-th-text' : 'text-th-muted hover:text-th-text hover:bg-th-border/50'}`}
    >
      <span className={`flex-shrink-0 transition-colors ${isActive ? 'text-th-accent' : 'text-th-muted group-hover:text-th-text'}`}>
        {channelIcons[channel.type]}
      </span>
      <span className="text-sm truncate flex-1 font-medium">{channel.name}</span>
      {isLive && (
        <span className="text-[9px] font-bold text-white bg-th-red px-1.5 py-0.5 rounded uppercase flex-shrink-0">LIVE</span>
      )}
    </button>
  );
}

function UserStatusBar() {
  const { isDemoMode } = useDemo();
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (isDemoMode) return;
    import('../../lib/supabase').then(({ supabase }) => {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.user_metadata?.username) setUsername(data.user.user_metadata.username);
      });
    });
  }, [isDemoMode]);

  const displayName = isDemoMode ? 'Demo Trader' : (username || 'Loading…');

  return (
    <div className="h-14 border-t border-th-border flex items-center px-3 gap-2 bg-th-sidebar/80 flex-shrink-0">
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-th-accent-dim flex items-center justify-center text-sm font-semibold text-white">
          {displayName[0].toUpperCase()}
        </div>
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-th-green border-2 border-th-sidebar" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-th-text truncate">{displayName}</p>
        <p className="text-[10px] text-th-green">● Online</p>
      </div>
    </div>
  );
}
