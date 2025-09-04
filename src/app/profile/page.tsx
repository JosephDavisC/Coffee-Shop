// src/app/profile/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/format'
import ProfileForm from './profile-form'
import { LogOut } from 'lucide-react'

export const revalidate = 0

type OrderRow = {
  id: string
  created_at: string
  amount_cents: number
  currency: string
  status: 'paid' | 'pending' | 'failed' | 'refunded' | string
  payment_intent_id: string | null
}

export default async function ProfilePage() {
  const supabase = await createSupabaseServer()

  // Who am I?
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, email')
    .eq('id', user.id)
    .maybeSingle()

  // Recent orders (normalize to [])
  const { data: orderRows } = await supabase
    .from('orders')
    .select('id, created_at, amount_cents, currency, status, payment_intent_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const orders: OrderRow[] = (orderRows ?? []) as OrderRow[]

  return (
    <section className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Profile</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-medium">{profile?.email ?? user.email}</span>
          </p>
        </div>

        {/* instant, client-less logout */}
        <form action="/api/auth/signout" method="post">
          <button className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-black">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>
      </header>

      {/* Account card */}
      <div className="rounded-lg border bg-white/70 p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-700">Account</h2>
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-zinc-500">Role</dt>
            <dd className="text-sm">{profile?.role ?? 'customer'}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Email</dt>
            <dd className="text-sm">{profile?.email ?? user.email}</dd>
          </div>
        </dl>

        <div className="mt-4">
          <ProfileForm initialName={profile?.full_name ?? ''} />
        </div>
      </div>

      {/* Orders card */}
      <div className="rounded-lg border bg-white/70 p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-700">Recent orders</h2>

        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent orders.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left [&>th]:px-3 [&>th]:py-2">
                  <th>Placed</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t [&>td]:px-3 [&>td]:py-2">
                    <td>{new Date(o.created_at).toLocaleString()}</td>
                    <td>
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          o.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : o.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : o.status === 'failed'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td>{formatCurrency(o.amount_cents, o.currency)}</td>
                    <td>
                      {o.payment_intent_id ? (
                        <a
                          className="text-blue-600 hover:underline"
                          href={`https://dashboard.stripe.com/test/payments/${o.payment_intent_id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {o.payment_intent_id.slice(0, 10)}…
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-3">
          <Link href="/orders" className="text-sm text-blue-600 hover:underline">
            See all orders →
          </Link>
        </div>
      </div>
    </section>
  )
}