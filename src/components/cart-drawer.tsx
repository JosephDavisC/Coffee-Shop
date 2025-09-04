'use client'

import { useMemo } from 'react'
import { useCart } from '@/store/cart'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

export default function CartDrawer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { items, setQty, remove, clear, subtotal } = useCart()
  const total = useMemo(() => subtotal(), [items])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex-1 space-y-4 overflow-auto">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-3">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={item.name}
                    src={item.image_url}
                    className="h-16 w-16 rounded object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded bg-muted" />
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="font-medium">{item.name}</div>
                    <button
                      className="text-xs text-muted-foreground hover:underline"
                      onClick={() => remove(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {formatCurrency(item.price_cents)}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={e => setQty(item.id, Math.max(1, Number(e.target.value)))}
                      className="h-8 w-20 rounded border bg-background px-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <Separator className="my-4" />

        {/* Sticky footer with two full-width buttons */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="font-semibold">{formatCurrency(total)}</span>
          </div>
          <Button variant="outline" className="w-full" onClick={clear}>
            Clear
          </Button>
          <Button
            className="w-full"
            disabled={items.length === 0}
            onClick={() => (window.location.href = '/checkout')}
          >
            Go to Checkout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
