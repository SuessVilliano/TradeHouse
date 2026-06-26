import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { TrendingUp, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (username.length < 3) { setError('Username must be at least 3 characters'); return; }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) { setError('Username can only contain letters, numbers, underscores, and hyphens'); return; }
    setLoading(true); setError('');
    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password, options: { data: { username } },
    });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    if (data.user) {
      try {
        await fetch('/api/auth/profile', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.user.id, username }),
        });
      } catch (_) {}
      if (data.session) { navigate('/'); } else { setSuccess(true); }
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-th-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-th-green/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-th-green" />
          </div>
          <h2 className="text-xl font-semibold text-th-text mb-2">Verify your email</h2>
          <p className="text-th-muted text-sm">We sent a confirmation link to <span className="text-th-accent">{email}</span>.</p>
          <Link to="/login" className="inline-block mt-6 text-th-accent hover:text-th-accent-hover text-sm font-medium transition-colors">Back to login →</Link>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl font-semibold text-th-text mb-2">Join TradeHouse</h1>
          <p className="text-th-muted text-sm mb-6">Create your trader account</p>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-th-red bg-th-red/10 border border-th-red/20 rounded-lg px-3 py-2 text-sm">
                <AlertCircle size={14} /><span>{error}</span>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-medium text-th-muted uppercase tracking-wider">Username</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-th-muted" />
                <input type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} placeholder="bullish_trader" required
                  className="w-full bg-th-input-bg border border-th-border rounded-lg pl-9 pr-4 py-2.5 text-th-text placeholder-th-muted text-sm focus:outline-none focus:border-th-accent focus:ring-1 focus:ring-th-accent/30 transition-colors" />
              </div>
            </div>
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
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" required
                  className="w-full bg-th-input-bg border border-th-border rounded-lg pl-9 pr-4 py-2.5 text-th-text placeholder-th-muted text-sm focus:outline-none focus:border-th-accent focus:ring-1 focus:ring-th-accent/30 transition-colors" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-th-accent hover:bg-th-accent-hover disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm mt-2">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>
        <p className="text-center text-th-muted text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-th-accent hover:text-th-accent-hover transition-colors font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
