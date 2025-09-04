// src/app/checkout/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useCart } from '@/store/cart'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { v4 as uuidv4 } from 'uuid'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ------- Small order summary -------
function Summary() {
  const items = useCart(s => s.items)
  const subtotal = useCart(s => s.subtotal)()
  if (!items.length) return null
  // If your formatCurrency wants a currency, you can use:
  // const currency = items[0]?.currency ?? 'usd'
  return (
    <div className="rounded border bg-white/70 p-4 text-sm">
      <div className="mb-2 font-medium">Your order</div>
      <ul className="space-y-1">
        {items.map(i => (
          <li key={i.id} className="flex justify-between">
            <span className="truncate">{i.name} × {i.qty}</span>
            <span>{formatCurrency(i.price_cents * i.qty /*, i.currency*/)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 border-t pt-2 flex justify-between font-medium">
        <span>Total</span>
        <span>{formatCurrency(subtotal /*, currency*/)}</span>
      </div>
    </div>
  )
}

// ------- Stripe form -------
function CheckoutForm({ orderId }: { orderId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const clear = useCart(s => s.clear)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onPay = async () => {
    if (!stripe || !elements) return
    setLoading(true); setError(null)
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/orders/thanks?order=${orderId}` },
    })
    if (error) setError(error.message ?? 'Payment error')
    // Clear locally after handing off to Stripe (webhook updates order to "paid")
    clear()
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <PaymentElement />
      {error && <div className="text-sm text-red-600">{error}</div>}
      <Button onClick={onPay} disabled={!stripe || loading} className="w-full">
        {loading ? 'Processing…' : 'Pay now'}
      </Button>
    </div>
  )
}

// ------- Page -------
export default function CheckoutPage() {
  const items = useCart(s => s.items)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const appearance = useMemo(() => ({ theme: 'stripe' as const }), [])

  // Prevent duplicate POST in dev (React Strict Mode double-mount)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const start = async () => {
      setLoadErr(null)
      if (!items.length) { setLoadErr('Cart is empty'); return }
      try {
        // Send an idempotency seed so the server can return the same order/PI
        const clientRequestId = uuidv4()

        const res = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientRequestId,
            items: items.map(i => ({ id: i.id, qty: i.qty })),
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setLoadErr(data?.error ?? 'Failed to start checkout')
          return
        }
        setClientSecret(data.clientSecret)
        setOrderId(data.orderId)
      } catch (e: any) {
        setLoadErr(e?.message ?? 'Network error')
      }
    }

    start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run exactly once per mount

  if (loadErr) return <div className="p-6 text-sm text-red-600">{loadErr}</div>
  if (!clientSecret || !orderId) return <div className="p-6 text-sm text-zinc-500">Preparing checkout…</div>

  return (
    <div className="mx-auto grid max-w-4xl gap-6 p-6 md:grid-cols-2">
      <Summary />
      <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
        <CheckoutForm orderId={orderId} />
      </Elements>
    </div>
  )
}