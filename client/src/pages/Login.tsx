import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useDemo } from '../lib/demoContext';
import { TrendingUp, Mail, Lock, AlertCircle, Zap } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { enterDemo } = useDemo();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); } else { navigate('/'); }
  };

  const handleMagicLink = async () => {
    if (!email) { setError('Enter your email first'); return; }
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) { setError(error.message); } else { setMagicSent(true); }
    setLoading(false);
  };

  const handleEnterDemo = () => {
    enterDemo();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-th-bg flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-th-accent/10 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-th-accent flex items-center justify-center shadow-lg shadow-th-accent/30">
            <TrendingUp size={24} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-th-text">TradeHouse</span>
        </div>
        <div className="bg-th-sidebar border border-th-border rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-semibold text-th-text mb-2">Welcome back</h1>
          <p className="text-th-muted text-sm mb-6">Sign in to your trading community</p>

          <div className="mb-5 p-3 rounded-xl bg-th-accent/10 border border-th-accent/30 flex items-center justify-between gap-3">
            <div>
              <p className="text-th-text text-xs font-semibold">Just browsing?</p>
              <p className="text-th-muted text-xs">Try the platform instantly — no account needed.</p>
            </div>
            <button
              onClick={handleEnterDemo}
              className="flex-shrink-0 flex items-center gap-1.5 bg-th-accent hover:bg-th-accent-hover text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Zap size={12} />
              Enter as Demo
            </button>
          </div>

          {magicSent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-th-accent/20 flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-th-accent" />
              </div>
              <p className="text-th-text font-medium mb-2">Check your email</p>
              <p className="text-th-muted text-sm">We sent a magic link to <span className="text-th-accent">{email}</span></p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-th-red bg-th-red/10 border border-th-red/20 rounded-lg px-3 py-2 text-sm">
                  <AlertCircle size={14} /><span>{error}</span>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium text-th-muted uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-th-muted" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="trader@example.com" required
                    className="w-full bg-th-input-bg border border-th-border rounded-lg pl-9 pr-4 py-2.5 text-th-text placeholder-th-muted text-sm focus:outline-none focus:border-th-accent focus:ring-1 focus:ring-th-accent/30 transition-colors" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-th-muted uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-th-muted" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                    className="w-full bg-th-input-bg border border-th-border rounded-lg pl-9 pr-4 py-2.5 text-th-text placeholder-th-muted text-sm focus:outline-none focus:border-th-accent focus:ring-1 focus:ring-th-accent/30 transition-colors" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-th-accent hover:bg-th-accent-hover disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
              <div className="relative flex items-center gap-3">
                <div className="flex-1 border-t border-th-border" />
                <span className="text-th-muted text-xs">or</span>
                <div className="flex-1 border-t border-th-border" />
              </div>
              <button type="button" onClick={handleMagicLink} disabled={loading}
                className="w-full bg-th-input-bg hover:bg-th-border disabled:opacity-50 text-th-text font-medium py-2.5 rounded-lg transition-colors text-sm border border-th-border">
                ✉️ Send Magic Link
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-th-muted text-sm mt-6">
          New to TradeHouse?{' '}
          <Link to="/register" className="text-th-accent hover:text-th-accent-hover transition-colors font-medium">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
