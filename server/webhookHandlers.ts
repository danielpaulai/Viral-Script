import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import Stripe from 'stripe';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    // Process with Stripe sync for database mirroring
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);
    
    // Also handle subscription events for local user updates
    try {
      const stripe = await getUncachableStripeClient();
      const event = JSON.parse(payload.toString()) as Stripe.Event;
      
      await WebhookHandlers.handleSubscriptionEvent(event);
    } catch (error) {
      console.error("Error processing subscription webhook:", error);
    }
  }

  static async handleSubscriptionEvent(event: Stripe.Event): Promise<void> {
    const eventType = event.type;
    
    switch (eventType) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await WebhookHandlers.syncSubscriptionToUser(subscription);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await WebhookHandlers.handleSubscriptionDeleted(subscription);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        if (invoice.subscription) {
          console.log(`Payment succeeded for subscription ${invoice.subscription}`);
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        if (invoice.subscription) {
          console.log(`Payment failed for subscription ${invoice.subscription}`);
          const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
          if (customerId) {
            const user = await storage.getUserByStripeCustomerId(customerId);
            if (user) {
              // Downgrade plan and update status on payment failure
              await storage.updateUserSubscription(user.id, {
                subscriptionStatus: 'past_due',
                plan: 'starter', // Downgrade immediately on payment failure
              });
              console.log(`User ${user.id} downgraded to starter due to payment failure`);
            }
          }
        }
        break;
      }
      
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout completed for session ${session.id}`);
        break;
      }
      
      default:
        break;
    }
  }

  static async syncSubscriptionToUser(subscription: Stripe.Subscription): Promise<void> {
    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : (subscription.customer as any)?.id;
    
    if (!customerId) {
      console.error("No customer ID found in subscription");
      return;
    }
    
    const user = await storage.getUserByStripeCustomerId(customerId);
    if (!user) {
      console.error(`No user found for Stripe customer ${customerId}`);
      return;
    }
    
    const priceId = subscription.items.data[0]?.price?.id || null;
    const status = subscription.status;
    const subAny = subscription as any;
    const currentPeriodEnd = new Date((subAny.current_period_end || Date.now() / 1000) * 1000);
    const trialEnd = subAny.trial_end ? new Date(subAny.trial_end * 1000) : null;
    const cancelAtPeriodEnd = subscription.cancel_at_period_end ? 1 : 0;
    
    // Map subscription status to plan
    let plan = user.plan || 'starter';
    if (status === 'active' || status === 'trialing') {
      plan = 'pro'; // Active subscriptions get Pro plan
    } else if (status === 'canceled' || status === 'unpaid' || status === 'past_due' || status === 'incomplete' || status === 'incomplete_expired') {
      plan = 'starter'; // Any non-active status reverts to starter
    }
    
    await storage.updateUserSubscription(user.id, {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId || undefined,
      subscriptionStatus: status,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      trialEndsAt: trialEnd || undefined,
      plan,
    });
    
    console.log(`Synced subscription ${subscription.id} to user ${user.id} - status: ${status}, plan: ${plan}`);
    
    // Safeguard: Ensure user has Supabase account linked (prevents stuck users)
    if (!user.supabaseUserId && user.email) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseAdmin = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );
        
        // Check if Supabase user exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingSupabaseUser = existingUsers?.users?.find(
          (u: any) => u.email?.toLowerCase() === user.email?.toLowerCase()
        );
        
        if (existingSupabaseUser) {
          // Link existing Supabase user
          const { db } = await import("./db");
          const { sql } = await import("drizzle-orm");
          if (db) {
            await db.execute(
              sql`UPDATE users SET supabase_user_id = ${existingSupabaseUser.id} WHERE id = ${user.id} AND supabase_user_id IS NULL`
            );
            console.log(`[Webhook Safeguard] Linked existing Supabase user ${existingSupabaseUser.id} to local user ${user.id}`);
          }
        } else {
          // Create Supabase user and link
          const { randomUUID } = await import("crypto");
          const tempPassword = randomUUID().slice(0, 16) + 'Aa1!';
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: user.email.toLowerCase(),
            password: tempPassword,
            email_confirm: true,
          });
          
          if (!createError && newUser?.user) {
            const { db } = await import("./db");
            const { sql } = await import("drizzle-orm");
            if (db) {
              await db.execute(
                sql`UPDATE users SET supabase_user_id = ${newUser.user.id} WHERE id = ${user.id}`
              );
              console.log(`[Webhook Safeguard] Created and linked new Supabase user ${newUser.user.id} for local user ${user.id}`);
              
              // Send password reset email so user can set their password
              const { supabase } = await import("./supabase");
              await supabase.auth.resetPasswordForEmail(user.email.toLowerCase());
              console.log(`[Webhook Safeguard] Sent password reset email to ${user.email}`);
            }
          }
        }
      } catch (safeguardError) {
        console.error(`[Webhook Safeguard] Failed to link Supabase account for user ${user.id}:`, safeguardError);
      }
    }
  }

  static async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : (subscription.customer as any)?.id;
    
    if (!customerId) return;
    
    const user = await storage.getUserByStripeCustomerId(customerId);
    if (!user) return;
    
    // Clear subscription fields when subscription is deleted
    await storage.updateUserSubscription(user.id, {
      stripeSubscriptionId: undefined,
      stripePriceId: undefined,
      subscriptionStatus: 'canceled',
      currentPeriodEnd: undefined,
      plan: 'starter',
      cancelAtPeriodEnd: 0,
    });
    
    console.log(`Subscription ${subscription.id} deleted for user ${user.id} - reverted to starter plan and cleared subscription data`);
  }
}
