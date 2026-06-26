import { useState, useEffect } from 'react';
import { RoomAudioRenderer, RoomContext, useParticipants, useLocalParticipant, useRoomInfo } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { useLiveKit } from '../../hooks/useLiveKit';
import SpeakerTile from './SpeakerTile';
import AudienceGrid from './AudienceGrid';
import StageControls from './StageControls';
import type { Channel, AuthUser } from '../../types';
import { Loader2, AlertCircle, Mic2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AudioStageProps {
  channel: Channel;
  user: AuthUser;
}

export default function AudioStage({ channel, user }: AudioStageProps) {
  const [username, setUsername] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsername(data.user?.user_metadata?.username || user.email.split('@')[0]);
    });
  }, [user]);

  const roomName = `audio-${channel.id}`;
  const { room, connectionState, isMuted, isHandRaised, error, connect, disconnect, toggleMic, raiseHand, isConnected, isConnecting } = useLiveKit({
    roomName,
    participantIdentity: user.id,
    participantName: username,
    canPublish: true,
  });

  if (!username) return null;

  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-th-chat gap-6">
        <div className="text-6xl mb-2">🎙️</div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-th-text mb-1">{channel.name}</h2>
          <p className="text-th-muted text-sm">{channel.description || 'Join the conversation'}</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-th-red bg-th-red/10 border border-th-red/20 rounded-xl px-4 py-3 text-sm max-w-xs text-center">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={connect}
          disabled={isConnecting}
          className="flex items-center gap-3 bg-th-accent hover:bg-th-accent-hover disabled:opacity-50 text-white px-8 py-3 rounded-xl font-semibold text-base transition-colors shadow-lg shadow-th-accent/30"
        >
          {isConnecting ? <Loader2 size={18} className="animate-spin" /> : <Mic2 size={18} />}
          {isConnecting ? 'Joining…' : 'Join Room'}
        </button>

        <p className="text-th-muted text-xs">Your mic will be unmuted when you join</p>
      </div>
    );
  }

  return (
    <RoomContext.Provider value={room}>
      <RoomAudioRenderer />
      <div className="flex-1 flex flex-col bg-th-chat">
        {/* Room info header */}
        <div className="px-6 pt-6 pb-2">
          {channel.topic && (
            <div className="bg-th-border/40 rounded-xl px-4 py-2.5 mb-4">
              <p className="text-xs text-th-muted font-medium uppercase tracking-wider mb-0.5">Topic</p>
              <p className="text-sm text-th-text">{channel.topic}</p>
            </div>
          )}
        </div>

        {/* Stage content */}
        <div className="flex-1 overflow-y-auto px-4 th-scrollbar">
          <SpeakerGrid userId={user.id} username={username} isMuted={isMuted} isHandRaised={isHandRaised} />
          <AudienceGrid />
        </div>

        {/* Controls */}
        <StageControls
          isMuted={isMuted}
          isHandRaised={isHandRaised}
          listenerCount={room.remoteParticipants.size}
          onToggleMic={toggleMic}
          onRaiseHand={raiseHand}
          onLeave={disconnect}
        />
      </div>
    </RoomContext.Provider>
  );
}

// Inner component that uses LiveKit hooks (must be inside RoomContext)
function SpeakerGrid({ userId, username, isMuted, isHandRaised }: { userId: string; username: string; isMuted: boolean; isHandRaised: boolean }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();

  const speakers = participants.filter(p => p.isSpeaking || p.audioTrackPublications.size > 0);
  const otherSpeakers = speakers.filter(p => p.identity !== userId);

  return (
    <div className="mt-2">
      <p className="text-[10px] font-semibold text-th-muted uppercase tracking-wider mb-4">
        🎙️ On Stage ({speakers.length})
      </p>
      <div className="flex flex-wrap justify-center gap-6">
        {/* Local participant (you) */}
        <SpeakerTile
          identity={userId}
          name={username + ' (You)'}
          isSpeaking={localParticipant?.isSpeaking || false}
          isMuted={isMuted}
          isHandRaised={isHandRaised}
          size="large"
        />

        {/* Remote speakers */}
        {otherSpeakers.map(p => (
          <SpeakerTile
            key={p.identity}
            identity={p.identity}
            name={p.name || p.identity}
            isSpeaking={p.isSpeaking}
            isMuted={!p.audioTrackPublications.size}
            isHandRaised={false}
            size="large"
          />
        ))}
      </div>
    </div>
  );
}
