import { useEffect, useState } from 'react';
import type { AuthUser, Channel } from '../types';
import Sidebar from '../components/layout/Sidebar';
import ChannelList from '../components/layout/ChannelList';
import MembersPanel from '../components/layout/MembersPanel';
import ChatFeed from '../components/chat/ChatFeed';
import AudioStage from '../components/audio/AudioStage';
import VideoRoom from '../components/video/VideoRoom';
import LiveStream from '../components/video/LiveStream';
import { Hash, Mic2, Video, Radio } from 'lucide-react';

interface PlatformProps { user: AuthUser; }

export default function Platform({ user }: PlatformProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/channels')
      .then(r => r.json())
      .then(({ channels }) => {
        setChannels(channels || []);
        const firstText = (channels || []).find((c: Channel) => c.type === 'text');
        if (firstText) setActiveChannel(firstText);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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

  return (
    <div className="h-screen flex overflow-hidden bg-th-bg">
      <Sidebar />
      <ChannelList channels={channels} activeChannelId={activeChannel?.id || null} onSelectChannel={setActiveChannel} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {loading ? <LoadingState /> : activeChannel ? (
          <>
            <ChannelHeader channel={activeChannel} />
            <MainContent channel={activeChannel} user={user} />
          </>
        ) : <EmptyState />}
      </div>
      {activeChannel?.type === 'text' && <MembersPanel />}
    </div>
  );
}

function ChannelHeader({ channel }: { channel: Channel }) {
  const icons = { text: <Hash size={18} />, audio: <Mic2 size={18} />, video: <Video size={18} />, stream: <Radio size={18} /> };
  return (
    <div className="h-12 border-b border-th-border flex items-center px-4 gap-3 flex-shrink-0 bg-th-chat">
      <span className="text-th-muted">{icons[channel.type]}</span>
      <span className="font-semibold text-th-text text-sm">{channel.name}</span>
      {channel.description && (<><div className="w-px h-4 bg-th-border" /><span className="text-th-muted text-xs truncate">{channel.description}</span></>)}
      {channel.is_live && (<span className="ml-auto text-[10px] font-bold text-white bg-th-red px-2 py-0.5 rounded uppercase animate-pulse">🔴 LIVE</span>)}
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
  return <div className="flex-1 flex items-center justify-center bg-th-chat"><div className="text-th-muted text-sm">Loading channels…</div></div>;
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-th-chat">
      <div className="text-center">
        <div className="text-4xl mb-4">📡</div>
        <p className="text-th-text font-semibold mb-1">Select a channel</p>
        <p className="text-th-muted text-sm">Choose a channel from the sidebar to start</p>
      </div>
    </div>
  );
}
