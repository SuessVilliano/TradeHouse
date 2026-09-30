import { ArrowRight, ShieldCheck, Swords } from 'lucide-react';

export default function Register() {
  return (
    <main className="grid min-h-screen place-items-center bg-th-bg p-4 text-th-text">
      <div className="w-full max-w-md rounded-2xl border border-th-border bg-th-sidebar p-8 text-center shadow-2xl">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-blue-500 to-cyan-500 text-white">
          <Swords className="h-6 w-6" />
        </div>

        <h1 className="mt-5 text-2xl font-black">Create your Trade Hybrid Club account</h1>
        <p className="mt-3 text-sm leading-6 text-th-muted">
          Trade House does not use a separate account. Create your Club identity once, complete onboarding once, and the same login carries into the Arena.
        </p>

        <a
          href="https://pro.tradehybrid.co/register"
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 px-5 py-3 font-black text-white"
        >
          <ShieldCheck className="h-4 w-4" /> Create Club account <ArrowRight className="h-4 w-4" />
        </a>

        <a
          href="https://pro.tradehybrid.co/login"
          className="mt-3 block rounded-xl border border-th-border px-5 py-3 text-sm font-bold text-th-text"
        >
          I already have a Club account
        </a>
      </div>
    </main>
  );
}
