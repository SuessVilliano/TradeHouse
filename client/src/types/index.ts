export type ChannelType = 'text' | 'audio' | 'video' | 'stream';

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  category: string;
  description?: string;
  topic?: string;
  is_live?: boolean;
  listener_count?: number;
  created_at: string;
}

export interface Member {
  user_id: string;
  username: string;
  avatar_url?: string;
  role: 'admin' | 'moderator' | 'trader' | 'member';
  is_online: boolean;
  last_seen?: string;
  bio?: string;
}

export interface Reaction {
  emoji: string;
  user_id: string;
}

export interface ReplyPreview {
  id: string;
  content: string;
  members?: { username: string };
}

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  reply_to?: string | null;
  is_pinned: boolean;
  signal_data?: SignalData | null;
  created_at: string;
  members?: { username: string; avatar_url?: string; role: string };
  reactions?: Reaction[];
  reply_message?: ReplyPreview | null;
}

export interface SignalData {
  ticker: string;
  direction: 'LONG' | 'SHORT';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  rationale?: string;
  timeframe?: string;
}

export interface AuthUser {
  id: string;
  email: string;
}
