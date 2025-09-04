'use client'

import { useEffect, useMemo, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useCart } from '@/store/cart'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({
  clientSecret,
  orderId,
  amountCents,
}: {
  clientSecret: string
  orderId: string
  amountCents: number
}) {
  const stripe = useStripe()
  const elements = useElements()
  const clear = useCart(s => s.clear)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePay = async () => {
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    const { error: payErr } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders/thanks?order=${orderId}`,
      },
      // behavior: 'redirect_if_required' // default — fine to omit
    })

    // If Stripe returns an immediate error (validation, card error, etc.)
    if (payErr) {
      setError(payErr.message ?? 'Payment error')
    } else {
      // If no redirect was needed and payment completed synchronously,
      // we can clear the cart now. If a redirect happens, we’ll land
      // on /orders/thanks and won’t execute this line anyway.
      clear()
    }

    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-6">
      <div className="text-sm text-muted-foreground">
        Pay {formatCurrency(amountCents, 'usd')}
      </div>
      <PaymentElement />
      {error && <div className="text-sm text-red-500">{error}</div>}
      <Button className="w-full" onClick={handlePay} disabled={!stripe || loading}>
        {loading ? 'Processing…' : 'Pay now'}
      </Button>
    </div>
  )
}

export default function CheckoutPage() {
  const items = useCart(s => s.items)
  const subtotalCents = useCart(s => s.subtotal)() // <- ensure this returns cents
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const appearance = useMemo(() => ({ theme: 'stripe' as const }), [])

  useEffect(() => {
    const start = async () => {
      setLoadErr(null)

      if (!items.length) {
        setLoadErr('Cart is empty')
        return
      }

      // Coerce subtotal to integer cents just in case
      const amount_cents = Math.round(Number(subtotalCents || 0))
      if (!Number.isFinite(amount_cents) || amount_cents <= 0) {
        setLoadErr('Missing or invalid amount_cents')
        return
      }

      try {
        const res = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount_cents,      // <-- what the API expects
            currency: 'usd',
            // order_id: existingIdIfYouHaveOne
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          console.error('PI create failed:', data)
          setLoadErr(data?.error ?? 'Failed to create payment')
          return
        }

        // Your API returns `client_secret` and (optionally) `order_id`
        setClientSecret(data.client_secret)
        setOrderId(data.order_id ?? null)
      } catch (e: any) {
        console.error(e)
        setLoadErr(e?.message ?? 'Network error')
      }
    }

    start()
  }, [items, subtotalCents])

  if (loadErr) return <div className="p-6 text-sm text-red-500">{loadErr}</div>
  if (!clientSecret) return <div className="p-6 text-sm text-muted-foreground">Preparing checkout…</div>

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
      <CheckoutForm
        clientSecret={clientSecret}
        orderId={orderId ?? 'unknown'}
        amountCents={Math.round(Number(subtotalCents || 0))}
      />
    </Elements>
  )
}