import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/format'
import { OrderStatusBadge } from '@/components/ui/order-status-badge'
import StatusPoller from './status-poller'

export const dynamic = 'force-dynamic'

type SP = { order?: string; orderId?: string; payment_intent?: string }

export default async function ThanksPage({
  searchParams,
}: {
  searchParams: Promise<SP>   // <- Promise
}) {
  const sp = await searchParams              // <- await
  const idParam = sp.orderId || sp.order
  const piParam = sp.payment_intent

  const supabase = await createSupabaseServer()

  let order: any = null
  if (idParam) {
    const { data } = await supabase
      .from('orders')
      .select('id, status, amount_cents, currency, created_at, payment_intent_id')
      .eq('id', idParam)
      .single()
    order = data
  } else if (piParam) {
    const { data } = await supabase
      .from('orders')
      .select('id, status, amount_cents, currency, created_at, payment_intent_id')
      .eq('payment_intent_id', piParam)
      .maybeSingle()
    order = data
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">Thanks for your order!</h1>
      <p className="mb-6 text-muted-foreground">We’re getting it ready.</p>

      {order ? (
        <>
          <div className="rounded border p-4">
            <div className="mb-2 text-sm">Order ID: <span className="font-mono">{order.id}</span></div>
            <div className="mb-2 text-sm">Placed: {new Date(order.created_at).toLocaleString()}</div>
            <div className="mb-2 text-sm">Total: {formatCurrency(order.amount_cents, order.currency)}</div>
            <div className="mb-4 text-sm">Status: <OrderStatusBadge status={order.status} /></div>
            <div className="flex gap-3">
              <Link className="underline" href="/orders">View all orders</Link>
              <Link className="underline" href="/menu">Back to menu</Link>
            </div>
          </div>
          {order.status === 'pending' && <StatusPoller orderId={order.id} />}
        </>
      ) : (
        <div className="rounded border p-4 text-sm">
          We couldn’t find that order. <Link className="underline" href="/orders">See your orders →</Link>
        </div>
      )}
    </div>
  )
}