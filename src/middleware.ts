import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  // Clone the request headers, so we can modify/set cookies on the response
  const res = NextResponse.next({ request: { headers: req.headers } })

  // Create a server client bound to the request/response cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          res.cookies.delete({ name, ...options })
        },
      },
    }
  )

  // Touch the session to refresh cookies if needed
  await supabase.auth.getSession()

  return res
}

// Run on all app routes except static files and API routes if you prefer.
// You can tune this matcher to your needs.
export const config = {
  matcher: [
    // run on everything under app/, but skip _next static and public assets
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)).*)',
  ],
}