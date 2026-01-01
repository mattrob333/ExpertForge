
import React from 'react';
import { ExpertPersona, PersonalityDirection } from '../types';
import ExpertForm from './ExpertForm';

interface HomeDashboardProps {
  experts: ExpertPersona[];
  onSummon: (description: string, direction?: PersonalityDirection) => void;
  onSelectExpert: (expert: ExpertPersona) => void;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ experts, onSummon, onSelectExpert }) => {
  return (
    <div className="max-w-6xl w-full mx-auto px-4 py-12 space-y-20 animate-in fade-in duration-700">
      {/* Hero Header */}
      <header className="text-center space-y-4">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white">
          EXPERT<span className="text-cyan-500">FORGE</span>
        </h1>
        <p className="text-slate-400 font-mono text-xs uppercase tracking-[0.5em] opacity-80">
          Your AI Advisory Board
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto mt-6"></div>
      </header>

      {/* Your Experts Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-slate-500">YOUR EXPERTS</h2>
          <div className="h-px flex-1 bg-slate-800"></div>
          <span className="text-slate-600 font-mono text-[10px]">{experts.length} ACTIVE ADVISORS</span>
        </div>

        {experts.length === 0 ? (
          <div className="group relative bg-[#0f172a]/30 border border-dashed border-slate-800 rounded-3xl p-16 text-center transition-all hover:border-slate-700">
             <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
             <p className="text-slate-500 font-mono text-sm uppercase tracking-widest relative z-10">
               No experts summoned yet.
             </p>
             <p className="text-slate-600 text-xs mt-2 relative z-10">
               Define a role below to summon your first AI advisor.
             </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experts.map((expert) => (
              <button
                key={expert.id}
                onClick={() => onSelectExpert(expert)}
                className="group relative flex items-center gap-4 bg-[#0f172a] border border-slate-800 p-6 rounded-2xl text-left hover:border-cyan-500/50 hover:bg-slate-900 transition-all transform hover:-translate-y-1"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                  <img src={expert.avatarUrl} alt={expert.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold truncate group-hover:text-cyan-400 transition-colors">{expert.name}</h3>
                  <p className="text-slate-500 text-xs truncate uppercase font-mono tracking-tighter">{expert.essence}</p>
                </div>
                <span className="text-slate-700 group-hover:text-cyan-500 transition-colors">›</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Summon New Expert Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-slate-500">SUMMON NEW EXPERT</h2>
          <div className="h-px flex-1 bg-slate-800"></div>
        </div>
        <ExpertForm onSubmit={onSummon} />
      </section>
    </div>
  );
};

export default HomeDashboard;
