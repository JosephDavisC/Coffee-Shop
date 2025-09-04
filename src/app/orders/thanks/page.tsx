// src/app/orders/thanks/page.tsx
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'
import StatusPoller from './status-poller'

export const revalidate = 0
export const dynamic = 'force-dynamic'

type SP = {
  order?: string
  payment_intent?: string
  // stripe sometimes also includes these:
  payment_intent_client_secret?: string
  redirect_status?: string
}

function StatusChip({ status }: { status: string }) {
  const cls =
    status === 'paid'
      ? 'bg-green-100 text-green-700'
      : status === 'failed'
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {status}
    </span>
  )
}

export default async function ThanksPage({
  searchParams,
}: {
  // In Next 15 app router, searchParams is a Promise-like
  searchParams: Promise<SP> | SP
}) {
  // Make this robust for both sync and async forms
  const sp = (typeof (searchParams as any)?.then === 'function'
    ? await (searchParams as Promise<SP>)
    : (searchParams as SP)) || {}

  const orderId = sp.order
  const paymentIntent = sp.payment_intent

  const supabase = await createSupabaseServer()

  // Try to load an order. Prefer id; otherwise fall back to payment_intent_id (Stripe redirect may only include PI)
  let order: {
    id: string
    created_at: string
    amount_cents: number
    currency: string
    status: string
    payment_intent_id: string | null
  } | null = null

  if (orderId) {
    const { data } = await supabase
      .from('orders')
      .select('id, created_at, amount_cents, currency, status, payment_intent_id')
      .eq('id', orderId)
      .maybeSingle()
    order = data
  } else if (paymentIntent) {
    const { data } = await supabase
      .from('orders')
      .select('id, created_at, amount_cents, currency, status, payment_intent_id')
      .eq('payment_intent_id', paymentIntent)
      .order('created_at', { ascending: false })
      .maybeSingle()
    order = data
  }

  // Small helpers
  const stripeLinkPI = paymentIntent || order?.payment_intent_id || null
  const money = (cents: number, cur = 'USD') =>
    (cents / 100).toLocaleString('en-US', { style: 'currency', currency: cur.toUpperCase() })

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Thanks for your order!</h1>

      <p className="mt-2 text-muted-foreground">
        We’re getting it ready.
        {stripeLinkPI && (
          <>
            {' '}
            <a
              href={`https://dashboard.stripe.com/test/payments/${stripeLinkPI}`}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-4"
            >
              View in Stripe
            </a>
          </>
        )}
      </p>

      {order ? (
        <div className="mt-6 rounded-md border p-4">
          <p className="mb-1">
            <strong>Order ID:</strong> {order.id}
          </p>
          <p className="mb-1">
            <strong>Placed:</strong> {new Date(order.created_at).toLocaleString()}
          </p>
          <p className="mb-1">
            <strong>Total:</strong> {money(order.amount_cents, order.currency || 'USD')}
          </p>
          <p className="mb-1 flex items-center gap-2">
            <strong>Status:</strong> <StatusChip status={order.status} />
          </p>
        </div>
      ) : (
        <p className="mt-6 rounded-md bg-muted/40 p-4 text-sm text-muted-foreground">
          We couldn’t find that order.{' '}
          <Link href="/orders" className="underline">
            See your orders →
          </Link>
        </p>
      )}

      <div className="mt-8 flex gap-4">
        <Link href="/orders" className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
          View all orders
        </Link>
        <Link href="/menu" className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
          Back to menu
        </Link>
      </div>

      {/* Poll for status changes (pending -> paid) and refresh the page when it changes */}
      <StatusPoller />
    </div>
  )
}