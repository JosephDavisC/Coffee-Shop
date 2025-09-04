import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServer } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)


export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Missing STRIPE_WEBHOOK_SECRET' }, { status: 500 })
  }

  // Raw body needed for verification
  const rawBody = await req.text()
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (err: any) {
    console.error('[webhook] signature verify failed:', err?.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // We only need to update orders on these events
  if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent
    const supabase = await createSupabaseServer()

    try {
      if (event.type === 'payment_intent.succeeded') {
        // Mark the order paid by PI id
        const { error } = await supabase
          .from('orders')
          .update({ status: 'paid', updated_at: new Date().toISOString() })
          .eq('payment_intent_id', pi.id)

        if (error) {
          console.error('[webhook] update paid error:', error)
          return NextResponse.json({ received: true, warn: 'db-update-failed' })
        }
        console.log('[webhook] order marked paid for PI', pi.id)
      } else {
        // Optional: mark failed
        const { error } = await supabase
          .from('orders')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('payment_intent_id', pi.id)

        if (error) console.error('[webhook] update failed error:', error)
        console.log('[webhook] order marked failed for PI', pi.id)
      }
    } catch (e) {
      console.error('[webhook] db exception:', e)
    }
  }

  return NextResponse.json({ received: true })
}

// Needed so Next doesn’t parse the body (we need raw for Stripe)
export const config = {
  api: {
    bodyParser: false,
  },
} as any