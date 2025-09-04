import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    // Parse body safely
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { orderId, amount_cents, currency = 'usd' } = body

    // Env check
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 })
    }
    const stripe = new Stripe(key)
    
    // Auth check (so we know why it fails)
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Determine the amount
    let cents = Number(amount_cents)
    if (!cents && orderId) {
      // Look up order in Supabase if you pass orderId
      const { data: order, error } = await supabase
        .from('orders')
        .select('id, amount_cents, currency, status')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        return NextResponse.json({ error: `Order lookup failed: ${error.message}` }, { status: 400 })
      }
      if (!order) {
        return NextResponse.json({ error: 'Order not found for user' }, { status: 404 })
      }
      if (order.status !== 'pending') {
        return NextResponse.json({ error: `Order status is ${order.status}` }, { status: 400 })
      }
      cents = order.amount_cents
    }

    if (!cents || cents < 50) {
      return NextResponse.json({ error: 'Missing or invalid amount_cents' }, { status: 400 })
    }

    // Create PI
    const pi = await stripe.paymentIntents.create({
      amount: cents,
      currency,
      metadata: {
        order_id: orderId ?? '',
        user_id: user.id,
      },
      automatic_payment_methods: { enabled: true },
    })

    return NextResponse.json({ client_secret: pi.client_secret })
  } catch (err: any) {
    console.error('[pi.create] error', err)
    return NextResponse.json({ error: err?.message ?? 'Unknown server error' }, { status: 500 })
  }
}