'use client'

import { useEffect, useState } from 'react'

export default function StatusPoller({ orderId }: { orderId: string }) {
  const [state, setState] = useState<'pending'|'paid'|'failed'|'refunded'|'done'>('pending')

  useEffect(() => {
    let tries = 0
    const tick = async () => {
      tries++
      try {
        const res = await fetch(`/api/orders/status?orderId=${orderId}`, { cache: 'no-store' })
        const j = await res.json()
        if (j?.status && j.status !== 'pending') {
          setState(j.status)
          // soft reload to show final status without a full route change
          window.location.reload()
          return
        }
      } catch {}
      if (tries < 20) setTimeout(tick, 1500) // ~30s total
      else setState('done')
    }
    tick()
  }, [orderId])

  return (
    <p className="mt-4 text-sm text-muted-foreground">
      Waiting for payment confirmation{state === 'done' ? ' (still pending; it may take a moment)' : '…'}
    </p>
  )
}