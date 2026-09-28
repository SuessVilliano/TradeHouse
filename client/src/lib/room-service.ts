import type { BattleRuleConfig } from './battle-rules';

const ROOM_API =
  import.meta.env.VITE_TRADEHOUSE_ROOM_API ||
  'https://uqtluroceakqtlvlzatt.supabase.co/functions/v1/tradehouse-rooms';

export type PersistedBattleRoom = {
  room_id: string;
  host_user_ref?: string | null;
  host_name: string;
  host_dashboard_url?: string | null;
  mode: '1v1' | '2v2' | '3v3';
  rule: BattleRuleConfig;
  roster: Array<{
    id: string;
    name: string;
    dashboardUrl: string;
    division?: string;
    platform?: string;
  }>;
  participant_count: number;
  status: 'active' | 'closed' | 'expired';
  created_at: string;
  updated_at: string;
  expires_at: string;
};

async function parse(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error || 'Trade House room service failed.');
  }
  return body;
}

export async function getPersistedBattleRoom(roomId: string): Promise<PersistedBattleRoom> {
  const response = await fetch(
    ROOM_API + '?roomId=' + encodeURIComponent(roomId.trim().toUpperCase()),
    { cache: 'no-store' },
  );
  const body = await parse(response);
  return body.room;
}

export async function createPersistedBattleRoom(input: {
  roomId: string;
  hostUserRef: string;
  hostName: string;
  hostDashboardUrl?: string;
  mode: '1v1' | '2v2' | '3v3';
  rule: BattleRuleConfig;
}) {
  const response = await fetch(ROOM_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create',
      roomId: input.roomId.trim().toUpperCase(),
      hostUserRef: input.hostUserRef,
      hostName: input.hostName,
      hostDashboardUrl: input.hostDashboardUrl || '',
      mode: input.mode,
      rule: input.rule,
    }),
  });

  const body = await parse(response);
  return body as { room: PersistedBattleRoom; hostToken: string };
}

export async function joinPersistedBattleRoom(input: {
  roomId: string;
  participant: {
    id: string;
    name: string;
    dashboardUrl?: string;
  };
}) {
  const response = await fetch(ROOM_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'join',
      roomId: input.roomId.trim().toUpperCase(),
      participant: {
        id: input.participant.id,
        name: input.participant.name,
        dashboardUrl: input.participant.dashboardUrl || '',
      },
    }),
  });

  const body = await parse(response);
  return body.room as PersistedBattleRoom;
}

export async function updatePersistedBattleRoom(
  roomId: string,
  hostToken: string,
  patch: Partial<Pick<PersistedBattleRoom, 'mode' | 'rule' | 'status'>>,
) {
  const response = await fetch(ROOM_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'update',
      roomId: roomId.trim().toUpperCase(),
      hostToken,
      ...patch,
    }),
  });

  const body = await parse(response);
  return body.room as PersistedBattleRoom;
}

export async function closePersistedBattleRoom(roomId: string, hostToken: string) {
  const response = await fetch(ROOM_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'close',
      roomId: roomId.trim().toUpperCase(),
      hostToken,
    }),
  });

  const body = await parse(response);
  return body.room as PersistedBattleRoom;
}
