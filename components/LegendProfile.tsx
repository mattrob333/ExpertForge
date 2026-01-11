import React, { useState } from 'react';
import { Legend } from '../types';
import { LEGEND_CATEGORIES } from '../data/legends';

interface LegendProfileProps {
  legend: Legend;
  onBack: () => void;
  onDraft?: (legend: Legend) => void;
  onChat?: (legend: Legend, initialMessage?: string) => void;
}

const LegendProfile: React.FC<LegendProfileProps> = ({
  legend,
  onBack,
  onDraft,
  onChat,
}) => {
  const [quickQuestion, setQuickQuestion] = useState('');
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const handleChatStart = () => {
    if (onChat) {
      onChat(legend, quickQuestion);
    }
  };

  const handleAskAbout = (topic: string) => {
    if (onChat) {
      onChat(legend, `Tell me more about your ${topic.toLowerCase()}`);
    }
  };

  // Reusable section wrapper with hover "Ask about this" overlay
  const SectionWithAsk: React.FC<{ id: string; topic: string; children: React.ReactNode }> = ({ id, topic, children }) => (
    <section 
      className="relative group/section"
      onMouseEnter={() => setHoveredSection(id)}
      onMouseLeave={() => setHoveredSection(null)}
    >
      {/* Hover overlay */}
      <div className={`absolute -top-2 -right-2 z-20 transition-all duration-200 ${hoveredSection === id ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
        <button
          onClick={() => handleAskAbout(topic)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold rounded-full shadow-lg shadow-cyan-900/40 flex items-center gap-2 transition-all hover:scale-105"
        >
          <span>💬</span> Ask {legend.name.split(' ')[0]} about this
        </button>
      </div>
      {children}
    </section>
  );

  const primaryCategory = legend.categories[0];
  const catInfo = LEGEND_CATEGORIES[primaryCategory];

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col lg:flex-row animate-in fade-in duration-500">
      
      {/* LEFT COLUMN: Immersive Hero & Identity (Sticky on Desktop) */}
      <aside className="lg:w-[450px] lg:h-screen lg:sticky lg:top-0 relative h-[60vh] flex-shrink-0 bg-slate-900 overflow-hidden group">
        {/* Full Background Image */}
        <div className="absolute inset-0">
          <img 
            src={legend.photo} 
            alt={legend.name}
            className="w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent opacity-90"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent"></div>
        </div>

        {/* Back Button (Absolute Top Left) */}
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 z-20 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white hover:bg-black/60 transition-all text-sm font-medium flex items-center gap-2"
        >
          <span>←</span> Back
        </button>

        {/* Identity Content (Bottom Aligned) */}
        <div className="absolute inset-x-0 bottom-0 p-8 z-10 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-xs font-bold text-white uppercase tracking-wider shadow-lg">
                {catInfo?.emoji} {catInfo?.label || primaryCategory}
              </span>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => <span key={i} className="text-amber-400 text-xs">★</span>)}
              </div>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black text-white leading-[0.9] tracking-tight drop-shadow-2xl mb-2">
              {legend.name}
            </h1>
            <p className="text-xl text-cyan-400 font-medium italic drop-shadow-md border-l-4 border-cyan-500 pl-4 py-1">
              {legend.title}
            </p>
          </div>

          {/* Key Actions in Sidebar */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            {onDraft && (
              <button
                onClick={() => onDraft(legend)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 group/btn"
              >
                <span className="group-hover/btn:scale-110 transition-transform">🤝</span> 
                Draft to Team
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* RIGHT COLUMN: Scrollable Content */}
      <main className="flex-1 relative">
        {/* Floating Chat Input (Sticky Bottom) */}
        <div className="fixed bottom-8 left-0 lg:left-[450px] right-0 z-50 flex justify-center px-4 pointer-events-none">
          <div className="w-full max-w-3xl pointer-events-auto">
            <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl shadow-black/50 ring-1 ring-white/5 flex gap-2 transition-all focus-within:ring-cyan-500/50 focus-within:bg-[#0f172a]/95 transform hover:scale-[1.01]">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
                AI
              </div>
              <input 
                type="text"
                value={quickQuestion}
                onChange={(e) => setQuickQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatStart()}
                placeholder={`Ask ${legend.name.split(' ')[0]} for advice...`}
                className="flex-1 bg-transparent border-none text-white placeholder-slate-400 px-2 focus:ring-0 text-lg"
                autoFocus
              />
              <button 
                onClick={handleChatStart}
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-cyan-900/30"
              >
                Chat
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-12 pb-32 space-y-16 max-w-4xl mx-auto">
          
          {/* Quote Section */}
          {(legend.identity?.quote || legend.quote) && (
            <section className="relative">
              <span className="absolute -top-6 -left-4 text-8xl text-slate-800 font-serif opacity-50">“</span>
              <h3 className="text-2xl lg:text-3xl font-medium text-slate-200 leading-relaxed italic relative z-10">
                {legend.identity?.quote || legend.quote}
              </h3>
            </section>
          )}

          {/* Core Philosophy / Beliefs */}
          <SectionWithAsk id="philosophy" topic="Core Philosophy">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <span className="text-2xl">⚡</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-wide">CORE PHILOSOPHY</h2>
            </div>
            
            <div className="grid gap-4">
              {(legend.worldview?.coreBeliefs || legend.overview?.corePhilosophy || []).map((belief, i) => (
                <div key={i} className="group flex gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/30 transition-all">
                  <span className="text-purple-400 font-bold text-lg mt-0.5">0{i + 1}</span>
                  <p className="text-lg text-slate-300 leading-relaxed group-hover:text-slate-200 transition-colors">
                    {belief}
                  </p>
                </div>
              ))}
            </div>
          </SectionWithAsk>

          {/* Mental Models Grid */}
          <SectionWithAsk id="mentalmodels" topic="Mental Models">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <span className="text-2xl">🧠</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-wide">MENTAL MODELS</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {(legend.thinkingStyle?.mentalModels || legend.mentalModels || []).map((model, i) => (
                <div key={i} className="bg-gradient-to-br from-slate-900 to-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/30 transition-all group">
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                    {model.name}
                  </h3>
                  <p className="text-slate-400 leading-relaxed mb-4">
                    {model.description}
                  </p>
                  {model.application && (
                    <div className="text-sm text-cyan-200/60 font-mono pt-4 border-t border-slate-800">
                      → {model.application}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionWithAsk>

          {/* Famous Decisions */}
          {(legend.famousDecisions && legend.famousDecisions.length > 0) && (
            <SectionWithAsk id="decisions" topic="Famous Decisions">
               <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <span className="text-2xl">🏆</span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-wide">FAMOUS DECISIONS</h2>
              </div>

              <div className="space-y-6">
                {legend.famousDecisions.map((decision, i) => (
                  <div key={i} className="bg-slate-900/30 rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
                      <h3 className="font-bold text-white">{decision.title}</h3>
                      <span className="text-xs font-mono text-slate-500 bg-black/30 px-2 py-1 rounded">{decision.year}</span>
                    </div>
                    <div className="p-6 grid md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">The Situation</h4>
                        <p className="text-slate-300">{decision.situation}</p>
                      </div>
                      <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/50 to-transparent"></div>
                        <div className="pl-6">
                          <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">The Call</h4>
                          <p className="text-white font-medium mb-2">{decision.decision}</p>
                          <p className="text-sm text-slate-400 italic">"{decision.logic}"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionWithAsk>
          )}

          {/* Quick Stats / Expertise */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {(legend.overview?.knownFor || legend.expertise?.deepMastery || []).map((item, i) => (
                <div key={i} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 text-center hover:bg-slate-800/50 transition-colors">
                  <span className="text-cyan-400 text-lg block mb-1">◆</span>
                  <span className="text-sm font-bold text-slate-300">{item}</span>
                </div>
             ))}
          </section>

        </div>
      </main>
    </div>
  );
};

export default LegendProfile;
