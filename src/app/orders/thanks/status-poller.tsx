'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function StatusPoller() {
  const sp = useSearchParams()
  const router = useRouter()
  const orderId = sp.get('order')
  const [status, setStatus] = useState<'pending' | 'paid' | 'failed' | null>(null)

  useEffect(() => {
    if (!orderId) return
    let alive = true

    async function tick() {
      try {
        const r = await fetch(`/api/orders/status?id=${orderId}`, { cache: 'no-store' })
        const j = await r.json()
        if (!alive) return
        if (j?.status) {
          setStatus(j.status)
          if (j.status !== 'pending') {
            // re-render server page so it shows latest status
            router.refresh()
          }
        }
      } catch (err) {
        console.error('status poll failed', err)
      }
    }

    const interval = setInterval(tick, 3000) // poll every 3s
    tick()

    return () => {
      alive = false
      clearInterval(interval)
    }
  }, [orderId, router])

  return null
}