import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AuthUser } from '../types';

export const DEMO_USER: AuthUser = {
  id: 'demo-user',
  email: 'demo@tradehouse.app',
};

interface DemoContextType {
  isDemoMode: boolean;
  demoUser: AuthUser;
  enterDemo: () => void;
  exitDemo: () => void;
}

const DemoContext = createContext<DemoContextType>({
  isDemoMode: false,
  demoUser: DEMO_USER,
  enterDemo: () => {},
  exitDemo: () => {},
});

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);

  const enterDemo = () => setIsDemoMode(true);
  const exitDemo = () => setIsDemoMode(false);

  return (
    <DemoContext.Provider value={{ isDemoMode, demoUser: DEMO_USER, enterDemo, exitDemo }}>
      {children}
    </DemoContext.Provider>
  );
}

export const useDemo = () => useContext(DemoContext);
