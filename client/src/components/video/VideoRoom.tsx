import { useState, useEffect } from 'react';
import { VideoConference, RoomContext, RoomAudioRenderer } from '@livekit/components-react';
import { useLiveKit } from '../../hooks/useLiveKit';
import type { Channel, AuthUser } from '../../types';
import { Loader2, AlertCircle, Video } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface VideoRoomProps { channel: Channel; user: AuthUser; }

export default function VideoRoom({ channel, user }: VideoRoomProps) {
  const [username, setUsername] = useState('');
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUsername(data.user?.user_metadata?.username || user.email.split('@')[0]); });
  }, [user]);
  const roomName = `video-${channel.id}`;
  const { room, error, connect, isConnected, isConnecting } = useLiveKit({ roomName, participantIdentity: user.id, participantName: username, canPublish: true });
  if (!username) return null;
  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-th-chat gap-6">
        <div className="text-6xl mb-2">💻</div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-th-text mb-1">{channel.name}</h2>
          <p className="text-th-muted text-sm">Video call + screen share for chart analysis</p>
        </div>
        {error && <div className="flex items-center gap-2 text-th-red bg-th-red/10 border border-th-red/20 rounded-xl px-4 py-3 text-sm"><AlertCircle size={16} /><span>{error}</span></div>}
        <button onClick={connect} disabled={isConnecting} className="flex items-center gap-3 bg-th-accent hover:bg-th-accent-hover disabled:opacity-50 text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-th-accent/30">
          {isConnecting ? <Loader2 size={18} className="animate-spin" /> : <Video size={18} />}
          {isConnecting ? 'Joining…' : 'Join Video Room'}
        </button>
      </div>
    );
  }
  return (
    <RoomContext.Provider value={room}>
      <RoomAudioRenderer />
      <div className="flex-1 flex flex-col bg-th-chat overflow-hidden" style={{ height: '100%' }}>
        <div className="flex-1 min-h-0"><VideoConference /></div>
      </div>
    </RoomContext.Provider>
  );
}
