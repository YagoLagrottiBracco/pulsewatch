import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { captureError } from '@/lib/sentry'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    captureError(err, { module: 'stripe/webhook', extra: { reason: 'signature_verification' } })
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id

        if (!userId) break

        // Determinar tier com base no price_id da assinatura
        let newTier = 'pro'
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          const priceId = subscription.items.data[0]?.price.id
          if (priceId === process.env.STRIPE_PRICE_ID_BUSINESS) {
            newTier = 'business'
          } else if (priceId === process.env.STRIPE_PRICE_ID_AGENCY) {
            newTier = 'agency'
          }
        }

        await supabase
          .from('user_profiles')
          .update({
            plan: 'pro',
            subscription_tier: newTier,
            subscription_status: 'active',
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
          })
          .eq('user_id', userId)

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Buscar usuário pelo customer_id
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) break

        // Atualizar status
        await supabase
          .from('user_profiles')
          .update({
            subscription_status: subscription.status === 'active' ? 'active' : 'canceled',
            subscription_ends_at: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
          })
          .eq('user_id', profile.user_id)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Buscar usuário pelo customer_id
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) break

        // Downgrade para free
        await supabase
          .from('user_profiles')
          .update({
            plan: 'free',
            subscription_tier: 'free',
            subscription_status: 'canceled',
            subscription_ends_at: new Date().toISOString(),
          })
          .eq('user_id', profile.user_id)

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    captureError(error, { module: 'stripe/webhook', extra: { eventType: event?.type } })
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
