'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Coffee, LogOut } from 'lucide-react'
import Container from './container'
import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import CartDrawer from './cart-drawer'

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const active = pathname === href || (href !== '/' && pathname?.startsWith(href))
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-black text-white' : 'text-zinc-700 hover:bg-zinc-100'
      }`}
    >
      {children}
    </Link>
  )
}

export default function Navbar({ userEmail }: { userEmail?: string | null }) {
  const router = useRouter()
  const supabase = createSupabaseClient()

  const [isAuthed, setIsAuthed] = useState(Boolean(userEmail))
  const [scrolled, setScrolled] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session)
    })
    return () => data.subscription.unsubscribe()
  }, [supabase])

  async function handleLogout() {
    try {
      setIsLoggingOut(true)
      await supabase.auth.signOut()
      setIsAuthed(false)
      router.push('/')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className={`sticky top-0 z-40 w-full backdrop-blur ${scrolled ? 'bg-white/70 shadow-sm' : 'bg-white/50'}`}>
      <Container className="flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Coffee className="h-5 w-5" />
          <span className="font-semibold tracking-tight">Coffee Shop</span>
        </Link>

        <nav className="hidden gap-1 md:flex">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/menu">Menu</NavLink>
          <NavLink href="/orders">Orders</NavLink>
          <NavLink href="/admin">Admin</NavLink>
          <NavLink href="/profile">Profile</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {/* Cart trigger + drawer */}
          <CartDrawer />

          {isAuthed ? (
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="hidden items-center gap-1 rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-black disabled:opacity-60 md:flex"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? 'Logging out…' : 'Logout'}
            </button>
          ) : (
            <Link href="/login" className="rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-50">
              Sign in
            </Link>
          )}
        </div>
      </Container>
    </div>
  )
}