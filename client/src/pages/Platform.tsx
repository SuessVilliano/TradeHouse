import { useEffect, useState } from 'react';
import type { AuthUser, Channel } from '../types';
import Sidebar from '../components/layout/Sidebar';
import ChannelList from '../components/layout/ChannelList';
import MembersPanel from '../components/layout/MembersPanel';
import ChatFeed from '../components/chat/ChatFeed';
import AudioStage from '../components/audio/AudioStage';
import VideoRoom from '../components/video/VideoRoom';
import LiveStream from '../components/video/LiveStream';
import { Hash, Mic2, Video, Radio, Menu } from 'lucide-react';
import { useDemo } from '../lib/demoContext';

interface PlatformProps { user: AuthUser; }

export default function Platform({ user }: PlatformProps) {
  const { isDemoMode, demoChannels } = useDemo();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Demo mode: use demo channels directly, skip API
  useEffect(() => {
    if (!isDemoMode) return;
    setChannels(demoChannels);
    setActiveChannel(prev => prev ?? (demoChannels.find(c => c.type === 'text') || null));
    setLoading(false);
  }, [isDemoMode, demoChannels]);

  // Real mode: fetch from API
  useEffect(() => {
    if (isDemoMode) return;
    setLoading(true);
    fetch('/api/channels')
      .then(r => r.json())
      .then(({ channels }) => {
        setChannels(channels || []);
        const firstText = (channels || []).find((c: Channel) => c.type === 'text');
        if (firstText) setActiveChannel(firstText);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isDemoMode]);

  useEffect(() => {
    fetch('/api/auth/online', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, isOnline: true }),
    });
    const handleUnload = () => {
      navigator.sendBeacon('/api/auth/online', JSON.stringify({ userId: user.id, isOnline: false }));
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      fetch('/api/auth/online', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, isOnline: false }),
      });
    };
  }, [user.id]);

  const displayChannels = isDemoMode ? demoChannels : channels;

  return (
    <div className="h-screen flex overflow-hidden bg-th-bg">
      {/* Icon rail — hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Channel list — drawer on mobile, static on desktop */}
      <ChannelList
        channels={displayChannels}
        activeChannelId={activeChannel?.id || null}
        onSelectChannel={(ch) => { setActiveChannel(ch); setSidebarOpen(false); }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content — full width on mobile */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {loading ? <LoadingState /> : activeChannel ? (
          <>
            <ChannelHeader channel={activeChannel} onMenuClick={() => setSidebarOpen(o => !o)} />
            <MainContent channel={activeChannel} user={user} />
          </>
        ) : <EmptyState onMenuClick={() => setSidebarOpen(o => !o)} />}
      </div>

      {/* Members panel — hidden on mobile */}
      {activeChannel?.type === 'text' && (
        <div className="hidden md:block">
          <MembersPanel />
        </div>
      )}
    </div>
  );
}

function ChannelHeader({ channel, onMenuClick }: { channel: Channel; onMenuClick?: () => void }) {
  const icons = { text: <Hash size={18} />, audio: <Mic2 size={18} />, video: <Video size={18} />, stream: <Radio size={18} /> };
  return (
    <div className="h-12 border-b border-th-border flex items-center px-4 gap-3 flex-shrink-0 bg-th-chat">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="md:hidden text-th-muted hover:text-th-text transition-colors flex-shrink-0"
        aria-label="Open channels"
      >
        <Menu size={20} />
      </button>
      <span className="text-th-muted flex-shrink-0">{icons[channel.type]}</span>
      <span className="font-semibold text-th-text text-sm">{channel.name}</span>
      {channel.description && (
        <>
          <div className="w-px h-4 bg-th-border flex-shrink-0" />
          <span className="text-th-muted text-xs truncate">{channel.description}</span>
        </>
      )}
      {channel.is_live && (
        <span className="ml-auto text-[10px] font-bold text-white bg-th-red px-2 py-0.5 rounded uppercase animate-pulse">
          🔴 LIVE
        </span>
      )}
    </div>
  );
}

function MainContent({ channel, user }: { channel: Channel; user: AuthUser }) {
  switch (channel.type) {
    case 'text':   return <ChatFeed channel={channel} user={user} />;
    case 'audio':  return <AudioStage channel={channel} user={user} />;
    case 'video':  return <VideoRoom channel={channel} user={user} />;
    case 'stream': return <LiveStream channel={channel} user={user} />;
    default:       return <ChatFeed channel={channel} user={user} />;
  }
}

function LoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-th-chat">
      <div className="text-th-muted text-sm">Loading channels…</div>
    </div>
  );
}

function EmptyState({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-th-chat">
      {/* Mobile header with hamburger even on empty state */}
      <div className="h-12 border-b border-th-border flex items-center px-4 md:hidden">
        <button onClick={onMenuClick} className="text-th-muted hover:text-th-text transition-colors" aria-label="Open channels">
          <Menu size={20} />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📡</div>
          <p className="text-th-text font-semibold mb-1">Select a channel</p>
          <p className="text-th-muted text-sm">Choose a channel from the sidebar to start</p>
        </div>
      </div>
    </div>
  );
}
