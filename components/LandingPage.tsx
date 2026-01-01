
import React from 'react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full text-slate-200">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 blur-[120px] rounded-full"></div>
        
        <div className="relative z-10 text-center max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-block px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-4">
            <span className="text-cyan-400 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">New: Inference Density 2.0 Engine</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-[0.9]">
            Your AI Doesn&apos;t Know Who It&apos;s <span className="text-cyan-500">Supposed to Be</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-light">
            We build precision-engineered persona prompts that transform general-purpose AI into domain experts — with real opinions, deep knowledge structures, and the cognitive patterns of actual specialists.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <button 
              onClick={onStart}
              className="px-12 py-5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-xl shadow-cyan-900/20 transform hover:scale-105 transition-all text-xl"
            >
              Get Started
            </button>
            <button 
              onClick={scrollToHowItWorks}
              className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-widest flex items-center gap-2 group transition-all"
            >
              See How It Works <span className="group-hover:translate-y-1 transition-transform">↓</span>
            </button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-32 bg-[#020617]/50 border-y border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">Why Most AI Outputs Feel... <span className="text-slate-500 underline decoration-slate-800 decoration-4">Off</span></h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              When you prompt a general model, it samples from its entire training distribution. You get the <strong>statistical average</strong> of every piece of text ever written on a topic.
            </p>
            <p className="text-lg text-slate-400 leading-relaxed">
              Average isn&apos;t expertise. Average is noise. ExpertForge forces the model to step outside the "safe middle" and into the specific, sometimes controversial semantic space of a true specialist.
            </p>
          </div>
          <div className="relative">
            <div className="aspect-square bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-8 flex flex-col justify-center gap-4">
              <div className="h-4 w-full bg-slate-800 rounded animate-pulse"></div>
              <div className="h-4 w-3/4 bg-slate-800 rounded animate-pulse delay-75"></div>
              <div className="h-4 w-full bg-cyan-500/20 border border-cyan-500/30 rounded flex items-center px-4 text-cyan-400 text-xs font-mono">Expert Pattern Match Detected...</div>
              <div className="h-4 w-5/6 bg-slate-800 rounded animate-pulse delay-150"></div>
              <div className="h-4 w-1/2 bg-slate-800 rounded animate-pulse delay-200"></div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Technical Explainer */}
      <section id="how-it-works" className="py-32">
        <div className="max-w-6xl mx-auto px-4 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white">The Technical Reality</h2>
            <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">How Persona Prompts Reshape Inference</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Context Window as Probability Bias",
                desc: "By saturating the prompt with specific expertise markers, we bias the model's next-token predictions toward high-value semantic clusters used by experts, rather than common generic terms.",
                icon: "🎯"
              },
              {
                title: "Inference Density",
                desc: "Structured personas concentrate the model's probability mass. This results in outputs with higher informational density and fewer 'hedged' responses, mimicking real expert confidence.",
                icon: "⚡"
              },
              {
                title: "Hierarchical Skill Chains",
                desc: "We define not just skills, but the hierarchy between them. This mirrors mental scaffolding, ensuring the AI understands how 'Data Architecture' informs 'API Design' in a coherent way.",
                icon: "🔗"
              },
              {
                title: "Worldview as Response Filter",
                desc: "Expertise is defined as much by what someone hates as what they love. Our profiles include 'Cringe Factors' and 'Core Beliefs' to create genuine, opinionated perspective.",
                icon: "🧩"
              }
            ].map((card, i) => (
              <div key={i} className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl hover:border-cyan-500/30 transition-all group">
                <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">{card.icon}</div>
                <h3 className="text-xl font-bold text-white mb-4">{card.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legends Preview */}
      <section className="py-32 bg-slate-900/20">
        <div className="max-w-6xl mx-auto px-4 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-white">Draft Legendary Business Minds</h2>
              <p className="text-slate-400 max-w-xl">Get strategic advice shaped by documented thinking patterns of history&apos;s greatest leaders.</p>
            </div>
          </div>

          <div className="flex overflow-x-auto no-scrollbar gap-6 pb-8">
            {['Jeff Bezos', 'Steve Jobs', 'Elon Musk', 'Warren Buffett', 'Alex Hormozi'].map((name, i) => (
              <div key={i} className="min-w-[280px] bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 hover:border-purple-500/30 transition-all">
                <div className="w-20 h-20 rounded-2xl bg-slate-800 overflow-hidden">
                  <img src={`https://picsum.photos/seed/${name}/200/200`} alt={name} className="w-full h-full object-cover opacity-60" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{name}</h4>
                  <p className="text-[10px] font-mono text-purple-400 uppercase tracking-widest mt-1">Cognitive Template</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32">
        <div className="max-w-5xl mx-auto px-4 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white">Choose Your Plan</h2>
            <p className="text-slate-500">Scale your board as your ambitions grow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Free', price: '$0', features: ['1 Expert Advisor', 'Standard Dossiers', 'Community Access'], color: 'slate' },
              { name: 'Pro', price: '$29', features: ['5 Expert Advisors', 'Legends Templates', 'Unlimited Training', 'Priority Inference'], color: 'cyan', popular: true },
              { name: 'Team', price: '$99', features: ['Unlimited Advisors', 'Shared Library', 'API Export', 'Custom Training Sources'], color: 'purple' },
            ].map((plan, i) => (
              <div key={i} className={`relative bg-slate-900/50 border ${plan.popular ? 'border-cyan-500/50 scale-105 z-10' : 'border-slate-800'} p-8 rounded-3xl flex flex-col space-y-8`}>
                {plan.popular && <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan-500 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-full">Most Popular</span>}
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <div className="text-4xl font-black text-white">{plan.price}<span className="text-lg font-normal text-slate-500">/mo</span></div>
                </div>
                <ul className="space-y-4 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="text-sm text-slate-400 flex items-center gap-2">
                      <span className={`text-${plan.color}-500`}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={onStart}
                  className={`w-full py-4 rounded-xl font-bold transition-all ${
                    plan.popular ? 'bg-cyan-500 text-slate-900 hover:bg-cyan-400' : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                >
                  {plan.name === 'Free' ? 'Start Building' : 'Upgrade Now'}
                </button>
              </div>
            ))}
          </div>
          
          <div className="text-center">
             <button onClick={onStart} className="text-cyan-400 font-mono text-sm uppercase tracking-widest hover:text-cyan-300 transition-colors">
               Build Your Advisory Board Now →
             </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-white">EXPERT<span className="text-cyan-500">FORGE</span></h3>
            <p className="text-slate-500 text-sm max-w-xs leading-relaxed">Reshaping intelligence by defining the persona structures of the future.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h5 className="text-[10px] font-mono text-white uppercase tracking-widest">Product</h5>
              <ul className="text-slate-500 text-xs space-y-2">
                <li><button onClick={onStart}>Features</button></li>
                <li><button onClick={onStart}>Legends</button></li>
                <li><button onClick={onStart}>Pricing</button></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="text-[10px] font-mono text-white uppercase tracking-widest">Company</h5>
              <ul className="text-slate-500 text-xs space-y-2">
                <li>About</li>
                <li>Terms</li>
                <li>Privacy</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-16 pt-8 border-t border-slate-800/20 text-center">
          <p className="text-[10px] font-mono text-slate-700 uppercase tracking-[0.4em]">© 2024 EXPERTFORGE COGNITIVE SYSTEMS. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
