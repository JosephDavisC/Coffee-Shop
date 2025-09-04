'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const code = sp.get('code');
      const next = sp.get('next') || '/orders';

      if (!code) {
        router.replace('/login?error=missing_code');
        return;
      }

      const supabase = createSupabaseClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        router.replace('/login?error=' + encodeURIComponent(error.message));
        return;
      }

      if (!cancelled) {
        // make server components see the new session cookie
        router.replace(next);
        router.refresh();
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router, sp]);

  return (
    <div className="p-6 text-sm text-muted-foreground">
      Signing you in…
    </div>
  );
}