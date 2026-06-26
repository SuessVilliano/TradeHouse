import { useState, useEffect } from 'react';
import { RoomContext, RoomAudioRenderer, VideoTrack, useRemoteParticipants, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useLiveKit } from '../../hooks/useLiveKit';
import type { Channel, AuthUser } from '../../types';
import { Loader2, AlertCircle, Radio, MonitorPlay, Eye, Copy, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { createOBSIngress } from '../../lib/livekit';
import ChatFeed from '../chat/ChatFeed';

interface LiveStreamProps {
  channel: Channel;
  user: AuthUser;
}

export default function LiveStream({ channel, user }: LiveStreamProps) {
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState<'choose' | 'broadcast' | 'watch'>('choose');
  const [ingressInfo, setIngressInfo] = useState<{ rtmpUrl: string; streamKey: string } | null>(null);
  const [copied, setCopied] = useState<'url' | 'key' | null>(null);
  const [loadingIngress, setLoadingIngress] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsername(data.user?.user_metadata?.username || user.email.split('@')[0]);
    });
  }, [user]);

  const roomName = `stream-${channel.id}`;
  const { room, error, connect, disconnect, shareScreen, isConnected, isConnecting } = useLiveKit({
    roomName,
    participantIdentity: user.id,
    participantName: username,
    canPublish: mode === 'broadcast',
  });

  const handleJoinWatch = async () => {
    setMode('watch');
    await connect();
  };

  const handleSetupBroadcast = async () => {
    setMode('broadcast');
    setLoadingIngress(true);
    try {
      const result = await createOBSIngress(roomName);
      setIngressInfo({ rtmpUrl: result.rtmpUrl, streamKey: result.streamKey });
    } catch (err) {
      console.error('Failed to create ingress:', err);
    }
    setLoadingIngress(false);
  };

  const copyToClipboard = async (text: string, type: 'url' | 'key') => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!username) return null;

  // Mode selection screen
  if (mode === 'choose') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-th-chat gap-6">
        <div className="text-6xl mb-2">🔴</div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-th-text mb-1">{channel.name}</h2>
          <p className="text-th-muted text-sm">Live trading sessions</p>
        </div>

        <div className="flex gap-4">
          {/* Watch button */}
          <button
            onClick={handleJoinWatch}
            className="flex flex-col items-center gap-3 bg-th-sidebar border border-th-border hover:border-th-accent/50 hover:bg-th-accent/10 rounded-2xl p-6 w-44 transition-all group"
          >
            <Eye size={32} className="text-th-muted group-hover:text-th-accent transition-colors" />
            <span className="text-th-text font-semibold">Watch Stream</span>
            <span className="text-th-muted text-xs text-center">Join as a viewer</span>
          </button>

          {/* Broadcast button */}
          <button
            onClick={handleSetupBroadcast}
            className="flex flex-col items-center gap-3 bg-th-sidebar border border-th-border hover:border-th-red/50 hover:bg-th-red/10 rounded-2xl p-6 w-44 transition-all group"
          >
            <Radio size={32} className="text-th-muted group-hover:text-th-red transition-colors" />
            <span className="text-th-text font-semibold">Go Live</span>
            <span className="text-th-muted text-xs text-center">Stream via OBS or browser</span>
          </button>
        </div>
      </div>
    );
  }

  // Broadcast setup screen (OBS ingress info)
  if (mode === 'broadcast' && ingressInfo) {
    return (
      <div className="flex-1 flex bg-th-chat">
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          <div className="text-5xl">📡</div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-th-text mb-1">OBS Stream Setup</h2>
            <p className="text-th-muted text-sm">Add these to OBS → Settings → Stream</p>
          </div>

          <div className="w-full max-w-md space-y-3">
            <InfoRow label="RTMP URL" value={ingressInfo.rtmpUrl} copied={copied === 'url'} onCopy={() => copyToClipboard(ingressInfo.rtmpUrl, 'url')} />
            <InfoRow label="Stream Key" value={ingressInfo.streamKey} secret onCopy={() => copyToClipboard(ingressInfo.streamKey, 'key')} copied={copied === 'key'} />
          </div>

          <div className="bg-th-border/40 rounded-xl px-4 py-3 max-w-md text-xs text-th-muted">
            <p className="font-medium text-th-text mb-1">OBS Setup Steps</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open OBS → Settings → Stream</li>
              <li>Select "Custom" service</li>
              <li>Paste the RTMP URL and Stream Key above</li>
              <li>Click "Start Streaming" in OBS</li>
            </ol>
          </div>

          <button onClick={() => setMode('choose')} className="text-th-muted hover:text-th-text text-sm transition-colors">
            ← Back
          </button>
        </div>

        {/* Chat sidebar */}
        <div className="w-80 border-l border-th-border flex flex-col">
          <div className="h-12 border-b border-th-border flex items-center px-4">
            <span className="text-sm font-semibold text-th-text">Stream Chat</span>
          </div>
          <ChatFeed channel={channel} user={user} />
        </div>
      </div>
    );
  }

  // Viewer mode
  if (!isConnected) {
    return (
      <div className="flex-1 flex items-center justify-center bg-th-chat">
        {error ? (
          <div className="flex items-center gap-2 text-th-red"><AlertCircle size={16} /><span>{error}</span></div>
        ) : (
          <div className="flex items-center gap-3 text-th-muted">
            <Loader2 size={20} className="animate-spin" /> Joining stream…
          </div>
        )}
      </div>
    );
  }

  return (
    <RoomContext.Provider value={room}>
      <RoomAudioRenderer />
      <div className="flex-1 flex bg-th-chat overflow-hidden">
        {/* Main stage */}
        <div className="flex-1 flex flex-col min-w-0">
          <StreamStage />
          <div className="border-t border-th-border px-4 py-3 flex items-center gap-3">
            <span className="text-[10px] font-bold text-white bg-th-red px-2 py-0.5 rounded uppercase">LIVE</span>
            <span className="text-sm text-th-text font-medium">{channel.name}</span>
            <button
              onClick={disconnect}
              className="ml-auto text-sm text-th-muted hover:text-th-red transition-colors"
            >
              Leave
            </button>
          </div>
        </div>

        {/* Chat sidebar */}
        <div className="w-80 border-l border-th-border flex flex-col">
          <div className="h-12 border-b border-th-border flex items-center px-4">
            <span className="text-sm font-semibold text-th-text">Stream Chat</span>
          </div>
          <ChatFeed channel={channel} user={user} />
        </div>
      </div>
    </RoomContext.Provider>
  );
}

// Inner stream stage that uses LiveKit hooks
function StreamStage() {
  const tracks = useTracks([
    { source: Track.Source.ScreenShare, withPlaceholder: false },
    { source: Track.Source.Camera, withPlaceholder: false },
  ]);

  const screenTrack = tracks.find(t => t.source === Track.Source.ScreenShare);
  const cameraTrack = tracks.find(t => t.source === Track.Source.Camera);
  const mainTrack = screenTrack || cameraTrack;

  if (!mainTrack) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black/50 gap-4">
        <MonitorPlay size={48} className="text-th-muted" />
        <p className="text-th-muted text-sm">Waiting for broadcaster…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 relative bg-black">
      <VideoTrack
        trackRef={mainTrack}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

function InfoRow({ label, value, secret, onCopy, copied }: { label: string; value: string; secret?: boolean; onCopy: () => void; copied: boolean }) {
  return (
    <div className="bg-th-input-bg border border-th-border rounded-xl p-3">
      <p className="text-[10px] font-semibold text-th-muted uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="flex-1 text-xs text-th-text font-mono truncate">
          {secret ? '•'.repeat(Math.min(value.length, 24)) : value}
        </span>
        <button
          onClick={onCopy}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
            copied ? 'text-th-green bg-th-green/10' : 'text-th-muted hover:text-th-text hover:bg-th-border'
          }`}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
