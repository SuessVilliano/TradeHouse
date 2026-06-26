const API_BASE = '/api';

export interface TokenRequest {
  roomName: string;
  participantIdentity: string;
  participantName?: string;
  canPublish?: boolean;
  canSubscribe?: boolean;
  isHost?: boolean;
}

export async function fetchLiveKitToken(params: TokenRequest): Promise<string> {
  const res = await fetch(`${API_BASE}/livekit/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const { token } = await res.json();
  return token;
}

export async function createLiveKitRoom(roomName: string) {
  const res = await fetch(`${API_BASE}/livekit/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomName }),
  });
  return res.json();
}

export async function listLiveKitRooms() {
  const res = await fetch(`${API_BASE}/livekit/rooms`);
  return res.json();
}

export async function createOBSIngress(roomName: string) {
  const res = await fetch(`${API_BASE}/livekit/ingress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomName }),
  });
  return res.json();
}

export const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL as string || '';
