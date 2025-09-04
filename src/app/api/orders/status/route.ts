// src/app/api/orders/status/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing order id' }, { status: 400 })
  }

  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('orders')
    .select('status')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: data?.status ?? null })
}