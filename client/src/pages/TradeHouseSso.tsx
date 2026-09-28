import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://uqtluroceakqtlvlzatt.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_YjXHHnoRXE4pvn6ezLdU5w_O03Q62W_';

export default function TradeHouseSso() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const run = async () => {
      const code = String(params.get('code') || '').trim();
      const nextRaw = String(params.get('next') || '/');
      const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/';

      if (!/^[a-f0-9]{64}$/i.test(code)) {
        if (active) setError('This Trade House sign-in link is invalid or incomplete.');
        return;
      }

      try {
        const response = await fetch(
          SUPABASE_URL + '/functions/v1/tradehouse-sso-exchange',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_KEY,
            },
            body: JSON.stringify({ code }),
          },
        );

        const body = await response.json().catch(() => ({}));

        if (!response.ok || !body?.tokenHash) {
          throw new Error(body?.error || 'Could not complete Trade House sign-in.');
        }

        const verificationType = String(body.verificationType || 'magiclink');

        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: body.tokenHash,
          type: verificationType as any,
        });

        if (verifyError) throw verifyError;

        window.history.replaceState({}, document.title, '/sso');
        navigate(next, { replace: true });
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : 'Could not complete Trade House sign-in.');
        }
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [navigate, params]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050810] px-5 text-white">
        <div className="w-full max-w-md rounded-[28px] border border-rose-300/15 bg-[#0b111e] p-7 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-300" />
          <h1 className="mt-5 text-2xl font-black">Trade House sign-in expired.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">{error}</p>
          <div className="mt-6 flex flex-col gap-2">
            <a
              href="https://pro.tradehybrid.co/dashboard"
              className="rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950"
            >
              Return to Trade Hybrid Club
            </a>
            <Link
              to="/login"
              className="rounded-xl border border-white/10 px-4 py-3 text-sm font-black text-slate-300"
            >
              Sign in directly
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#050810] px-5 text-white">
      <div className="w-full max-w-md rounded-[28px] border border-cyan-300/15 bg-[#0b111e] p-7 text-center shadow-2xl">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-violet-500 text-slate-950">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-black">Opening Trade House…</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Verifying your Trade Hybrid Club session. No second password is required.
        </p>
        <Loader2 className="mx-auto mt-6 h-5 w-5 animate-spin text-cyan-300" />
      </div>
    </main>
  );
}
