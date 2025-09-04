'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import { createSupabaseClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = createSupabaseClient();
  const sp = useSearchParams();

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Allow redirects like /login?redirectTo=/orders
  const redirectTo = sp.get('redirectTo') || '/orders';

  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown(c => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function sendMagicLink() {
    const addr = email.trim();
    if (!addr) {
      toast.message('Please enter your email');
      return;
    }

    try {
      setSending(true);
      const { error } = await supabase.auth.signInWithOtp({
        email: addr,
        options: {
          // <-- send users to the callback that exchanges the code for a session
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            redirectTo,
          )}`,
        },
      });

      if (error) throw error;

      setSentTo(addr);
      setCooldown(30); // prevent spamming for 30s
      toast.success('Magic link sent — check your email');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to send magic link');
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cooldown > 0) return;
    await sendMagicLink();
  }

  return (
    <>
      <Toaster richColors />
      <section className="mx-auto max-w-md px-4 py-10">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-zinc-600">We’ll email you a one-tap sign-in link.</p>
        </div>

        <div className="rounded-lg border bg-white/70 p-5">
          {sentTo ? (
            <div className="space-y-3">
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                We sent a sign-in link to <span className="font-medium">{sentTo}</span>. Open it on
                this device to finish signing in.
              </div>
              <button
                type="button"
                disabled={sending || cooldown > 0}
                onClick={sendMagicLink}
                className="w-full rounded-md border px-3 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend link'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSentTo(null);
                  setEmail('');
                  setCooldown(0);
                }}
                className="w-full rounded-md px-3 py-2 text-center text-xs text-zinc-600 hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-xs text-zinc-500">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={sending || cooldown > 0}
                className="w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-zinc-900 disabled:opacity-60"
              >
                {sending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send magic link'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          By continuing you agree to our terms and privacy policy.
        </p>
      </section>
    </>
  );
}