import { TrendingUp, Hash, Mic2, Video, Radio, Settings, LogOut, Bell, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useDemo } from '../../lib/demoContext';

interface SidebarProps { onNavigate?: () => void; }

export default function Sidebar({ onNavigate }: SidebarProps) {
  const { isDemoMode, exitDemo } = useDemo();

  const handleLogout = async () => {
    if (isDemoMode) {
      exitDemo();
    } else {
      await supabase.auth.signOut();
    }
  };

  return (
    <div className="w-[72px] h-full bg-th-sidebar flex flex-col items-center py-3 gap-2 border-r border-th-border">
      <button onClick={onNavigate} className="w-12 h-12 rounded-2xl bg-th-accent hover:rounded-xl flex items-center justify-center shadow-lg shadow-th-accent/30 transition-all duration-200" title="TradeHouse">
        <TrendingUp size={22} className="text-white" />
      </button>
      <div className="w-8 border-t border-th-border my-1" />
      {isDemoMode && (
        <div className="w-12 flex items-center justify-center" title="Demo Mode">
          <div className="flex items-center gap-1 bg-th-accent/20 border border-th-accent/40 rounded-lg px-1.5 py-0.5">
            <Zap size={9} className="text-th-accent" />
            <span className="text-[9px] font-bold text-th-accent uppercase tracking-wide">Demo</span>
          </div>
        </div>
      )}
      <NavIcon icon={<Hash size={20} />} label="Channels" active />
      <NavIcon icon={<Mic2 size={20} />} label="Voice" />
      <NavIcon icon={<Video size={20} />} label="Video" />
      <NavIcon icon={<Radio size={20} />} label="Live" />
      <NavIcon icon={<Bell size={20} />} label="Notifications" />
      <div className="flex-1" />
      <NavIcon icon={<Settings size={20} />} label="Settings" />
      <button onClick={handleLogout} className="w-10 h-10 rounded-xl flex items-center justify-center text-th-muted hover:text-th-red hover:bg-th-red/10 transition-colors" title={isDemoMode ? 'Exit demo' : 'Sign out'}>
        <LogOut size={20} />
      </button>
    </div>
  );
}

function NavIcon({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 ${active ? 'bg-th-accent text-white shadow-md shadow-th-accent/30' : 'text-th-muted hover:text-th-text hover:bg-th-border'}`} title={label}>
      {icon}
    </button>
  );
}
