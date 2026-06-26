import { useEffect, useState } from 'react';
import { Hash, Mic2, Video, Radio, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import type { Channel } from '../../types';

interface ChannelListProps {
  channels: Channel[];
  activeChannelId: string | null;
  onSelectChannel: (channel: Channel) => void;
}

const channelIcons: Record<string, React.ReactNode> = {
  text: <Hash size={15} />, audio: <Mic2 size={15} />, video: <Video size={15} />, stream: <Radio size={15} />,
};

const CATEGORY_EMOJIS: Record<string, string> = {
  'TEXT CHANNELS': '💬', 'VOICE ROOMS': '🎙️', 'LIVE': '🔴',
};

export default function ChannelList({ channels, activeChannelId, onSelectChannel }: ChannelListProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const grouped = channels.reduce<Record<string, Channel[]>>((acc, ch) => {
    if (!acc[ch.category]) acc[ch.category] = [];
    acc[ch.category].push(ch);
    return acc;
  }, {});
  const toggleCategory = (cat: string) => setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <div className="w-[220px] h-full bg-th-sidebar border-r border-th-border flex flex-col">
      <div className="h-12 border-b border-th-border flex items-center px-4 flex-shrink-0">
        <span className="text-th-text font-semibold text-sm flex-1">TradeHouse</span>
        <button className="text-th-muted hover:text-th-text transition-colors"><ChevronDown size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto py-2 th-scrollbar">
        {Object.entries(grouped).map(([category, chans]) => (
          <div key={category} className="mb-2">
            <button onClick={() => toggleCategory(category)} className="flex items-center gap-1 px-3 py-1 w-full text-left group">
              {collapsed[category] ? <ChevronRight size={10} className="text-th-muted" /> : <ChevronDown size={10} className="text-th-muted" />}
              <span className="text-[10px] font-semibold text-th-muted uppercase tracking-wider group-hover:text-th-text transition-colors">
                {CATEGORY_EMOJIS[category] || ''} {category}
              </span>
              <button onClick={e => e.stopPropagation()} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-th-muted hover:text-th-text">
                <Plus size={13} />
              </button>
            </button>
            {!collapsed[category] && chans.map(channel => (
              <ChannelItem key={channel.id} channel={channel} isActive={channel.id === activeChannelId} onClick={() => onSelectChannel(channel)} />
            ))}
          </div>
        ))}
      </div>
      <UserStatusBar />
    </div>
  );
}

function ChannelItem({ channel, isActive, onClick }: { channel: Channel; isActive: boolean; onClick: () => void }) {
  const isLive = channel.type === 'stream' && channel.is_live;
  return (
    <button onClick={onClick} style={{ width: 'calc(100% - 8px)' }}
      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg mx-1 text-left transition-colors group ${isActive ? 'bg-th-accent/20 text-th-text' : 'text-th-muted hover:text-th-text hover:bg-th-border/50'}`}>
      <span className={`flex-shrink-0 transition-colors ${isActive ? 'text-th-accent' : 'text-th-muted group-hover:text-th-text'}`}>{channelIcons[channel.type]}</span>
      <span className="text-sm truncate flex-1 font-medium">{channel.name}</span>
      {isLive && <span className="text-[9px] font-bold text-white bg-th-red px-1.5 py-0.5 rounded uppercase flex-shrink-0">LIVE</span>}
    </button>
  );
}

function UserStatusBar() {
  const [username, setUsername] = useState('');
  useEffect(() => {
    import('../../lib/supabase').then(({ supabase }) => {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.user_metadata?.username) setUsername(data.user.user_metadata.username);
      });
    });
  }, []);
  return (
    <div className="h-14 border-t border-th-border flex items-center px-3 gap-2 bg-th-sidebar/80 flex-shrink-0">
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-th-accent-dim flex items-center justify-center text-sm font-semibold text-white">
          {username ? username[0].toUpperCase() : '?'}
        </div>
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-th-green border-2 border-th-sidebar" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-th-text truncate">{username || 'Loading…'}</p>
        <p className="text-[10px] text-th-green">● Online</p>
      </div>
    </div>
  );
}
