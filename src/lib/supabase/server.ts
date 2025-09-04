// src/lib/supabase/server.ts
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const createSupabaseServer = async () => {
  const cookieStore = await cookies() // Next 15: async

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options)
        },
        async remove(name: string, options: CookieOptions) {
          cookieStore.set(name, '', options)
        },
      },
    }
  )
}
