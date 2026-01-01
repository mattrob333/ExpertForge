
import React, { useState, useEffect } from 'react';
import { ExpertPersona } from '../types';

interface ExpertCardProps {
  persona: ExpertPersona;
  onRestart: () => void;
  onOpenTraining: () => void;
}

const ExpertCard: React.FC<ExpertCardProps> = ({ persona, onRestart, onOpenTraining }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'expertise' | 'thinking' | 'personality'>('overview');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'expertise', label: 'Expertise', icon: '🎯' },
    { id: 'thinking', label: 'Thinking', icon: '🧠' },
    { id: 'personality', label: 'Personality', icon: '🎭' },
  ];

  return (
    <div className={`max-w-[1200px] w-full mx-auto px-4 py-8 md:py-12 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="bg-[#0f172a]/90 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        
        {/* HEADER SECTION */}
        <div className="p-8 md:p-12 border-b border-slate-800/50">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="relative shrink-0 mx-auto md:mx-0">
              <div className="w-48 h-48 md:w-56 md:h-56 relative group">
                <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-cyan-400"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-cyan-400"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-cyan-400"></div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-cyan-400"></div>
                
                <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-cyan-500/30 glow-cyan p-1 bg-slate-900">
                  <img 
                    src={persona.avatarUrl || `https://picsum.photos/seed/${persona.name}/400/400`} 
                    alt={persona.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Identity */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold tracking-[0.2em] rounded-full border border-cyan-500/20">
                  KNOWLEDGE WORKER v2.0
                </span>
                <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-mono font-bold tracking-[0.2em] rounded-full border border-green-500/20 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  ONLINE
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent tracking-tight">
                {persona.name}
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-400 font-light leading-relaxed">
                {persona.essence}
              </p>

              <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                {[
                  { val: persona.stats.coreSkills, label: 'Core Skills', color: 'cyan' },
                  { val: persona.stats.mentalModels, label: 'Mental Models', color: 'purple' },
                  { val: persona.stats.coreBeliefs, label: 'Core Beliefs', color: 'pink' },
                  { val: persona.stats.influences, label: 'Influences', color: 'green' }
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2 min-w-[100px]">
                    <div className={`text-${stat.color}-400 text-2xl font-bold`}>{stat.val}</div>
                    <div className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 bg-slate-900/30 border-l-4 border-cyan-500 rounded-r-2xl p-6 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-purple-600"></div>
            <p className="text-slate-300 italic text-xl leading-relaxed">
              &quot;{persona.introduction}&quot;
            </p>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="px-8 md:px-12 bg-slate-900/20">
          <div className="flex overflow-x-auto no-scrollbar gap-2 md:gap-4 border-b border-slate-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-6 px-6 flex items-center gap-3 font-mono text-sm uppercase tracking-widest transition-all relative shrink-0 ${
                  activeTab === tab.id 
                    ? 'text-cyan-400' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-cyan-500 glow-cyan"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* MAIN CONTENT AREA */}
          <div className="flex-1 p-8 md:p-12 space-y-12">
            {activeTab === 'overview' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-700">
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">📜</span>
                    <h2 className="text-2xl font-bold">Core Beliefs</h2>
                  </div>
                  <div className="grid gap-4">
                    {persona.coreBeliefs.map((belief, i) => (
                      <div key={i} className="group flex items-start gap-4 p-5 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-cyan-500/50 transition-all">
                        <span className="text-cyan-500 mt-1">›</span>
                        <p className="text-slate-300 text-lg group-hover:text-white transition-colors">{belief}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-900/40 border-2 border-emerald-500/20 rounded-2xl p-6">
                    <h3 className="font-bold text-emerald-100 flex items-center gap-2 mb-4"><span>✨</span> Aesthetics</h3>
                    <p className="text-slate-400 leading-relaxed">{persona.aesthetics.beautiful}</p>
                  </div>
                  <div className="bg-slate-900/40 border-2 border-amber-500/20 rounded-2xl p-6">
                    <h3 className="font-bold text-amber-100 flex items-center gap-2 mb-4"><span>⚠️</span> Cringe</h3>
                    <p className="text-slate-400 leading-relaxed">{persona.aesthetics.cringe}</p>
                  </div>
                </div>
                {/* Restore Key Influences Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">📚</span>
                    <h2 className="text-2xl font-bold">Key Influences</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {persona.sidebar.influences.map((inf, i) => (
                      <span key={i} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-mono uppercase tracking-widest rounded-full border border-slate-700 hover:border-purple-500/50 hover:bg-purple-900/20 transition-all cursor-default">
                        {inf}
                      </span>
                    ))}
                  </div>
                </section>
              </div>
            )}
            {activeTab === 'expertise' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
                {[
                  { title: 'Deep Mastery', skills: persona.expertiseMap.deepMastery, color: 'cyan' },
                  { title: 'Working Knowledge', skills: persona.expertiseMap.workingKnowledge, color: 'purple' },
                  { title: 'Curiosity Edges', skills: persona.expertiseMap.curiosityEdges, color: 'pink' },
                  { title: 'Honest Limits', skills: persona.expertiseMap.honestLimits, color: 'amber' },
                ].map((tier, i) => (
                  <div key={i} className="space-y-3">
                    <h4 className={`font-mono text-xs uppercase tracking-widest text-${tier.color}-400`}>{tier.title}</h4>
                    <div className="flex flex-wrap gap-2">
                      {tier.skills.map((skill, j) => (
                        <span key={j} className={`px-4 py-2 rounded-full text-sm border bg-${tier.color}-500/5 border-${tier.color}-500/20 text-${tier.color}-200`}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'thinking' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-700">
                <section className="bg-purple-900/5 border border-purple-500/20 rounded-3xl p-8">
                  <h3 className="text-xl font-bold mb-4">🧠 How They See Problems</h3>
                  <p className="text-slate-300 text-lg leading-relaxed">{persona.thinking.problemApproach}</p>
                </section>
                <div className="grid md:grid-cols-2 gap-4">
                  {persona.thinking.mentalModels.map((model, i) => (
                    <div key={i} className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl">
                      <h4 className="font-bold text-purple-300 mb-2">🧩 {model.name}</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">{model.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'personality' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="bg-cyan-900/5 border border-cyan-500/20 rounded-2xl p-8">
                  <h4 className="font-mono text-[10px] tracking-widest text-cyan-500 mb-2 uppercase">Energy Profile</h4>
                  <p className="text-xl text-slate-200">{persona.personality.energyProfile}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(persona.personality.interactionModes).map(([key, text], i) => (
                    <div key={i} className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl">
                      <h5 className="font-bold text-cyan-400 mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1')}</h5>
                      <p className="text-slate-400 text-sm leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="w-full lg:w-[350px] bg-slate-900/40 border-l border-slate-800 p-8 space-y-10">
            <section className="space-y-6">
              <h3 className="font-bold text-white uppercase tracking-widest text-xs flex items-center gap-2"><span>🎯</span> Competency</h3>
              <div className="space-y-6">
                {persona.sidebar.competencies.map((comp, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest">
                      <span className="text-slate-400">{comp.label}</span>
                      <span className="text-cyan-400">{comp.level}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-1000 delay-500"
                        style={{ width: `${visible ? comp.level : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="space-y-4">
              <button 
                onClick={onOpenTraining}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20 transform hover:scale-[1.02] transition-all"
              >
                <span>🛠️</span> Training Dashboard
              </button>
              <button 
                onClick={onRestart}
                className="w-full py-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 font-bold flex items-center justify-center gap-2 transition-all"
              >
                <span>➕</span> Create New Agent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertCard;
