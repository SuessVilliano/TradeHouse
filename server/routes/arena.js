import { Router } from 'express';

const router = Router();
const HYBRID_FUNDING_ORIGIN = (process.env.HYBRID_FUNDING_ORIGIN || 'https://hybridfunding.co').replace(/\/$/, '');

async function proxyJson(path, init = {}) {
  const response = await fetch(`${HYBRID_FUNDING_ORIGIN}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }

  return { response, body };
}

router.get('/leaderboard', async (_req, res) => {
  try {
    const { response, body } = await proxyJson('/api/tradehouse/leaderboard', { cache: 'no-store' });
    if (!response.ok) return res.status(response.status).json(body || { error: 'Leaderboard unavailable' });
    res.json(body);
  } catch (error) {
    console.error('[Arena] Leaderboard proxy failed:', error);
    res.status(502).json({ error: 'Hybrid Funding battle feed is temporarily unavailable' });
  }
});

router.post('/quick-leaderboard', async (req, res) => {
  try {
    const { response, body } = await proxyJson('/api/tradehouse/quick-leaderboard', {
      method: 'POST',
      body: JSON.stringify(req.body || {}),
    });
    if (!response.ok) return res.status(response.status).json(body || { error: 'Battle calculation unavailable' });
    res.json(body);
  } catch (error) {
    console.error('[Arena] Quick leaderboard proxy failed:', error);
    res.status(502).json({ error: 'Hybrid Funding battle feed is temporarily unavailable' });
  }
});

router.get('/status', async (_req, res) => {
  res.json({
    ok: true,
    engine: 'Hybrid Funding Trade House',
    arena: 'TradeHouse standalone',
    hybridFunding: `${HYBRID_FUNDING_ORIGIN}/tradehouse`,
  });
});

export default router;
