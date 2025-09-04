'use client'
import { cn } from '@/lib/utils'

export function OrderStatusBadge({ status }: { status: string }) {
  const color =
    status === 'paid' ? 'bg-green-100 text-green-800'
    : status === 'pending' ? 'bg-amber-100 text-amber-800'
    : status === 'failed' ? 'bg-red-100 text-red-800'
    : status === 'refunded' ? 'bg-blue-100 text-blue-800'
    : 'bg-gray-100 text-gray-800'

  return (
    <span className={cn('inline-flex items-center rounded px-2 py-0.5 text-xs font-medium', color)}>
      {status}
    </span>
  )
}