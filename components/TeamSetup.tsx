
import React, { useState } from 'react';
import { TeamContext } from '../types';
import { TeamContextWithId } from '../services/storageService';

interface TeamSetupProps {
  onSubmit: (context: TeamContext) => void;
  onCancel: () => void;
  teams?: TeamContextWithId[];
  onSelectTeam?: (team: TeamContextWithId) => void;
  onOracleMode?: () => void; // Wire directly to Oracle Mode for "Problem to Solve / Debate"
}

const TeamSetup: React.FC<TeamSetupProps> = ({ onSubmit, onCancel, teams = [], onSelectTeam, onOracleMode }) => {
  const [selectedType, setSelectedType] = useState<TeamContext['type'] | null>(null);
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [needs, setNeeds] = useState<string[]>([]);

  const contextTypes: { id: TeamContext['type']; icon: string; title: string; subtitle: string; comingSoon?: boolean; isOracle?: boolean }[] = [
    { id: 'business', icon: '🏢', title: 'My Real Business', subtitle: 'Strategic scaling & operations' },
    { id: 'project', icon: '🚀', title: "A Project I'm Working On", subtitle: 'Specific goals & delivery', comingSoon: true },
    { id: 'hypothetical', icon: '💡', title: 'Hypothetical Startup Idea', subtitle: 'Feasibility & ideation', comingSoon: true },
    { id: 'debate', icon: '🎭', title: 'Problem to Solve / Debate', subtitle: 'Multiple perspectives needed', isOracle: true },
  ];

  const industries = ['SaaS', 'E-commerce', 'Agency', 'Healthcare', 'Finance', 'AI/ML', 'Other'];
  const helpNeeds = ['Strategic Planning', 'Growth', 'Product', 'Operations', 'Fundraising', 'Legal', 'Marketing'];

  const toggleNeed = (need: string) => {
    setNeeds(prev => prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedType && name && description) {
      onSubmit({
        type: selectedType,
        name,
        industry,
        description,
        needs
      });
    }
  };

  return (
    <div className="max-w-5xl w-full mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      
      {/* Background Org Chart Graphic */}
      <div className="absolute top-0 right-0 w-[500px] h-[400px] -z-10 opacity-20 pointer-events-none">
        <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M250 50 L250 100" stroke="#06b6d4" strokeWidth="2" />
          <path d="M250 100 L100 150" stroke="#06b6d4" strokeWidth="2" />
          <path d="M250 100 L400 150" stroke="#06b6d4" strokeWidth="2" />
          <path d="M100 150 L50 250" stroke="#06b6d4" strokeWidth="2" />
          <path d="M100 150 L150 250" stroke="#06b6d4" strokeWidth="2" />
          <path d="M400 150 L350 250" stroke="#06b6d4" strokeWidth="2" />
          <path d="M400 150 L450 250" stroke="#06b6d4" strokeWidth="2" />
          
          <circle cx="250" cy="50" r="20" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
          <circle cx="100" cy="150" r="15" fill="#0f172a" stroke="#a855f7" strokeWidth="2" />
          <circle cx="400" cy="150" r="15" fill="#0f172a" stroke="#a855f7" strokeWidth="2" />
          
          <circle cx="50" cy="250" r="10" fill="#06b6d4" fillOpacity="0.5" />
          <circle cx="150" cy="250" r="10" fill="#06b6d4" fillOpacity="0.5" />
          <circle cx="350" cy="250" r="10" fill="#06b6d4" fillOpacity="0.5" />
          <circle cx="450" cy="250" r="10" fill="#06b6d4" fillOpacity="0.5" />
        </svg>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between mb-16">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-[10px] font-mono uppercase tracking-widest">
            <span>✨</span> Start New Organization
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight">
            FORGE YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">DREAM TEAM</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Define your mission and let our AI architect the perfect organizational structure, 
            complete with legendary advisors and specialized agents tailored to your goals.
          </p>
        </div>
        <button 
          onClick={onCancel}
          className="px-6 py-2 border border-slate-800 rounded-full text-slate-500 hover:text-white hover:border-slate-600 transition-all text-[10px] font-mono uppercase tracking-widest bg-slate-900/50"
        >
          Cancel
        </button>
      </header>

      {/* Step 1: Selector */}
      <section className="space-y-8 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contextTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                if (type.comingSoon) return; // Disabled for coming soon
                if (type.isOracle && onOracleMode) {
                  onOracleMode(); // Launch Oracle Mode directly
                  return;
                }
                setSelectedType(type.id);
              }}
              disabled={type.comingSoon}
              className={`p-8 border rounded-[2rem] text-left transition-all group relative overflow-hidden ${
                type.comingSoon 
                  ? 'bg-slate-900/30 border-slate-800/50 cursor-not-allowed opacity-60'
                  : type.isOracle
                    ? 'bg-gradient-to-br from-fuchsia-900/20 to-purple-900/20 border-fuchsia-500/30 hover:border-fuchsia-500/60 hover:shadow-lg hover:shadow-fuchsia-900/20'
                    : selectedType === type.id 
                      ? 'border-cyan-500 bg-cyan-900/10 shadow-2xl shadow-cyan-900/20' 
                      : 'bg-[#0f172a]/60 border-slate-800 hover:border-slate-600 hover:bg-[#0f172a]'
              }`}
            >
              {/* Coming Soon Badge */}
              {type.comingSoon && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-[10px] font-mono uppercase tracking-wider text-slate-400 z-20">
                  Coming Soon
                </div>
              )}
              {/* Oracle Mode Badge */}
              {type.isOracle && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-fuchsia-500/20 border border-fuchsia-500/40 rounded-full text-[10px] font-mono uppercase tracking-wider text-fuchsia-400 z-20">
                  ⚡ Oracle Mode
                </div>
              )}
              {selectedType === type.id && !type.comingSoon && !type.isOracle && (
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none"></div>
              )}
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 text-7xl transition-opacity grayscale group-hover:grayscale-0">
                {type.icon}
              </div>
              <div className="relative z-10 space-y-3">
                <span className="text-4xl block mb-2">{type.icon}</span>
                <h3 className={`text-xl font-bold ${
                  type.comingSoon ? 'text-slate-500' :
                  type.isOracle ? 'text-fuchsia-400' :
                  selectedType === type.id ? 'text-cyan-400' : 'text-white'
                }`}>
                  {type.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">{type.subtitle}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Step 2: Form */}
        {selectedType && (
          <form 
            onSubmit={handleSubmit} 
            className="space-y-8 pt-12 border-t border-slate-800 animate-in fade-in slide-in-from-top-4 duration-500"
          >
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">
                    {selectedType === 'business' ? 'Company Name' : 'Project/Goal Name'}
                  </label>
                  <input
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter name..."
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-cyan-500 transition-all text-lg font-medium placeholder:text-slate-700"
                  />
                </div>
                
                {(selectedType === 'business' || selectedType === 'project') && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1 block">Industry</label>
                    <div className="flex flex-wrap gap-2">
                      {industries.map(ind => (
                        <button
                          key={ind}
                          type="button"
                          onClick={() => setIndustry(ind)}
                          className={`px-4 py-2 rounded-full text-[10px] font-mono uppercase tracking-tighter border transition-all ${
                            industry === ind 
                              ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' 
                              : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'
                          }`}
                        >
                          {ind}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">
                  Describe what you&apos;re building / your main challenge
                </label>
                <textarea
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g., We are scaling a B2B SaaS platform and need to optimize our go-to-market strategy while maintaining high infrastructure stability..."
                  className="w-full h-32 bg-slate-900/50 border border-slate-800 rounded-2xl py-4 px-6 text-white resize-none focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-700 leading-relaxed"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1 block">Help Needed</label>
                <div className="flex flex-wrap gap-2">
                  {helpNeeds.map(need => (
                    <button
                      key={need}
                      type="button"
                      onClick={() => toggleNeed(need)}
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-mono uppercase tracking-widest border transition-all ${
                        needs.includes(need)
                          ? 'bg-purple-500/10 border-purple-500 text-purple-400 glow-purple shadow-lg shadow-purple-900/20' 
                          : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      {need}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 text-white font-bold py-6 rounded-2xl shadow-xl shadow-cyan-900/20 transform hover:scale-[1.01] active:scale-[0.99] transition-all text-xl flex items-center justify-center gap-3"
            >
              <span>🚀</span> Generate Optimal Team Structure
            </button>
          </form>
        )}
      </section>

      {/* Existing Teams Section */}
      {teams.length > 0 && (
        <section className="border-t border-slate-800 pt-16">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-slate-500">OR CONTINUE WITH EXISTING TEAM</h2>
            <div className="h-px flex-1 bg-slate-800"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => onSelectTeam?.(team)}
                className="group relative flex flex-col gap-3 bg-[#0f172a]/50 border border-slate-800 p-6 rounded-2xl text-left hover:border-purple-500/50 hover:bg-slate-900 transition-all overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex items-center justify-between w-full">
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">{team.name}</h3>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-mono uppercase rounded">
                    {team.type}
                  </span>
                </div>
                <p className="text-slate-500 text-sm line-clamp-1">{team.description}</p>
                
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-600 group-hover:text-slate-400">
                  <span>Enter Dashboard</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default TeamSetup;
