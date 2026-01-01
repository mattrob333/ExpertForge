
import React, { useState } from 'react';
import { TeamContext } from '../types';

interface TeamSetupProps {
  onSubmit: (context: TeamContext) => void;
  onCancel: () => void;
}

const TeamSetup: React.FC<TeamSetupProps> = ({ onSubmit, onCancel }) => {
  const [selectedType, setSelectedType] = useState<TeamContext['type'] | null>(null);
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [needs, setNeeds] = useState<string[]>([]);

  const contextTypes: { id: TeamContext['type']; icon: string; title: string; subtitle: string }[] = [
    { id: 'business', icon: '🏢', title: 'My Real Business', subtitle: 'Strategic scaling & operations' },
    { id: 'project', icon: '🚀', title: "A Project I'm Working On", subtitle: 'Specific goals & delivery' },
    { id: 'hypothetical', icon: '💡', title: 'Hypothetical Startup Idea', subtitle: 'Feasibility & ideation' },
    { id: 'debate', icon: '🎭', title: 'Problem to Solve / Debate', subtitle: 'Multiple perspectives needed' },
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
    <div className="max-w-4xl w-full mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header */}
      <header className="flex items-center justify-between mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white flex items-center gap-3">
            <span className="text-3xl">🎯</span> CREATE YOUR TEAM
          </h1>
          <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">
            What will this advisory team help you with?
          </p>
        </div>
        <button 
          onClick={onCancel}
          className="px-6 py-2 border border-slate-800 rounded-full text-slate-500 hover:text-white hover:border-slate-600 transition-all text-[10px] font-mono uppercase tracking-widest"
        >
          Cancel
        </button>
      </header>

      {/* Step 1: Selector */}
      <section className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contextTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`p-8 bg-[#0f172a]/40 border rounded-[2rem] text-left transition-all group relative overflow-hidden ${
                selectedType === type.id 
                  ? 'border-cyan-500 bg-cyan-500/5 glow-cyan' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 text-6xl transition-opacity">
                {type.icon}
              </div>
              <div className="relative z-10 space-y-2">
                <span className="text-4xl block mb-4">{type.icon}</span>
                <h3 className={`text-xl font-bold ${selectedType === type.id ? 'text-cyan-400' : 'text-white'}`}>
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
            className="space-y-8 pt-8 border-t border-slate-800 animate-in fade-in slide-in-from-top-4 duration-500"
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
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-cyan-500 transition-all"
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
                          className={`px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-tighter border transition-all ${
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
                  className="w-full h-32 bg-slate-900/50 border border-slate-800 rounded-2xl py-4 px-6 text-white resize-none focus:outline-none focus:border-cyan-500 transition-all"
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
                      className={`px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-widest border transition-all ${
                        needs.includes(need)
                          ? 'bg-purple-500/10 border-purple-500 text-purple-400 glow-purple' 
                          : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'
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
              className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold py-5 rounded-2xl shadow-xl shadow-cyan-900/20 transform hover:scale-[1.02] active:scale-[0.98] transition-all text-lg"
            >
              Generate Optimal Team Structure →
            </button>
          </form>
        )}
      </section>
    </div>
  );
};

export default TeamSetup;
