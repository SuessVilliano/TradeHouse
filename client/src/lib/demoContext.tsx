import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AuthUser, Channel } from '../types';

export const DEMO_USER: AuthUser = {
  id: 'demo-user',
  email: 'demo@tradehouse.app',
};

const _now = new Date().toISOString();

export const DEMO_CHANNELS: Channel[] = [
  { id: 'demo-general',    name: 'general',       type: 'text',   category: 'TEXT CHANNELS', description: 'General trading talk', created_at: _now },
  { id: 'demo-signals',    name: 'signals',        type: 'text',   category: 'TEXT CHANNELS', description: 'Trade signals',        created_at: _now },
  { id: 'demo-charts',     name: 'charts',         type: 'text',   category: 'TEXT CHANNELS', description: 'Chart analysis',       created_at: _now },
  { id: 'demo-degen-talk', name: 'degen-talk',     type: 'text',   category: 'TEXT CHANNELS', description: 'High risk plays',      created_at: _now },
  { id: 'demo-audio-1',   name: 'Trading Floor',  type: 'audio',  category: 'VOICE ROOMS',   description: 'Live audio room',      created_at: _now },
  { id: 'demo-live-1',    name: 'Live Stream',    type: 'stream', category: 'LIVE',          description: 'Live trading stream',  is_live: true, created_at: _now },
];

interface DemoContextType {
  isDemoMode: boolean;
  demoUser: AuthUser;
  demoChannels: Channel[];
  enterDemo: () => void;
  exitDemo: () => void;
  addDemoChannel: (name: string) => void;
}

const DemoContext = createContext<DemoContextType>({
  isDemoMode: false,
  demoUser: DEMO_USER,
  demoChannels: DEMO_CHANNELS,
  enterDemo: () => {},
  exitDemo: () => {},
  addDemoChannel: () => {},
});

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoChannels, setDemoChannels] = useState<Channel[]>(DEMO_CHANNELS);

  const enterDemo = () => setIsDemoMode(true);
  const exitDemo = () => {
    setIsDemoMode(false);
    setDemoChannels(DEMO_CHANNELS); // reset channels on exit
  };

  const addDemoChannel = (name: string) => {
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
    const newChannel: Channel = {
      id: `demo-custom-${Date.now()}`,
      name: slug,
      type: 'text',
      category: 'TEXT CHANNELS',
      description: '',
      created_at: new Date().toISOString(),
    };
    setDemoChannels(prev => [...prev, newChannel]);
  };

  return (
    <DemoContext.Provider value={{ isDemoMode, demoUser: DEMO_USER, demoChannels, enterDemo, exitDemo, addDemoChannel }}>
      {children}
    </DemoContext.Provider>
  );
}

export const useDemo = () => useContext(DemoContext);
