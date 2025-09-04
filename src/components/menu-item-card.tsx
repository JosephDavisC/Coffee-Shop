'use client'

import Image from 'next/image'
import { useCart } from '@/store/cart'
import { formatCurrency } from '@/lib/format'

export type MenuItem = {
  id: string
  name: string
  description: string | null
  image_url: string | null
  price_cents: number
  currency: string // <-- make sure this comes from DB query
  category: string
}

export default function MenuItemCard({ item }: { item: MenuItem }) {
  const add = useCart(s => s.add)

  const onAdd = () => {
    // Push exactly what the cart expects
    add({
      id: item.id,
      name: item.name,
      price_cents: item.price_cents,
      currency: item.currency || 'usd', // default just in case
    })
  }

  return (
    <div className="rounded-lg border bg-white/70">
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-zinc-100">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 33vw, 100vw"
          />
        ) : null}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-medium">{item.name}</h3>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
          <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs">{item.category}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {formatCurrency(item.price_cents, item.currency || 'usd')}
          </span>
          <button
            onClick={onAdd}
            className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-900"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  )
}