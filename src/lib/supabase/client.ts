import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // PKCE is the current recommended flow for email links
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  )
}