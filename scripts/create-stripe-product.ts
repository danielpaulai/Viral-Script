import Stripe from 'stripe';

async function createStripeProduct() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  
  console.log('Creating Stripe product and price...');
  
  // Create the product
  const product = await stripe.products.create({
    name: 'Viral Script Writer Pro',
    description: 'Unlimited viral script generation with AI-powered hooks, CTAs, and deep research mode',
    metadata: {
      app: 'viral-script-writer'
    }
  });
  
  console.log('Product created:', product.id);
  
  // Create the $19.99/month price with 7-day trial
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 1999, // $19.99 in cents
    currency: 'usd',
    recurring: {
      interval: 'month'
    },
    metadata: {
      plan: 'pro'
    }
  });
  
  console.log('Price created:', price.id);
  console.log('\nStripe setup complete!');
  console.log('Product ID:', product.id);
  console.log('Price ID:', price.id);
  console.log('Price: $19.99/month');
}

createStripeProduct().catch(console.error);
