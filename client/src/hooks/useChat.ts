import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useDemo } from '../lib/demoContext';
import type { Message, Channel, AuthUser, SignalData } from '../types';

export function useChat(channel: Channel, user: AuthUser) {
  const { isDemoMode } = useDemo();
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const realtimeChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (isDemoMode) return;
    setLoading(true);
    const res = await fetch(`/api/channels/${channel.id}/messages?limit=50`);
    if (res.ok) {
      const { messages: msgs } = await res.json();
      setMessages(msgs || []);
      const pinned = (msgs || []).find((m: Message) => m.is_pinned);
      setPinnedMessage(pinned || null);
    }
    setLoading(false);
  }, [channel.id, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      setMessages([]);
      setLoading(false);
      return;
    }

    fetchMessages();

    const rt = supabase
      .channel(`chat:${channel.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channel.id}`,
      }, async (payload) => {
        const res = await fetch(`/api/channels/${channel.id}/messages?limit=1`);
        if (res.ok) {
          const { messages: newMsgs } = await res.json();
          if (newMsgs?.length) {
            const newMsg = newMsgs[newMsgs.length - 1];
            if (newMsg.id === payload.new.id) {
              setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
            }
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channel.id}`,
      }, (payload) => {
        const updated = payload.new as Message;
        setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
        if (updated.is_pinned) setPinnedMessage({ ...updated } as Message);
        else setPinnedMessage(prev => prev?.id === updated.id ? null : prev);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reactions',
      }, () => {
        fetchMessages();
      })
      .subscribe();

    realtimeChannel.current = rt;
    return () => { supabase.removeChannel(rt); };
  }, [channel.id, fetchMessages, isDemoMode]);

  const sendMessage = useCallback(async (content: string, replyTo?: string, signalData?: SignalData) => {
    if (!content.trim() || sending) return;

    if (isDemoMode) {
      const demoMsg: Message = {
        id: `demo-${Date.now()}`,
        channel_id: channel.id,
        user_id: 'demo-user',
        content,
        reply_to: replyTo || null,
        is_pinned: false,
        signal_data: signalData || null,
        created_at: new Date().toISOString(),
        members: { username: 'DemoTrader', avatar_url: undefined, role: 'member' },
        reactions: [],
      };
      setMessages(prev => [...prev, demoMsg]);
      return;
    }

    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const username = authUser?.user_metadata?.username || user.email.split('@')[0];

    const optimistic: Message = {
      id: tempId,
      channel_id: channel.id,
      user_id: user.id,
      content,
      reply_to: replyTo || null,
      is_pinned: false,
      signal_data: signalData || null,
      created_at: new Date().toISOString(),
      members: { username, avatar_url: undefined, role: 'member' },
      reactions: [],
    };

    setMessages(prev => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/channels/${channel.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, content, replyTo, signalData }),
      });

      if (res.ok) {
        const { message } = await res.json();
        setMessages(prev => prev.map(m => m.id === tempId ? message : m));
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }

    setSending(false);
  }, [channel.id, user.id, user.email, sending, isDemoMode]);

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (isDemoMode) return;
    await fetch(`/api/channels/messages/${messageId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, emoji }),
    });
  }, [user.id, isDemoMode]);

  const pinMessage = useCallback(async (messageId: string, isPinned: boolean) => {
    if (isDemoMode) return;
    await fetch(`/api/channels/${channel.id}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, isPinned }),
    });
    fetchMessages();
  }, [channel.id, fetchMessages, isDemoMode]);

  return { messages, pinnedMessage, loading, sending, sendMessage, addReaction, pinMessage };
}
