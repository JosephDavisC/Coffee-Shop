import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ error: 'missing orderId' }, { status: 400 })

  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ status: data?.status ?? null })
}