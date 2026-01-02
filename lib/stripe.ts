import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    console.warn('Stripe publishable key not configured');
    return Promise.resolve(null);
  }

  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
};

// Price IDs - these would come from your Stripe dashboard
export const PRICE_IDS = {
  pro: {
    monthly: 'price_pro_monthly', // Replace with actual Stripe price ID
    yearly: 'price_pro_yearly',
  },
  team: {
    monthly: 'price_team_monthly', // Replace with actual Stripe price ID
    yearly: 'price_team_yearly',
  },
};

export type PlanType = 'free' | 'pro' | 'team';
export type BillingInterval = 'monthly' | 'yearly';

export interface PricingPlan {
  name: string;
  price: number;
  priceId?: string;
  features: string[];
  popular?: boolean;
}

export const PRICING_PLANS: Record<PlanType, PricingPlan> = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      '1 Expert Advisor',
      'Standard Dossiers',
      'Community Access',
    ],
  },
  pro: {
    name: 'Pro',
    price: 29,
    priceId: PRICE_IDS.pro.monthly,
    features: [
      '5 Expert Advisors',
      'Legends Templates',
      'Unlimited Training',
      'Priority Inference',
    ],
    popular: true,
  },
  team: {
    name: 'Team',
    price: 99,
    priceId: PRICE_IDS.team.monthly,
    features: [
      'Unlimited Advisors',
      'Shared Library',
      'API Export',
      'Custom Training Sources',
    ],
  },
};

// For client-side Stripe Checkout (requires a backend endpoint)
// This is a placeholder - in production you'd call your backend
export async function createCheckoutSession(priceId: string, userId: string): Promise<string | null> {
  // In production, this would call your backend API
  // which would create a Stripe Checkout Session
  // and return the session URL or ID
  
  console.log('Creating checkout session for:', { priceId, userId });
  
  // Placeholder - replace with actual API call
  // const response = await fetch('/api/create-checkout-session', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ priceId, userId }),
  // });
  // const { sessionId } = await response.json();
  // return sessionId;
  
  return null;
}

// Redirect to Stripe Checkout
export async function redirectToCheckout(priceId: string, userId: string) {
  const stripe = await getStripe();
  
  if (!stripe) {
    console.error('Stripe not initialized');
    return { error: 'Stripe not configured' };
  }

  // In production, get session ID from your backend
  const sessionId = await createCheckoutSession(priceId, userId);
  
  if (!sessionId) {
    // For demo purposes, show an alert
    alert('Stripe checkout requires backend setup. Add your Stripe keys and backend endpoint.');
    return { error: 'Checkout session not created' };
  }

  const { error } = await stripe.redirectToCheckout({ sessionId });
  
  if (error) {
    console.error('Stripe redirect error:', error);
    return { error: error.message };
  }

  return { error: null };
}

// Customer portal for managing subscriptions
export async function redirectToCustomerPortal(customerId: string) {
  // In production, this would call your backend to create a portal session
  // const response = await fetch('/api/create-portal-session', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ customerId }),
  // });
  // const { url } = await response.json();
  // window.location.href = url;
  
  alert('Customer portal requires backend setup. Add your Stripe webhook handler.');
}
