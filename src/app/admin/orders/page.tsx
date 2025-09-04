// src/app/admin/orders/page.tsx
import Link from 'next/link'
import { Suspense } from 'react'
import { listAdminOrders } from '@/lib/admin-orders'
import { formatCurrency } from '@/lib/format'

// --------------------------------------
// Small status pill
// --------------------------------------
function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    failed: 'bg-rose-100 text-rose-700',
    refunded: 'bg-slate-200 text-slate-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${map[s] ?? 'bg-slate-100 text-slate-700'}`}>
      {s}
    </span>
  )
}

// --------------------------------------
// Server child that actually loads rows
// --------------------------------------
async function OrdersTable({ status, cursor }: { status: string; cursor?: string }) {
  // You can tweak the limit if you like
  const orders = await listAdminOrders({ status, limit: 25, cursor })
  const nextCursor = orders.at(-1)?.created_at

  return (
    <>
      <div className="rounded border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
              <th>Created</th>
              <th>Order</th>
              <th>User</th>
              <th>Status</th>
              <th>Total</th>
              <th>PI</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t [&>td]:px-3 [&>td]:py-2">
                <td>{new Date(o.created_at).toLocaleString()}</td>
                <td className="font-mono text-[11px]">{o.id}</td>
                <td>{o.email ?? '—'}</td>
                <td><StatusBadge s={o.status} /></td>
                <td>{formatCurrency(o.amount_cents, o.currency)}</td>
                <td>
                  {o.pi_id ? (
                    <a
                      className="text-blue-600 hover:underline"
                      href={`https://dashboard.stripe.com/test/payments/${o.pi_id}`}
                      target="_blank"
                      rel="noreferrer"
                      title={o.pi_id}
                    >
                      {o.pi_id.slice(0, 12)}…
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

      {nextCursor && (
        <form className="mt-3 flex justify-center" method="get" action="/admin/orders">
          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="cursor" value={nextCursor} />
          <button className="border px-3 py-1 rounded hover:bg-muted" type="submit">
            Load more
          </button>
        </form>
      )}
    </>
  )
}

// Accept either shape that Next 15 may pass.
type SP = Promise<URLSearchParams | Record<string, string | string[] | undefined>>

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SP
}) {
  const raw = await searchParams

  // Normalize to URLSearchParams so `.get()` always works
  const sp =
    raw instanceof URLSearchParams
      ? raw
      : new URLSearchParams(
          Object.entries(raw).flatMap(([k, v]) =>
            v == null ? [] : Array.isArray(v) ? v.map((vv) => [k, vv]) : [[k, v]]
          )
        )

  const status = (sp.get('status') ?? 'all').toLowerCase()
  const cursor = sp.get('cursor') ?? undefined

  const tabs = ['all', 'paid', 'pending', 'failed', 'refunded'] as const

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin · Orders</h1>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t}
            href={`/admin/orders?status=${t}`}
            className={`border px-3 py-1 rounded ${
              status === t ? 'bg-black text-white' : 'hover:bg-muted'
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading orders…</div>}>
        <OrdersTable status={status} cursor={cursor ?? undefined} />
      </Suspense>
    </div>
  )
}