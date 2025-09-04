// src/app/api/stripe/create-payment-intent/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServer } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

type PostBody = { items: { id: string; qty: number }[]; clientRequestId?: string }

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServer()

    // who’s buying
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { items, clientRequestId } = (await req.json()) as PostBody
    if (!items?.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })

    // 1) compute line totals from DB for trust
    const ids = items.map(i => i.id)
    const { data: products, error: menuErr } = await supabase
      .from('menu_items')
      .select('id,name,price_cents,currency')
      .in('id', ids)

    if (menuErr) return NextResponse.json({ error: menuErr.message }, { status: 400 })

    const byId = new Map(products.map(p => [p.id, p]))
    const amount_cents = items.reduce((sum, i) => sum + (byId.get(i.id)!.price_cents * i.qty), 0)
    const currency = products[0]?.currency ?? 'usd'

    // 2) check for an existing order by clientRequestId (idempotency)
    const idKey = clientRequestId ?? 'cli-' + uuidv4()

    const { data: existing } = await supabase
      .from('orders')
      .select('id,payment_intent_id,status')
      .eq('user_id', user.id)
      .eq('client_request_id', idKey)
      .maybeSingle()

    if (existing) {
      // already created previously → just fetch current PI secret and return
      const pi = await stripe.paymentIntents.retrieve(existing.payment_intent_id!)
      return NextResponse.json({ clientSecret: pi.client_secret, orderId: existing.id })
    }

    // 3) create order + items
    const { data: orderRow, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        amount_cents,
        currency,
        status: 'pending',
        client_request_id: idKey, // NEW column we use for idempotency
      })
      .select('id')
      .single()

    if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 400 })

    const order_id = orderRow.id
    const itemsRows = items.map(i => ({
      order_id,
      menu_item_id: i.id,
      qty: i.qty,
      name: byId.get(i.id)!.name,
      price_cents: byId.get(i.id)!.price_cents,
      currency: byId.get(i.id)!.currency,
    }))
    const { error: oiErr } = await supabase.from('order_items').insert(itemsRows)
    if (oiErr) return NextResponse.json({ error: oiErr.message }, { status: 400 })

    // 4) create PI (also send Stripe idempotency key)
    const pi = await stripe.paymentIntents.create(
      {
        amount: amount_cents,
        currency,
        automatic_payment_methods: { enabled: true },
        metadata: { order_id, user_id: user.id },
      },
      { idempotencyKey: `pi:${order_id}` } // if retried, Stripe reuses
    )

    // 5) persist PI id
    await supabase.from('orders').update({ payment_intent_id: pi.id }).eq('id', order_id)

    return NextResponse.json({ clientSecret: pi.client_secret, orderId: order_id })
  } catch (err: any) {
    console.error('[pi.create] error', err)
    return NextResponse.json({ error: err?.message ?? 'Unknown server error' }, { status: 500 })
  }
}