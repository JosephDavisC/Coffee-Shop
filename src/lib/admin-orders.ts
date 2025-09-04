import { createSupabaseServer } from '@/lib/supabase/server'

type AdminOrder = {
  id: string
  user_id: string
  email: string | null
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  amount_cents: number
  currency: string
  pi_id: string | null
  created_at: string
  updated_at: string
}

export async function listAdminOrders(params: {
  status?: string
  limit?: number
  cursor?: string // ISO created_at for “load more”
}) {
  const { status, limit = 20, cursor } = params
  const supabase = await createSupabaseServer()

  let q = supabase.from('admin_orders_v').select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status && status !== 'all') q = q.eq('status', status)
  if (cursor) q = q.lt('created_at', cursor)

  const { data, error } = await q
  if (error) throw error

  return (data as AdminOrder[]) ?? []
}