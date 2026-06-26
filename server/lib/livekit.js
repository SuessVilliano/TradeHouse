import { AccessToken, RoomServiceClient, IngressClient, IngressInput, TrackSource } from 'livekit-server-sdk';

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const livekitUrl = process.env.LIVEKIT_URL;
const httpUrl = livekitUrl ? livekitUrl.replace(/^wss?:\/\//, 'https://') : '';

export function getRoomService() {
  if (!apiKey || !apiSecret || !httpUrl) throw new Error('LiveKit credentials not configured.');
  return new RoomServiceClient(httpUrl, apiKey, apiSecret);
}

export function getIngressClient() {
  if (!apiKey || !apiSecret || !httpUrl) throw new Error('LiveKit credentials not configured.');
  return new IngressClient(httpUrl, apiKey, apiSecret);
}

export async function generateToken({ roomName, participantIdentity, participantName, canPublish = true, canSubscribe = true, isHost = false }) {
  if (!apiKey || !apiSecret) throw new Error('LiveKit credentials not configured.');
  const at = new AccessToken(apiKey, apiSecret, { identity: participantIdentity, name: participantName, ttl: '4h' });
  at.addGrant({ roomJoin: true, room: roomName, canPublish, canSubscribe, canPublishData: true, roomAdmin: isHost });
  return await at.toJwt();
}

export async function createRoom({ roomName, emptyTimeout = 600, maxParticipants = 200 }) {
  const svc = getRoomService();
  try {
    return await svc.createRoom({ name: roomName, emptyTimeout, maxParticipants });
  } catch (err) {
    const rooms = await svc.listRooms([roomName]);
    if (rooms.length > 0) return rooms[0];
    throw err;
  }
}

export async function listRooms() { return await getRoomService().listRooms(); }

export async function createIngress({ roomName, participantName = 'OBS Stream' }) {
  const client = getIngressClient();
  return await client.createIngress(IngressInput.RTMP_INPUT, {
    name: `${roomName}-ingress`,
    roomName,
    participantIdentity: 'obs-broadcaster',
    participantName,
    video: { source: TrackSource.SCREEN_SHARE },
    audio: { source: TrackSource.MICROPHONE },
  });
}

export { IngressInput, TrackSource };
