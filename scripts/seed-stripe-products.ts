/**
 * Seed Stripe Products for Viral Script Writer
 * 
 * Run this script to create the 3 pricing tiers in Stripe:
 * - Starter: $19.99/mo
 * - Pro: $29.99/mo (popular)
 * - Ultimate: $99.99/mo
 * 
 * Usage: npx tsx scripts/seed-stripe-products.ts
 */

import { getUncachableStripeClient } from '../server/stripeClient';

async function seedProducts() {
  console.log('Creating Stripe products for Viral Script Writer...\n');
  
  const stripe = await getUncachableStripeClient();

  // Check if products already exist
  const existingProducts = await stripe.products.search({ 
    query: "metadata['app']:'viral-script-writer'" 
  });
  
  if (existingProducts.data.length > 0) {
    console.log('Products already exist. Skipping creation.');
    console.log('Existing products:');
    for (const product of existingProducts.data) {
      console.log(`  - ${product.name} (${product.id})`);
    }
    return;
  }

  // Create Starter plan
  console.log('Creating Starter plan...');
  const starterProduct = await stripe.products.create({
    name: 'Starter',
    description: 'Essential script generation for content creators',
    metadata: {
      app: 'viral-script-writer',
      tier: 'starter',
      scriptsPerMonth: '50',
    },
  });
  
  const starterPrice = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 1999, // $19.99
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { tier: 'starter' },
  });
  console.log(`  Product: ${starterProduct.id}`);
  console.log(`  Price: ${starterPrice.id} ($19.99/mo)\n`);

  // Create Pro plan
  console.log('Creating Pro plan...');
  const proProduct = await stripe.products.create({
    name: 'Pro',
    description: 'Knowledge Base powered scripts for your brand',
    metadata: {
      app: 'viral-script-writer',
      tier: 'pro',
      scriptsPerMonth: '100',
      popular: 'true',
    },
  });
  
  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 2999, // $29.99
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { tier: 'pro' },
  });
  console.log(`  Product: ${proProduct.id}`);
  console.log(`  Price: ${proPrice.id} ($29.99/mo)\n`);

  // Create Ultimate plan
  console.log('Creating Ultimate plan...');
  const ultimateProduct = await stripe.products.create({
    name: 'Ultimate',
    description: 'Full content strategy with competitor intelligence',
    metadata: {
      app: 'viral-script-writer',
      tier: 'ultimate',
      scriptsPerMonth: 'unlimited',
    },
  });
  
  const ultimatePrice = await stripe.prices.create({
    product: ultimateProduct.id,
    unit_amount: 9999, // $99.99
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { tier: 'ultimate' },
  });
  console.log(`  Product: ${ultimateProduct.id}`);
  console.log(`  Price: ${ultimatePrice.id} ($99.99/mo)\n`);

  console.log('Done! Products created successfully.');
  console.log('\nSave these Price IDs for your app:');
  console.log(`  STARTER_PRICE_ID: ${starterPrice.id}`);
  console.log(`  PRO_PRICE_ID: ${proPrice.id}`);
  console.log(`  ULTIMATE_PRICE_ID: ${ultimatePrice.id}`);
}

seedProducts().catch(console.error);
