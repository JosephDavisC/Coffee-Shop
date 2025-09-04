import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrderStatusBadge } from '@/components/ui/order-status-badge'
import { formatCurrency } from '@/lib/format'

export default async function OrdersPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/(auth)/login?next=/orders')

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, created_at, status, amount_cents, currency, payment_intent_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">My Orders</h1>

      {!orders?.length && (
        <div className="rounded border p-6 text-sm">
          You don’t have any orders yet. <Link className="underline" href="/menu">Browse the menu →</Link>
        </div>
      )}

      {!!orders?.length && (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="p-3">Created</th>
                <th className="p-3">Status</th>
                <th className="p-3">Total</th>
                <th className="p-3">Payment</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-t">
                  <td className="p-3">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="p-3"><OrderStatusBadge status={o.status} /></td>
                  <td className="p-3">{formatCurrency(o.amount_cents, o.currency)}</td>
                  <td className="p-3">
                    {o.payment_intent_id ? (
                      <a className="underline" target="_blank" rel="noreferrer"
                         href={`https://dashboard.stripe.com/test/payments/${o.payment_intent_id}`}>
                        View in Stripe
                      </a>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}