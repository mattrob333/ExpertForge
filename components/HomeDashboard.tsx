
import React, { useState, useRef } from 'react';
import { ExpertPersona, PersonalityDirection, TeamContext } from '../types';
import { TeamContextWithId } from '../services/storageService';
import ExpertForm from './ExpertForm';
import { LEGENDS } from '../data/legends';
import HolographicLegendCard from './HolographicLegendCard';

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
  onOracleMode?: () => void;
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
  onOracleMode,
  onLogout,
}) => {
  const legendsScrollRef = useRef<HTMLDivElement>(null);

  const scrollLegends = (direction: 'left' | 'right') => {
    if (legendsScrollRef.current) {
      const scrollAmount = 360; // Roughly one card width + gap
      legendsScrollRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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

      {/* Featured Legends Section - Holographic Cards */}
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
        
        {/* Legends Carousel with Navigation */}
        <div className="relative">
          {/* Left Scroll Button */}
          <button
            onClick={() => scrollLegends('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-amber-500/50 hover:bg-slate-800 transition-all shadow-xl -translate-x-1/2"
            aria-label="Scroll left"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Cards Container */}
          <div 
            ref={legendsScrollRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide px-2"
          >
            {LEGENDS.slice(0, 5).map((legend) => (
              <HolographicLegendCard
                key={legend.id}
                legend={legend}
                onClick={() => onSelectLegend ? onSelectLegend(legend) : onGoLegends?.()}
              />
            ))}
          </div>

          {/* Right Scroll Button */}
          <button
            onClick={() => scrollLegends('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-amber-500/50 hover:bg-slate-800 transition-all shadow-xl translate-x-1/2"
            aria-label="Scroll right"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-slate-500">QUICK ACTIONS</h2>
          <div className="h-px flex-1 bg-slate-800"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {onGoChat && (
            <button
              onClick={onGoChat}
              className="group relative flex flex-col items-center gap-4 p-8 bg-[#0f172a]/40 backdrop-blur-md border border-slate-800 rounded-3xl hover:border-cyan-500/50 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 flex flex-col items-center gap-3">
                <span className="text-4xl group-hover:scale-110 transition-transform filter drop-shadow-lg">💬</span>
                <span className="text-slate-400 text-xs font-mono uppercase tracking-wider group-hover:text-cyan-400 transition-colors font-bold">Expert Chat</span>
              </div>
            </button>
          )}
          {onCreateTeam && (
            <button
              onClick={onCreateTeam}
              className="group relative flex flex-col items-center gap-4 p-8 bg-[#0f172a]/40 backdrop-blur-md border border-slate-800 rounded-3xl hover:border-purple-500/50 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 flex flex-col items-center gap-3">
                <span className="text-4xl group-hover:scale-110 transition-transform filter drop-shadow-lg">🎯</span>
                <span className="text-slate-400 text-xs font-mono uppercase tracking-wider group-hover:text-purple-400 transition-colors font-bold">Build Team</span>
              </div>
            </button>
          )}
          <button
            onClick={onGoLegends}
            className="group relative flex flex-col items-center gap-4 p-8 bg-[#0f172a]/40 backdrop-blur-md border border-slate-800 rounded-3xl hover:border-amber-500/50 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col items-center gap-3">
              <span className="text-4xl group-hover:scale-110 transition-transform filter drop-shadow-lg">🏆</span>
              <span className="text-slate-400 text-xs font-mono uppercase tracking-wider group-hover:text-amber-400 transition-colors font-bold">Legends</span>
            </div>
          </button>
          {onOracleMode && (
            <button
              onClick={onOracleMode}
              className="group relative flex flex-col items-center gap-4 p-8 bg-[#0f172a]/40 backdrop-blur-md border border-slate-800 rounded-3xl hover:border-fuchsia-500/50 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 via-purple-500/5 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 flex flex-col items-center gap-3">
                <span className="text-4xl group-hover:scale-110 transition-transform filter drop-shadow-lg">⚡</span>
                <span className="text-slate-400 text-xs font-mono uppercase tracking-wider group-hover:text-fuchsia-400 transition-colors font-bold">Oracle Mode</span>
              </div>
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
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                    <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">ORGANIZATION & TEAMS</h2>
                    <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">
                        Manage your AI workforce structures
                    </p>
                </div>
            </div>
          
            {onCreateTeam && (
                <button 
                onClick={onCreateTeam}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full text-white text-[10px] font-bold uppercase tracking-widest hover:shadow-lg hover:shadow-purple-500/20 transition-all transform hover:scale-105 border border-white/10"
                >
                + New Organization
                </button>
            )}
        </div>

        {teams.length === 0 ? (
          <div className="group relative bg-[#0f172a]/30 border border-dashed border-slate-800 rounded-3xl p-16 text-center transition-all hover:border-purple-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
            <div className="relative z-10">
                <div className="mb-6 opacity-30 group-hover:opacity-60 transition-opacity">
                     <svg className="w-24 h-24 mx-auto text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                     </svg>
                </div>
              <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">
                No organizations created yet
              </p>
              <p className="text-slate-600 text-xs mt-2 max-w-md mx-auto">
                Create a team to define a structure, roles, and assign AI agents to specific functions within your organization.
              </p>
              {onCreateTeam && (
                <button 
                  onClick={onCreateTeam}
                  className="mt-8 px-8 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-bold hover:bg-slate-700 transition-all"
                >
                  Create Your First Team
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team, i) => (
              <div
                key={i}
                className="group relative flex flex-col gap-4 bg-[#0f172a]/40 backdrop-blur-md border border-slate-800 p-8 rounded-3xl text-left hover:border-purple-500/50 transition-all cursor-pointer overflow-hidden shadow-lg hover:shadow-purple-900/10"
                onClick={() => onSelectTeam?.(team)}
              >
                {/* Gradient Top Border */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                {/* Background Glow */}
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/10 blur-3xl rounded-full group-hover:bg-purple-500/20 transition-all"></div>

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
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 bg-white/5 border border-white/10 text-slate-300 text-[10px] font-mono uppercase rounded-full backdrop-blur-sm">
                            {team.type}
                        </span>
                        {/* Org Chart Mini Icon */}
                        <svg className="w-5 h-5 text-slate-600 group-hover:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>

                    <h3 className="text-xl font-black text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-purple-200 transition-all">
                        {team.name}
                    </h3>
                    
                    <p className="text-slate-500 text-sm line-clamp-2 min-h-[2.5em] mb-6">
                        {team.description}
                    </p>

                    <div className="space-y-4">
                        <div className="h-px bg-gradient-to-r from-slate-800 to-transparent w-full"></div>
                        <div className="flex flex-wrap gap-2">
                            {team.needs.slice(0, 3).map((need) => (
                                <span key={need} className="px-2 py-1 bg-slate-900/50 border border-slate-800/50 text-slate-400 text-[10px] rounded uppercase font-bold tracking-tight">
                                {need}
                                </span>
                            ))}
                            {team.needs.length > 3 && (
                                <span className="px-2 py-1 text-slate-600 text-[10px] font-bold">
                                    +{team.needs.length - 3}
                                </span>
                            )}
                        </div>
                    </div>
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
