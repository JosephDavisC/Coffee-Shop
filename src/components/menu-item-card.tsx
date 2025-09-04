'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/store/cart'
import { formatCurrency } from '@/lib/format'

export type MenuItem = {
  id: string
  name: string
  description: string | null
  image_url: string | null
  price_cents: number
  category: string
}

export default function MenuItemCard({ item }: { item: MenuItem }) {
  const add = useCart(s => s.add)

  return (
    <Card className="overflow-hidden">
      {item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url} alt={item.name} className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-muted" />
      )}
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold">{item.name}</div>
          <Badge variant="secondary" className="shrink-0">{item.category}</Badge>
        </div>
        <div className="text-sm text-muted-foreground line-clamp-2">
          {item.description}
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="font-semibold">{formatCurrency(item.price_cents)}</div>
          <Button
            size="sm"
            onClick={() => add({ id: item.id, name: item.name, price_cents: item.price_cents, image_url: item.image_url }, 1)}
          >
            Add to cart
          </Button>
        </div>
      </div>
    </Card>
  )
}
