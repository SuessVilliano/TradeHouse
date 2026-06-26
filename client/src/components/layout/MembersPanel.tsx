import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Member } from '../../types';

const ROLE_ORDER = { admin: 0, moderator: 1, trader: 2, member: 3 };
const ROLE_LABELS: Record<string, string> = {
  admin: '👑 Admin', moderator: '🛡️ Moderator', trader: '📈 Trader', member: '👤 Member',
};

export default function MembersPanel() {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      const res = await fetch('/api/auth/members');
      if (res.ok) { const { members } = await res.json(); setMembers(members || []); }
    };
    fetchMembers();
    const channel = supabase.channel('members-online')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, payload => {
        if (payload.eventType === 'UPDATE') setMembers(prev => prev.map(m => m.user_id === (payload.new as Member).user_id ? { ...m, ...(payload.new as Member) } : m));
        else if (payload.eventType === 'INSERT') setMembers(prev => [...prev, payload.new as Member]);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const online  = members.filter(m => m.is_online);
  const offline = members.filter(m => !m.is_online);
  const onlineGroups = online.reduce<Record<string, Member[]>>((acc, m) => {
    if (!acc[m.role]) acc[m.role] = []; acc[m.role].push(m); return acc;
  }, {});

  return (
    <div className="w-[240px] h-full bg-th-member-panel border-l border-th-border flex flex-col">
      <div className="h-12 border-b border-th-border flex items-center px-4 flex-shrink-0">
        <span className="text-xs font-semibold text-th-muted uppercase tracking-wider">Members</span>
        <span className="ml-auto text-xs text-th-green font-medium">● {online.length} online</span>
      </div>
      <div className="flex-1 overflow-y-auto py-3 th-scrollbar">
        {Object.keys(ROLE_ORDER).map(role => {
          const group = onlineGroups[role];
          if (!group?.length) return null;
          return (
            <div key={role} className="mb-4">
              <p className="text-[10px] font-semibold text-th-muted uppercase tracking-wider px-4 mb-1">{ROLE_LABELS[role]} — {group.length}</p>
              {group.map(member => <MemberRow key={member.user_id} member={member} online />)}
            </div>
          );
        })}
        {offline.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-th-muted uppercase tracking-wider px-4 mb-1">Offline — {offline.length}</p>
            {offline.slice(0, 20).map(member => <MemberRow key={member.user_id} member={member} online={false} />)}
          </div>
        )}
        {members.length === 0 && <div className="flex items-center justify-center h-20 text-th-muted text-xs">No members yet</div>}
      </div>
    </div>
  );
}

function MemberRow({ member, online }: { member: Member; online: boolean }) {
  return (
    <button className="w-full flex items-center gap-2 px-4 py-1.5 hover:bg-th-border/30 transition-colors group">
      <div className="relative flex-shrink-0">
        {member.avatar_url ? (
          <img src={member.avatar_url} alt={member.username} className={`w-7 h-7 rounded-full object-cover ${online ? '' : 'opacity-40'}`} />
        ) : (
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white ${online ? 'bg-th-accent' : 'bg-th-border opacity-60'}`}>
            {member.username[0].toUpperCase()}
          </div>
        )}
        <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-th-member-panel ${online ? 'bg-th-green' : 'bg-th-muted'}`} />
      </div>
      <span className={`text-xs font-medium truncate transition-colors ${online ? 'text-th-text group-hover:text-white' : 'text-th-muted'}`}>{member.username}</span>
    </button>
  );
}
