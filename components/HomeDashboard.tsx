
import React, { useState } from 'react';
import { ExpertPersona, PersonalityDirection, TeamContext } from '../types';
import { TeamContextWithId } from '../services/storageService';
import ExpertForm from './ExpertForm';
import { LEGENDS } from '../data/legends';

// Category color mapping
const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  marketing: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  sales: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  engineering: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  product: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  finance: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  operations: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  hr: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  legal: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
  consulting: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  strategy: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30' },
  design: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30' },
  data: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  leadership: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  general: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
};

// Infer category from expert data if not set
const inferCategory = (expert: ExpertPersona): string => {
  if (expert.category) return expert.category;
  
  const text = `${expert.essence} ${expert.role || ''} ${expert.expertiseMap?.deepMastery?.join(' ') || ''}`.toLowerCase();
  
  if (text.includes('marketing') || text.includes('brand') || text.includes('content') || text.includes('seo')) return 'marketing';
  if (text.includes('sales') || text.includes('revenue') || text.includes('account') || text.includes('deal')) return 'sales';
  if (text.includes('engineer') || text.includes('developer') || text.includes('technical') || text.includes('code')) return 'engineering';
  if (text.includes('product') || text.includes('roadmap') || text.includes('feature')) return 'product';
  if (text.includes('finance') || text.includes('financial') || text.includes('accounting') || text.includes('budget')) return 'finance';
  if (text.includes('operations') || text.includes('process') || text.includes('efficiency') || text.includes('logistics')) return 'operations';
  if (text.includes('hr') || text.includes('human resources') || text.includes('talent') || text.includes('recruiting')) return 'hr';
  if (text.includes('legal') || text.includes('compliance') || text.includes('contract') || text.includes('regulatory')) return 'legal';
  if (text.includes('consult') || text.includes('advisory') || text.includes('strategic advisor')) return 'consulting';
  if (text.includes('strategy') || text.includes('strategic') || text.includes('vision') || text.includes('planning')) return 'strategy';
  if (text.includes('design') || text.includes('ux') || text.includes('ui') || text.includes('creative')) return 'design';
  if (text.includes('data') || text.includes('analytics') || text.includes('insights') || text.includes('metrics')) return 'data';
  if (text.includes('ceo') || text.includes('executive') || text.includes('leadership') || text.includes('director') || text.includes('vp ') || text.includes('chief')) return 'leadership';
  
  return 'general';
};

interface HomeDashboardProps {
  experts: ExpertPersona[];
  teams?: TeamContextWithId[];
  onSummon: (description: string, direction?: PersonalityDirection) => void;
  onSelectExpert: (expert: ExpertPersona) => void;
  onDeleteExpert?: (expertId: string) => void;
  onCreateTeam?: () => void;
  onSelectTeam?: (team: TeamContextWithId) => void;
  onDeleteTeam?: (teamId: string) => void;
  onGoChat?: () => void;
  onGoLegends?: () => void;
  onSelectLegend?: (legend: typeof LEGENDS[0]) => void;
  onLogout?: () => void;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ 
  experts, 
  teams = [],
  onSummon, 
  onSelectExpert,
  onDeleteExpert,
  onCreateTeam,
  onSelectTeam,
  onDeleteTeam,
  onGoChat,
  onGoLegends,
  onSelectLegend,
  onLogout,
}) => {
  const [expertsExpanded, setExpertsExpanded] = useState(false);
  const INITIAL_EXPERTS_COUNT = 6;
  
  // Determine which experts to show
  const visibleExperts = expertsExpanded ? experts : experts.slice(0, INITIAL_EXPERTS_COUNT);
  const hasMoreExperts = experts.length > INITIAL_EXPERTS_COUNT;
  
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

      {/* Featured Legends Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-amber-500">🏆 LEGENDARY ADVISORS</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-amber-500/30 to-transparent"></div>
          <button
            onClick={onGoLegends}
            className="text-amber-400 text-[10px] font-mono uppercase tracking-wider hover:text-amber-300 transition-colors"
          >
            View All →
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {LEGENDS.slice(0, 5).map((legend) => (
            <button
              key={legend.id}
              onClick={() => onSelectLegend ? onSelectLegend(legend) : onGoLegends?.()}
              className="group flex-shrink-0 w-48 bg-gradient-to-br from-amber-900/20 to-slate-900/50 border border-amber-500/20 rounded-2xl p-4 hover:border-amber-500/50 transition-all"
            >
              <img 
                src={legend.photo} 
                alt={legend.name}
                className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-amber-500/30 group-hover:border-amber-500/50 transition-all"
              />
              <h3 className="text-white font-bold text-sm mt-3 text-center truncate group-hover:text-amber-400 transition-colors">{legend.name}</h3>
              <p className="text-amber-400/70 text-[10px] text-center truncate uppercase font-mono">{legend.title}</p>
            </button>
          ))}
        </div>
      </section>

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
            {visibleExperts.map((expert) => {
              const category = inferCategory(expert);
              const colors = categoryColors[category] || categoryColors.general;
              return (
              <div
                key={expert.id}
                className="group relative bg-[#0f172a] border border-slate-800 p-6 rounded-2xl hover:border-cyan-500/50 hover:bg-slate-900 transition-all transform hover:-translate-y-1"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl"></div>
                
                {/* Delete button */}
                {onDeleteExpert && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete ${expert.name}? This cannot be undone.`)) {
                        onDeleteExpert(expert.id);
                      }
                    }}
                    className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-center text-slate-500 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Delete expert"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                
                <button
                  onClick={() => onSelectExpert(expert)}
                  className="w-full flex items-center gap-4 text-left"
                >
                  <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                    <img src={expert.avatarUrl} alt={expert.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold truncate group-hover:text-cyan-400 transition-colors">{expert.name}</h3>
                    <p className="text-slate-500 text-xs truncate uppercase font-mono tracking-tighter">{expert.essence}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 ${colors.bg} ${colors.text} border ${colors.border} text-[9px] rounded uppercase font-bold`}>
                      {category}
                    </span>
                  </div>
                  <span className="text-slate-700 group-hover:text-cyan-500 transition-colors">›</span>
                </button>
              </div>
              );
            })}
          </div>
        )}
        
        {/* See More / Show Less Button */}
        {hasMoreExperts && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setExpertsExpanded(!expertsExpanded)}
              className="px-6 py-2 bg-slate-800/50 border border-slate-700 rounded-full text-slate-400 text-xs font-mono uppercase tracking-widest hover:border-cyan-500/50 hover:text-cyan-400 transition-all flex items-center gap-2"
            >
              {expertsExpanded ? (
                <>
                  <span>Show Less</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </>
              ) : (
                <>
                  <span>See {experts.length - INITIAL_EXPERTS_COUNT} More</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-slate-500">QUICK ACTIONS</h2>
          <div className="h-px flex-1 bg-slate-800"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {onGoChat && experts.length > 0 && (
            <button
              onClick={onGoChat}
              className="flex flex-col items-center gap-3 p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-cyan-500/50 transition-all group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">💬</span>
              <span className="text-slate-400 text-xs font-mono uppercase tracking-widest group-hover:text-cyan-400 transition-colors">Expert Chat</span>
            </button>
          )}
          {onCreateTeam && (
            <button
              onClick={onCreateTeam}
              className="flex flex-col items-center gap-3 p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-purple-500/50 transition-all group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">🎯</span>
              <span className="text-slate-400 text-xs font-mono uppercase tracking-widest group-hover:text-purple-400 transition-colors">Build Team</span>
            </button>
          )}
          <button
            onClick={onGoLegends}
            className="flex flex-col items-center gap-3 p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-amber-500/50 transition-all group"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">🏆</span>
            <span className="text-slate-400 text-xs font-mono uppercase tracking-widest group-hover:text-amber-400 transition-colors">Legendary Experts</span>
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex flex-col items-center gap-3 p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-red-500/50 transition-all group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">🚪</span>
              <span className="text-slate-400 text-xs font-mono uppercase tracking-widest group-hover:text-red-400 transition-colors">Log Out</span>
            </button>
          )}
        </div>
      </section>

      {/* Summon New Expert Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-slate-500">SUMMON NEW EXPERT</h2>
          <div className="h-px flex-1 bg-slate-800"></div>
        </div>
        <ExpertForm onSubmit={onSummon} />
      </section>

      {/* Your Teams Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-slate-500">YOUR TEAMS</h2>
          <div className="h-px flex-1 bg-slate-800"></div>
          {onCreateTeam && (
            <button 
              onClick={onCreateTeam}
              className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 text-[10px] font-mono uppercase tracking-widest hover:bg-purple-500/20 transition-all"
            >
              + Create Team
            </button>
          )}
        </div>

        {teams.length === 0 ? (
          <div className="group relative bg-[#0f172a]/30 border border-dashed border-slate-800 rounded-3xl p-12 text-center transition-all hover:border-purple-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
            <div className="relative z-10">
              <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">
                No teams created yet.
              </p>
              <p className="text-slate-600 text-xs mt-2">
                Build an AI-powered org chart to tackle your objectives.
              </p>
              {onCreateTeam && (
                <button 
                  onClick={onCreateTeam}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl text-white text-sm font-bold hover:from-purple-500 hover:to-cyan-500 transition-all shadow-lg shadow-purple-900/20"
                >
                  Create Your First Team
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team, i) => (
              <div
                key={i}
                className="group relative flex flex-col gap-4 bg-[#0f172a] border border-slate-800 p-6 rounded-2xl text-left hover:border-purple-500/50 hover:bg-slate-900 transition-all cursor-pointer"
                onClick={() => onSelectTeam?.(team)}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl"></div>
                
                {/* Delete button */}
                {onDeleteTeam && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete team "${team.name}"? This cannot be undone.`)) {
                        onDeleteTeam(team.id);
                      }
                    }}
                    className="absolute top-3 right-3 p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Delete team"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                
                <div className="flex items-center justify-between pr-8">
                  <h3 className="text-white font-bold text-lg">{team.name}</h3>
                  <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-mono uppercase rounded-full">
                    {team.type}
                  </span>
                </div>
                <p className="text-slate-500 text-sm line-clamp-2">{team.description}</p>
                <div className="flex flex-wrap gap-2">
                  {team.needs.slice(0, 3).map((need) => (
                    <span key={need} className="px-2 py-1 bg-slate-800 text-slate-500 text-[10px] rounded">
                      {need}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default HomeDashboard;
