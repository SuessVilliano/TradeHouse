import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('channels').select('*').order('category', { ascending: true }).order('created_at', { ascending: true });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ channels: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, type = 'text', category = 'TEXT CHANNELS', description } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const { data, error } = await supabase.from('channels').insert({ name, type, category, description }).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ channel: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before;
    let query = supabase.from('messages').select(`
      *,
      members!messages_user_id_fkey(username, avatar_url, role),
      reactions(emoji, user_id),
      reply_message:reply_to(id, content, members!messages_user_id_fkey(username))
    `).eq('channel_id', id).order('created_at', { ascending: false }).limit(limit);
    if (before) query = query.lt('created_at', before);
    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ messages: (data || []).reverse() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, content, replyTo, signalData } = req.body;
    if (!userId || !content) return res.status(400).json({ error: 'userId and content are required' });
    const { data, error } = await supabase.from('messages').insert({
      channel_id: id, user_id: userId, content, reply_to: replyTo || null, signal_data: signalData || null,
    }).select('*, members!messages_user_id_fkey(username, avatar_url, role)').single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ message: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/pin', async (req, res) => {
  try {
    const { messageId, isPinned } = req.body;
    if (!messageId) return res.status(400).json({ error: 'messageId required' });
    if (isPinned) await supabase.from('messages').update({ is_pinned: false }).eq('channel_id', req.params.id).eq('is_pinned', true);
    const { data, error } = await supabase.from('messages').update({ is_pinned: isPinned }).eq('id', messageId).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/messages/:id/react', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, emoji } = req.body;
    if (!userId || !emoji) return res.status(400).json({ error: 'userId and emoji required' });
    const { data: existing } = await supabase.from('reactions').select('id').eq('message_id', id).eq('user_id', userId).eq('emoji', emoji).single();
    if (existing) {
      const { error } = await supabase.from('reactions').delete().eq('id', existing.id);
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ action: 'removed' });
    } else {
      const { error } = await supabase.from('reactions').insert({ message_id: id, user_id: userId, emoji });
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ action: 'added' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
