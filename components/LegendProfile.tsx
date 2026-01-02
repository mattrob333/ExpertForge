import React, { useState } from 'react';
import { Legend } from '../types';
import { LEGEND_CATEGORIES } from '../data/legends';

interface LegendProfileProps {
  legend: Legend;
  onBack: () => void;
  onDraft?: (legend: Legend) => void;
  onChat?: (legend: Legend) => void;
}

type Tab = 'overview' | 'mental-models' | 'decisions' | 'advise';

const LegendProfile: React.FC<LegendProfileProps> = ({
  legend,
  onBack,
  onDraft,
  onChat,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'mental-models', label: 'Mental Models', icon: '🧠' },
    { id: 'decisions', label: 'Famous Decisions', icon: '🏆' },
    { id: 'advise', label: "How They'd Advise", icon: '💬' },
  ];

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <button 
            onClick={onBack}
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          >
            ← Back to Legends
          </button>
        </div>
      </header>

      {/* Profile Header */}
      <div className="bg-gradient-to-b from-[#0f172a] to-[#020617] border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Photo */}
            <div className="relative">
              <div className="w-40 h-40 rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-lg shadow-amber-500/20">
                {legend.photo ? (
                  <img 
                    src={legend.photo} 
                    alt={legend.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                    {legend.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
              </div>
              <div className="absolute -top-2 -right-2 bg-amber-500 text-black px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                <span>⭐</span> LEGEND
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{legend.name}</h1>
              <p className="text-cyan-400 text-lg italic mt-1">"{legend.title}"</p>
              
              {/* Categories */}
              <div className="flex flex-wrap gap-2 mt-4">
                {legend.categories.map((cat) => {
                  const catInfo = LEGEND_CATEGORIES[cat];
                  return (
                    <span 
                      key={cat}
                      className="px-3 py-1 bg-slate-800 text-slate-300 text-sm rounded-full flex items-center gap-1.5"
                    >
                      <span>{catInfo.emoji}</span>
                      <span className="capitalize">{cat}</span>
                    </span>
                  );
                })}
              </div>

              {/* Quote */}
              {(legend.identity?.quote || legend.quote) && (
                <blockquote className="mt-6 pl-4 border-l-4 border-cyan-500 bg-slate-900/50 p-4 rounded-r-lg">
                  <p className="text-slate-300 italic leading-relaxed">"{legend.identity?.quote || legend.quote}"</p>
                </blockquote>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[73px] z-30 bg-[#0f172a] border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'text-cyan-400 border-cyan-400'
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Core Philosophy / Core Beliefs */}
            <section>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <span className="text-purple-400">⚡</span> CORE PHILOSOPHY
              </h2>
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
                <ul className="space-y-3">
                  {(legend.worldview?.coreBeliefs || legend.overview?.corePhilosophy || []).map((belief, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>{belief}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Known For / Deep Mastery */}
            <section>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <span className="text-cyan-400">📚</span> KNOWN FOR
              </h2>
              <div className="flex flex-wrap gap-2">
                {(legend.overview?.knownFor || legend.expertise?.deepMastery || []).map((item, i) => (
                  <span 
                    key={i}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-colors cursor-default"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </section>

            {/* Key Influences */}
            <section>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <span className="text-amber-400">🎯</span> KEY INFLUENCES
              </h2>
              <p className="text-slate-400">
                {(legend.worldview?.influences || legend.overview?.influences || []).join(' • ')}
              </p>
            </section>

            {/* What They Find Beautiful - NEW */}
            {legend.worldview?.whatTheyFindBeautiful && (
              <section>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <span className="text-emerald-400">✨</span> WHAT EXCELLENCE LOOKS LIKE
                </h2>
                <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
                  <p className="text-slate-300 leading-relaxed">{legend.worldview.whatTheyFindBeautiful}</p>
                </div>
              </section>
            )}

            {/* What Makes Them Cringe - NEW */}
            {legend.worldview?.whatMakesThemCringe && (
              <section>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <span className="text-red-400">😤</span> COMMON MISTAKES THEY HATE
                </h2>
                <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
                  <p className="text-slate-300 leading-relaxed">{legend.worldview.whatMakesThemCringe}</p>
                </div>
              </section>
            )}

            {/* Personality Quirks - NEW */}
            {legend.personality?.quirks && legend.personality.quirks.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <span className="text-purple-400">🎭</span> PERSONALITY QUIRKS
                </h2>
                <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
                  <ul className="space-y-3">
                    {legend.personality.quirks.map((quirk, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-300">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>{quirk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
          </div>
        )}

        {/* Mental Models Tab */}
        {activeTab === 'mental-models' && (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white">🧠 MENTAL MODELS</h2>
              <p className="text-slate-500 text-sm mt-1">How {legend.name.split(' ')[0]} approaches problems</p>
              {legend.thinkingStyle?.howTheySeeProblems && (
                <div className="mt-4 bg-slate-900/50 rounded-xl border border-slate-800 p-4">
                  <p className="text-slate-400 text-sm italic">"{legend.thinkingStyle.howTheySeeProblems}"</p>
                </div>
              )}
            </div>
            
            {(legend.thinkingStyle?.mentalModels || legend.mentalModels || []).map((model, i) => (
              <div 
                key={i}
                className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 hover:border-slate-700 transition-colors"
              >
                <h3 className="text-white font-bold text-lg uppercase tracking-wide mb-3">
                  {model.name}
                </h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  {model.description}
                </p>
                {model.application && (
                  <div className="mb-4 pl-4 border-l-2 border-emerald-500/50">
                    <p className="text-xs font-mono text-emerald-500 uppercase tracking-wider mb-1">How They Apply It</p>
                    <p className="text-slate-400 text-sm">{model.application}</p>
                  </div>
                )}
                {model.quote && (
                  <blockquote className="pl-4 border-l-2 border-cyan-500/50 text-slate-400 italic text-sm">
                    "{model.quote}"
                  </blockquote>
                )}
              </div>
            ))}

            {/* Reasoning Patterns - NEW */}
            {legend.thinkingStyle?.reasoningPatterns && (
              <div className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 rounded-xl border border-purple-500/30 p-6">
                <h3 className="text-white font-bold text-lg uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span>🎯</span> REASONING PATTERNS
                </h3>
                <p className="text-slate-300 leading-relaxed">{legend.thinkingStyle.reasoningPatterns}</p>
              </div>
            )}
          </div>
        )}

        {/* Famous Decisions Tab */}
        {activeTab === 'decisions' && (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white">🏆 FAMOUS DECISIONS</h2>
              <p className="text-slate-500 text-sm mt-1">Key moments that defined the {legend.name.split(' ')[1] || legend.name} approach</p>
            </div>
            
            {(legend.famousDecisions || []).length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No famous decisions documented yet.
              </div>
            ) : (legend.famousDecisions || []).map((decision, i) => (
              <div 
                key={i}
                className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden"
              >
                <div className="bg-slate-800/50 px-6 py-4 flex items-center justify-between">
                  <h3 className="text-white font-bold uppercase tracking-wide">
                    {decision.title}
                  </h3>
                  {decision.year && (
                    <span className="text-slate-500 text-sm font-mono">{decision.year}</span>
                  )}
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-1">Situation</p>
                    <p className="text-slate-300">{decision.situation}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-1">Decision</p>
                    <p className="text-slate-300">{decision.decision}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs font-mono text-cyan-500 uppercase tracking-wider mb-1">{legend.name.split(' ')[1] || legend.name} Logic</p>
                    <p className="text-cyan-300/80 italic">"{decision.logic}"</p>
                  </div>
                  
                  <div>
                    <p className="text-xs font-mono text-emerald-500 uppercase tracking-wider mb-1">Outcome</p>
                    <p className="text-emerald-300/80">{decision.outcome}</p>
                  </div>
                </div>

                {onChat && (
                  <div className="px-6 py-3 border-t border-slate-800 flex justify-end">
                    <button 
                      onClick={() => onChat(legend)}
                      className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors"
                    >
                      Discuss this decision →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* How They'd Advise Tab */}
        {activeTab === 'advise' && (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white">💬 HOW {(legend.name.split(' ')[1] || legend.name).toUpperCase()} WOULD ADVISE</h2>
              <p className="text-slate-500 text-sm mt-1">Get a sense of how {legend.name.split(' ')[0]} thinks by exploring sample scenarios</p>
            </div>
            
            {(legend.sampleQuestions || []).map((sq, i) => (
              <div 
                key={i}
                className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 hover:border-slate-700 transition-colors"
              >
                <p className="text-white font-medium mb-4">
                  "{sq.question}"
                </p>
                <div className="pl-4 border-l-2 border-cyan-500/30">
                  <p className="text-slate-400 leading-relaxed">
                    {sq.previewResponse}
                  </p>
                </div>
                {onChat && (
                  <button 
                    onClick={() => onChat(legend)}
                    className="mt-4 text-cyan-400 text-sm hover:text-cyan-300 transition-colors"
                  >
                    Continue this chat →
                  </button>
                )}
              </div>
            ))}

            {/* Ask Your Own */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
              <h3 className="text-white font-medium flex items-center gap-2 mb-4">
                <span>✍️</span> ASK YOUR OWN QUESTION
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder={`What would you like to ask ${legend.name.split(' ')[0]}?`}
                  className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button 
                  onClick={() => onChat && onChat(legend)}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg text-white font-medium hover:from-cyan-500 hover:to-purple-500 transition-all"
                >
                  Ask
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex gap-4">
          {onChat && (
            <button
              onClick={() => onChat(legend)}
              className="flex-1 py-3 border border-slate-600 rounded-xl text-slate-300 font-medium hover:border-cyan-500 hover:text-cyan-400 transition-all flex items-center justify-center gap-2"
            >
              <span>💬</span> Chat with {legend.name.split(' ')[0]}
            </button>
          )}
          {onDraft && (
            <button
              onClick={() => onDraft(legend)}
              className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl text-white font-bold hover:from-cyan-500 hover:to-purple-500 transition-all shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2"
            >
              <span>➕</span> Draft to Your Team
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegendProfile;
