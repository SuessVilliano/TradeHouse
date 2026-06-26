import { useState, useCallback, useRef } from 'react';
import { Room, RoomEvent, ConnectionState } from '@livekit/client';
import { fetchLiveKitToken, LIVEKIT_URL } from '../lib/livekit';

export interface UseLiveKitOptions {
  roomName: string;
  participantIdentity: string;
  participantName: string;
  canPublish?: boolean;
  isHost?: boolean;
}

export function useLiveKit(options: UseLiveKitOptions) {
  const [room] = useState(() => new Room({
    adaptiveStream: true,
    dynacast: true,
    audioCaptureDefaults: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  }));

  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [isMuted, setIsMuted] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectingRef = useRef(false);

  const connect = useCallback(async () => {
    if (connectingRef.current || connectionState === ConnectionState.Connected) return;
    connectingRef.current = true;
    setError(null);

    try {
      const token = await fetchLiveKitToken({
        roomName: options.roomName,
        participantIdentity: options.participantIdentity,
        participantName: options.participantName,
        canPublish: options.canPublish ?? true,
        canSubscribe: true,
        isHost: options.isHost ?? false,
      });

      room.on(RoomEvent.ConnectionStateChanged, state => {
        setConnectionState(state);
      });

      room.on(RoomEvent.LocalTrackPublished, () => {
        setIsMuted(!room.localParticipant.isMicrophoneEnabled);
      });

      await room.connect(LIVEKIT_URL, token, {
        autoSubscribe: true,
      });

      setConnectionState(ConnectionState.Connected);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect';
      setError(msg);
      console.error('[LiveKit] Connection error:', msg);
    } finally {
      connectingRef.current = false;
    }
  }, [room, options, connectionState]);

  const disconnect = useCallback(async () => {
    await room.disconnect();
    setConnectionState(ConnectionState.Disconnected);
    setIsHandRaised(false);
  }, [room]);

  const toggleMic = useCallback(async () => {
    const enabled = room.localParticipant.isMicrophoneEnabled;
    await room.localParticipant.setMicrophoneEnabled(!enabled);
    setIsMuted(!(!enabled));
  }, [room]);

  const raiseHand = useCallback(async () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    const encoder = new TextEncoder();
    await room.localParticipant.publishData(
      encoder.encode(JSON.stringify({ type: 'raise_hand', raised: next })),
      { reliable: true }
    );
  }, [room, isHandRaised]);

  const enableCamera = useCallback(async (enabled: boolean) => {
    await room.localParticipant.setCameraEnabled(enabled);
  }, [room]);

  const shareScreen = useCallback(async (enabled: boolean) => {
    await room.localParticipant.setScreenShareEnabled(enabled);
  }, [room]);

  return {
    room,
    connectionState,
    isMuted,
    isHandRaised,
    error,
    connect,
    disconnect,
    toggleMic,
    raiseHand,
    enableCamera,
    shareScreen,
    isConnected: connectionState === ConnectionState.Connected,
    isConnecting: connectionState === ConnectionState.Connecting,
  };
}
