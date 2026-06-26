import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

router.post('/profile', async (req, res) => {
  try {
    const { userId, username, avatarUrl } = req.body;
    if (!userId || !username) return res.status(400).json({ error: 'userId and username are required' });
    const { data, error } = await supabase.from('members').upsert({
      user_id: userId, username, avatar_url: avatarUrl || null, is_online: true, last_seen: new Date().toISOString(),
    }, { onConflict: 'user_id' }).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ profile: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/online', async (req, res) => {
  try {
    const { userId, isOnline } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const { error } = await supabase.from('members').update({ is_online: isOnline, last_seen: new Date().toISOString() }).eq('user_id', userId);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/members', async (req, res) => {
  try {
    const { data, error } = await supabase.from('members').select('*').order('role', { ascending: true }).order('username', { ascending: true });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ members: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
