import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useDemo } from './lib/demoContext';
import type { AuthUser } from './types';
import Login from './pages/Login';
import Register from './pages/Register';
import Platform from './pages/Platform';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDemoMode, demoUser } = useDemo();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const effectiveUser = isDemoMode ? demoUser : user;

  if (loading && !isDemoMode) {
    return (
      <div className="h-screen flex items-center justify-center bg-th-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-th-accent flex items-center justify-center text-2xl font-bold">
            T
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-th-accent animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-th-accent animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-th-accent animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={effectiveUser ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={effectiveUser ? <Navigate to="/" replace /> : <Register />} />
      <Route
        path="/*"
        element={effectiveUser ? <Platform user={effectiveUser} /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}
