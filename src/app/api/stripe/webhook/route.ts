import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs' // raw body support

export async function POST(req: Request) {
  const stripe = getStripe()
  const sig = (await headers()).get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !secret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET or signature header')
    return new NextResponse('Missing webhook config', { status: 400 })
  }

  const raw = await req.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret)
  } catch (err: any) {
    console.error('Webhook signature error:', err?.message)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {
    console.log('[stripe:webhook] event:', event.type)

    if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed') {
      const pi: any = event.data.object
      const orderId: string | undefined = pi?.metadata?.order_id
      const status = event.type === 'payment_intent.succeeded' ? 'paid' : 'failed'

      console.log('[stripe:webhook] PI:', pi?.id, 'order_id:', orderId, '->', status)

      let update
      if (orderId) {
        update = await supabaseAdmin
          .from('orders')
          .update({
            status,
            payment_intent_id: pi.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)
        } else {
        update = await supabaseAdmin
          .from('orders')
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('payment_intent_id', pi.id)
      }

      if (update.error) {
        console.error('[stripe:webhook] Supabase update error:', update.error)
        return NextResponse.json({ received: true, update: 'error' })
      }
      console.log('[stripe:webhook] Supabase updated rows:', update.count ?? 'n/a')
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[stripe:webhook] handler failure:', err)
    return NextResponse.json({ error: 'handler failure' }, { status: 500 })
  }
}