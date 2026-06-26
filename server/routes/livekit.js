import { Router } from 'express';
import { generateToken, createRoom, listRooms, createIngress } from '../lib/livekit.js';

const router = Router();

router.post('/token', async (req, res) => {
  try {
    const { roomName, participantIdentity, participantName, canPublish = true, canSubscribe = true, isHost = false } = req.body;
    if (!roomName || !participantIdentity) return res.status(400).json({ error: 'roomName and participantIdentity are required' });
    const token = await generateToken({ roomName, participantIdentity, participantName: participantName || participantIdentity, canPublish, canSubscribe, isHost });
    res.json({ token, roomName });
  } catch (err) { console.error('[LiveKit] Token error:', err.message); res.status(500).json({ error: err.message }); }
});

router.post('/room', async (req, res) => {
  try {
    const { roomName, emptyTimeout = 600, maxParticipants = 200 } = req.body;
    if (!roomName) return res.status(400).json({ error: 'roomName is required' });
    const room = await createRoom({ roomName, emptyTimeout, maxParticipants });
    res.json({ room });
  } catch (err) { console.error('[LiveKit] Create room error:', err.message); res.status(500).json({ error: err.message }); }
});

router.get('/rooms', async (req, res) => {
  try {
    const rooms = await listRooms();
    res.json({ rooms });
  } catch (err) { console.error('[LiveKit] List rooms error:', err.message); res.status(500).json({ error: err.message }); }
});

router.post('/ingress', async (req, res) => {
  try {
    const { roomName, participantName = 'OBS Stream' } = req.body;
    if (!roomName) return res.status(400).json({ error: 'roomName is required' });
    const ingress = await createIngress({ roomName, participantName });
    res.json({ ingress, rtmpUrl: ingress.url, streamKey: ingress.streamKey });
  } catch (err) { console.error('[LiveKit] Ingress error:', err.message); res.status(500).json({ error: err.message }); }
});

export default router;
