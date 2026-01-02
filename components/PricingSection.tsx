import React, { useState } from 'react';
import { PRICING_PLANS, PlanType, redirectToCheckout } from '../lib/stripe';

interface PricingSectionProps {
  onSelectPlan: (plan: PlanType) => void;
  userId?: string;
}

const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan, userId }) => {
  const [loading, setLoading] = useState<PlanType | null>(null);

  const handleSelectPlan = async (planType: PlanType) => {
    if (planType === 'free') {
      onSelectPlan(planType);
      return;
    }

    const plan = PRICING_PLANS[planType];
    if (!plan.priceId) {
      onSelectPlan(planType);
      return;
    }

    if (!userId) {
      // Redirect to auth first
      onSelectPlan(planType);
      return;
    }

    setLoading(planType);
    const { error } = await redirectToCheckout(plan.priceId, userId);
    if (error) {
      console.error('Checkout error:', error);
    }
    setLoading(null);
  };

  const plans = Object.entries(PRICING_PLANS) as [PlanType, typeof PRICING_PLANS[PlanType]][];

  return (
    <section className="py-32">
      <div className="max-w-5xl mx-auto px-4 space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-white">Choose Your Plan</h2>
          <p className="text-slate-500">Scale your board as your ambitions grow.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map(([planType, plan]) => (
            <div 
              key={planType} 
              className={`relative bg-slate-900/50 border ${
                plan.popular ? 'border-cyan-500/50 scale-105 z-10' : 'border-slate-800'
              } p-8 rounded-3xl flex flex-col space-y-8`}
            >
              {plan.popular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan-500 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-full">
                  Most Popular
                </span>
              )}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <div className="text-4xl font-black text-white">
                  ${plan.price}
                  <span className="text-lg font-normal text-slate-500">/mo</span>
                </div>
              </div>
              <ul className="space-y-4 flex-1">
                {plan.features.map((feature, j) => (
                  <li key={j} className="text-sm text-slate-400 flex items-center gap-2">
                    <span className={plan.popular ? 'text-cyan-500' : 'text-slate-500'}>✓</span> 
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleSelectPlan(planType)}
                disabled={loading === planType}
                className={`w-full py-4 rounded-xl font-bold transition-all disabled:opacity-50 ${
                  plan.popular 
                    ? 'bg-cyan-500 text-slate-900 hover:bg-cyan-400' 
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                {loading === planType 
                  ? 'Processing...' 
                  : planType === 'free' 
                    ? 'Start Building' 
                    : 'Upgrade Now'
                }
              </button>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <button 
            onClick={() => onSelectPlan('free')}
            className="text-cyan-400 font-mono text-sm uppercase tracking-widest hover:text-cyan-300 transition-colors"
          >
            Build Your Advisory Board Now →
          </button>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
