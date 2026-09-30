import { Router } from 'express';
import { Readable } from 'node:stream';

const router = Router();
const CLUB_API = process.env.TRADE_HYBRID_CLUB_API || 'https://pro.tradehybrid.co';

router.post('/chat', async (req, res) => {
  const authorization = String(req.headers.authorization || '');

  if (!authorization.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'Trade Hybrid Club authentication required.' });
  }

  try {
    const upstream = await fetch(CLUB_API.replace(/\/$/, '') + '/api/ai/chat-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
      body: JSON.stringify(req.body || {}),
    });

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => '');
      return res.status(upstream.status || 502).json({
        error: detail || 'Market Buddy is temporarily unavailable.',
      });
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    Readable.fromWeb(upstream.body).pipe(res);
  } catch (error) {
    console.error('[TradeHouse Market Buddy] proxy failed', error);
    return res.status(502).json({ error: 'Market Buddy is temporarily unavailable.' });
  }
});

export default router;
