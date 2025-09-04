'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Coffee, LogOut, Menu as MenuIcon, X } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import Container from './container';
import { toast } from 'sonner';

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-black text-white' : 'text-zinc-700 hover:bg-zinc-100'
      }`}
    >
      {children}
    </Link>
  );
}

export default function Navbar({
  cartCount = 0,
  userEmail,
}: {
  cartCount?: number;
  userEmail?: string | null;
}) {
  const router = useRouter();
  const supabase = createSupabaseClient();

  // seed from server prop to avoid hydration mismatch
  const [isAuthed, setIsAuthed] = useState(Boolean(userEmail));
  const [scrolled, setScrolled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // keep navbar in sync if auth changes on the client
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session);
    });
    return () => {
      // guard in case data/subscription is undefined
      try { data.subscription.unsubscribe(); } catch {}
    };
  }, [supabase]);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      setIsAuthed(false);
      startTransition(() => {
        // refresh or redirect—refresh re-renders any server components that read the cookie
        router.refresh();
      });
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to log out');
    } finally {
      setIsLoggingOut(false);
      setMobileOpen(false);
    }
  }

  const NavLinks = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      <NavLink href="/" onClick={onItemClick}>Home</NavLink>
      <NavLink href="/menu" onClick={onItemClick}>Menu</NavLink>
      <NavLink href="/orders" onClick={onItemClick}>Orders</NavLink>
      <NavLink href="/admin" onClick={onItemClick}>Admin</NavLink>
      <NavLink href="/profile" onClick={onItemClick}>Profile</NavLink>
    </>
  );

  return (
    <div className={`sticky top-0 z-40 w-full backdrop-blur ${scrolled ? 'bg-white/70 shadow-sm' : 'bg-white/50'}`}>
      <Container className="flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden rounded-md p-2 hover:bg-zinc-100"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen(v => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
          <Link href="/" className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            <span className="font-semibold tracking-tight">Coffee Shop</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden gap-1 md:flex">
          <NavLinks />
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/checkout" aria-label="Cart" className="relative rounded-md p-2 hover:bg-zinc-100">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span
                aria-label={`${cartCount} items in cart`}
                className="absolute -right-1 -top-1 rounded-full bg-black px-1.5 text-[10px] font-semibold text-white"
              >
                {cartCount}
              </span>
            )}
          </Link>

          {isAuthed ? (
            <button
              onClick={handleLogout}
              disabled={isLoggingOut || isPending}
              className="hidden items-center gap-1 rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-black disabled:opacity-60 md:flex"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? 'Logging out…' : 'Logout'}
            </button>
          ) : (
            <Link href="/login" className="hidden rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-50 md:block">
              Sign in
            </Link>
          )}
        </div>
      </Container>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white/90 backdrop-blur-sm">
          <Container className="flex flex-col gap-1 py-2">
            <NavLinks onItemClick={() => setMobileOpen(false)} />
            <div className="mt-2 flex items-center gap-2">
              <Link
                href="/checkout"
                onClick={() => setMobileOpen(false)}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-50"
              >
                Cart
              </Link>
              {isAuthed ? (
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-black disabled:opacity-60"
                >
                  {isLoggingOut ? 'Logging out…' : 'Logout'}
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-50"
                >
                  Sign in
                </Link>
              )}
            </div>
          </Container>
        </div>
      )}
    </div>
  );
}