import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useDemo } from '../lib/demoContext';
import type { Message, Channel, AuthUser, SignalData, Member, Reaction } from '../types';

async function hydrateMessages(channelId: string): Promise<Message[]> {
  const { data: rawMessages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  const rows = [...(rawMessages || [])].reverse();
  if (!rows.length) return [];

  const messageIds = rows.map((row: any) => row.id);
  const replyIds = rows.map((row: any) => row.reply_to).filter(Boolean);

  const [reactionResult, replyResult] = await Promise.all([
    supabase
      .from('reactions')
      .select('message_id, emoji, user_id')
      .in('message_id', messageIds),
    replyIds.length
      ? supabase.from('messages').select('id, content, user_id').in('id', replyIds)
      : Promise.resolve({ data: [], error: null } as any),
  ]);

  const replies = replyResult.data || [];
  const userIds = Array.from(new Set([
    ...rows.map((row: any) => row.user_id),
    ...replies.map((row: any) => row.user_id),
  ].filter(Boolean)));

  const memberResult = userIds.length
    ? await supabase
        .from('members')
        .select('user_id, username, avatar_url, role')
        .in('user_id', userIds)
    : { data: [], error: null };

  const membersById = new Map<string, Partial<Member>>(
    (memberResult.data || []).map((member: any) => [member.user_id, member]),
  );

  const reactionsByMessage = new Map<string, Reaction[]>();
  for (const reaction of reactionResult.data || []) {
    const list = reactionsByMessage.get(reaction.message_id) || [];
    list.push({ emoji: reaction.emoji, user_id: reaction.user_id });
    reactionsByMessage.set(reaction.message_id, list);
  }

  const repliesById = new Map<string, any>(
    replies.map((reply: any) => [reply.id, reply]),
  );

  return rows.map((row: any) => {
    const member = membersById.get(row.user_id);
    const reply = row.reply_to ? repliesById.get(row.reply_to) : null;
    const replyMember = reply ? membersById.get(reply.user_id) : null;

    return {
      ...row,
      members: member
        ? {
            username: member.username || 'Trader',
            avatar_url: member.avatar_url,
            role: member.role || 'member',
          }
        : undefined,
      reactions: reactionsByMessage.get(row.id) || [],
      reply_message: reply
        ? {
            id: reply.id,
            content: reply.content,
            members: replyMember ? { username: replyMember.username || 'Trader' } : undefined,
          }
        : null,
    } as Message;
  });
}

export function useChat(channel: Channel, user: AuthUser) {
  const { isDemoMode } = useDemo();
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const realtimeChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (import.meta.env.DEV && isDemoMode) return;

    setLoading(true);
    try {
      const next = await hydrateMessages(channel.id);
      setMessages(next);
      setPinnedMessage(next.find((message) => message.is_pinned) || null);
    } catch (error) {
      console.error('[TradeHouse chat] Failed to load messages', error);
    } finally {
      setLoading(false);
    }
  }, [channel.id, isDemoMode]);

  useEffect(() => {
    if (import.meta.env.DEV && isDemoMode) {
      setMessages([]);
      setLoading(false);
      return;
    }

    void fetchMessages();

    const rt = supabase
      .channel('chat:' + channel.id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: 'channel_id=eq.' + channel.id,
      }, () => {
        void fetchMessages();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reactions',
      }, () => {
        void fetchMessages();
      })
      .subscribe();

    realtimeChannel.current = rt;
    return () => {
      supabase.removeChannel(rt);
    };
  }, [channel.id, fetchMessages, isDemoMode]);

  const sendMessage = useCallback(async (
    content: string,
    replyTo?: string,
    signalData?: SignalData,
  ) => {
    if (!content.trim() || sending) return;

    if (import.meta.env.DEV && isDemoMode) {
      const demoMsg: Message = {
        id: 'demo-' + Date.now(),
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
      setMessages((prev) => [...prev, demoMsg]);
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        channel_id: channel.id,
        user_id: user.id,
        content: content.trim(),
        reply_to: replyTo || null,
        signal_data: signalData || null,
      });

      if (error) throw error;
      await fetchMessages();
    } catch (error) {
      console.error('[TradeHouse chat] Failed to send message', error);
    } finally {
      setSending(false);
    }
  }, [channel.id, user.id, sending, isDemoMode, fetchMessages]);

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (import.meta.env.DEV && isDemoMode) return;

    const { data: existing } = await supabase
      .from('reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji)
      .maybeSingle();

    if (existing?.id) {
      await supabase.from('reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('reactions').insert({
        message_id: messageId,
        user_id: user.id,
        emoji,
      });
    }

    await fetchMessages();
  }, [user.id, isDemoMode, fetchMessages]);

  const pinMessage = useCallback(async (messageId: string, isPinned: boolean) => {
    if (import.meta.env.DEV && isDemoMode) return;

    if (isPinned) {
      await supabase
        .from('messages')
        .update({ is_pinned: false })
        .eq('channel_id', channel.id)
        .eq('user_id', user.id)
        .eq('is_pinned', true);
    }

    const { error } = await supabase
      .from('messages')
      .update({ is_pinned: isPinned })
      .eq('id', messageId);

    if (error) {
      console.error('[TradeHouse chat] Could not pin message', error);
    }

    await fetchMessages();
  }, [channel.id, user.id, isDemoMode, fetchMessages]);

  return {
    messages,
    pinnedMessage,
    loading,
    sending,
    sendMessage,
    addReaction,
    pinMessage,
  };
}
