-- TradeHouse Supabase Schema
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Enable realtime for messages and reactions
-- Go to: Database → Replication → Add tables: messages, reactions, members

-- ─── Channels ────────────────────────────────────────────────────────────────────────────
create table if not exists channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('text', 'audio', 'video', 'stream')),
  category text not null,
  description text,
  topic text,
  is_live boolean default false,
  listener_count integer default 0,
  created_at timestamptz default now()
);

-- ─── Messages ───────────────────────────────────────────────────────────────────────────
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references channels(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  reply_to uuid references messages(id) on delete set null,
  is_pinned boolean default false,
  signal_data jsonb,
  created_at timestamptz default now()
);

create index if not exists messages_channel_id_idx on messages(channel_id, created_at desc);
create index if not exists messages_pinned_idx on messages(channel_id, is_pinned) where is_pinned = true;

-- ─── Reactions ───────────────────────────────────────────────────────────────────────────
create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references messages(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),
  unique(message_id, user_id, emoji)
);

-- ─── Members ────────────────────────────────────────────────────────────────────────────
create table if not exists members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  avatar_url text,
  role text default 'member' check (role in ('admin', 'moderator', 'trader', 'member')),
  is_online boolean default false,
  last_seen timestamptz default now(),
  bio text,
  created_at timestamptz default now()
);

-- ─── RLS Policies ────────────────────────────────────────────────────────────────────────
alter table channels enable row level security;
alter table messages enable row level security;
alter table reactions enable row level security;
alter table members enable row level security;

-- Channels: everyone can read
create policy "channels_read" on channels for select using (true);
create policy "channels_insert" on channels for insert with check (auth.uid() is not null);

-- Messages: everyone authenticated can read/write
create policy "messages_read" on messages for select using (auth.uid() is not null);
create policy "messages_insert" on messages for insert with check (auth.uid() = user_id);
create policy "messages_update" on messages for update using (auth.uid() = user_id);

-- Reactions: everyone authenticated
create policy "reactions_read" on reactions for select using (auth.uid() is not null);
create policy "reactions_insert" on reactions for insert with check (auth.uid() = user_id);
create policy "reactions_delete" on reactions for delete using (auth.uid() = user_id);

-- Members: everyone can read, users manage own record
create policy "members_read" on members for select using (true);
create policy "members_insert" on members for insert with check (auth.uid() = user_id);
create policy "members_update" on members for update using (auth.uid() = user_id);

-- ─── Seed Channels ───────────────────────────────────────────────────────────────────────
insert into channels (name, type, category, description) values
  ('general',       'text',   'TEXT CHANNELS', 'General trading discussion'),
  ('signals',       'text',   'TEXT CHANNELS', 'Trade signals and setups'),
  ('charts',        'text',   'TEXT CHANNELS', 'Chart analysis and screenshots'),
  ('trade-journal', 'text',   'TEXT CHANNELS', 'Log your trades'),
  ('wins-losses',   'text',   'TEXT CHANNELS', 'Share your P&L'),
  ('Trading Floor', 'audio',  'VOICE ROOMS',   'Main trading floor — always on'),
  ('Strategy Room', 'audio',  'VOICE ROOMS',   'Deep dive strategy sessions'),
  ('After Hours',   'audio',  'VOICE ROOMS',   'Wind down after market close'),
  ('Live Trading',  'stream', 'LIVE',          'Live trading sessions — watch and learn'),
  ('Chart Share',   'video',  'LIVE',          'Share your screen and charts')
on conflict do nothing;

-- ─── Enable Realtime ───────────────────────────────────────────────────────────────────────
-- Run these in the Supabase dashboard under Database → Replication
-- or uncomment if using CLI:
-- alter publication supabase_realtime add table messages;
-- alter publication supabase_realtime add table reactions;
-- alter publication supabase_realtime add table members;
