'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart, X, Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from '@/store/cart'
import { formatCurrency } from '@/lib/format'
import Link from 'next/link'

/** Show the badge only after mount to avoid hydration mismatch */
function CartBadgeCount() {
  const count = useCart(s => s.items.reduce((n, i) => n + i.qty, 0))
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted || count === 0) return null
  return (
    <span className="absolute -right-1 -top-1 rounded-full bg-black px-1.5 text-[10px] font-semibold text-white">
      {count}
    </span>
  )
}

export default function CartDrawer() {
  const [open, setOpen] = useState(false)

  // single-store selectors (avoid multiple import paths!)
  const items = useCart(s => s.items)
  const inc = useCart(s => s.inc)
  const dec = useCart(s => s.dec)
  const remove = useCart(s => s.remove)
  const clear = useCart(s => s.clear)
  const subtotal = useCart(s => s.subtotal)() // compute once per render

  return (
    <>
      {/* Trigger in navbar */}
      <button
        aria-label="Cart"
        onClick={() => setOpen(true)}
        className="relative rounded-md p-2 hover:bg-zinc-100"
      >
        <ShoppingCart className="h-5 w-5" />
        <CartBadgeCount />
      </button>

      {/* Drawer panel */}
      {open && (
        <div className="fixed inset-0 z-50">
          {/* backdrop */}
          <div
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          {/* panel */}
          <aside
            className="absolute right-0 top-0 flex h-screen w-[360px] flex-col bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Your Cart"
          >
            {/* header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-medium">Your Cart</h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close cart"
                className="rounded p-1 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* CONTENT — this must flex-1 to avoid collapsing */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Cart is empty</p>
              ) : (
                <ul className="space-y-3">
                  {items.map(i => (
                    <li key={i.id} className="rounded border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{i.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(i.price_cents, i.currency)}
                          </p>
                        </div>
                        <button
                          onClick={() => remove(i.id)}
                          className="rounded p-1 text-zinc-500 hover:bg-zinc-100"
                          aria-label={`Remove ${i.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => dec(i.id)}
                            className="rounded border p-1 hover:bg-zinc-50"
                            aria-label="Decrease"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-6 text-center">{i.qty}</span>
                          <button
                            onClick={() => inc(i.id)}
                            className="rounded border p-1 hover:bg-zinc-50"
                            aria-label="Increase"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="text-sm font-medium">
                          {formatCurrency(i.qty * i.price_cents, i.currency)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* FOOTER (sticky) */}
            <div className="border-t p-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  {items.length === 0
                    ? '$0.00'
                    : formatCurrency(subtotal, items[0].currency)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clear}
                  disabled={items.length === 0}
                  className="w-28 rounded-md border px-3 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50"
                >
                  Clear
                </button>
                <Link
                  href="/checkout"
                  className={`flex-1 rounded-md px-3 py-2 text-center text-sm text-white ${
                    items.length === 0
                      ? 'pointer-events-none bg-zinc-400'
                      : 'bg-black hover:bg-zinc-900'
                  }`}
                >
                  Checkout
                </Link>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}