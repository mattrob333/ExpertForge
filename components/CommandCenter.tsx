
import React from 'react';
import { ExpertPersona } from '../types';

interface CommandCenterProps {
  experts: ExpertPersona[];
  onSelectExpert: (expert: ExpertPersona) => void;
  onCreateNew: () => void;
  onLogout: () => void;
  onGoHome: () => void;
  onGoChat: () => void;
  onGoTeams: () => void;
  onGoTeamSetup: () => void;
}

const CommandCenter: React.FC<CommandCenterProps> = ({ 
  experts, 
  onSelectExpert, 
  onCreateNew, 
  onLogout,
  onGoHome,
  onGoChat,
  onGoTeams,
  onGoTeamSetup
}) => {
  const roles = [
    { id: 'Strategy', label: 'Strategy', row: 1 },
    { id: 'Product', label: 'Product', row: 1 },
    { id: 'Operations', label: 'Operations', row: 1 },
    { id: 'Growth', label: 'Growth', row: 2 },
    { id: 'Technical', label: 'Technical', row: 2 },
  ];

  // For demonstration, we'll just fill slots with the first few experts if not specifically assigned
  const getExpertInSlot = (roleId: string, index: number) => {
    // If we had a role assignment logic, we'd use it here.
    // For now, let's just show placeholders if we don't have enough experts.
    return experts.find(e => e.role === roleId) || (index < experts.length ? experts[index] : null);
  };

  const filledCount = experts.length;
  const legendCount = 0; // Placeholder

  return (
    <div className="w-full flex flex-col h-screen bg-[#020617] text-slate-200">
      {/* HEADER BAR */}
      <header className="h-16 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onGoHome}>
          <div className="w-2 h-2 bg-cyan-500 rounded-full glow-cyan"></div>
          <span className="font-mono text-lg font-black tracking-widest uppercase text-white">EXPERTFORGE</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: 'Command Center', active: true, action: onGoHome },
            { label: 'Legends', active: false, action: () => {} },
            { label: 'My Experts', active: false, action: () => {} },
            { label: 'Teams', active: false, action: onGoTeams },
            { label: 'Team Chat', active: false, action: onGoChat }
          ].map((tab, i) => (
            <button 
              key={i}
              onClick={tab.action}
              className={`text-[10px] font-mono uppercase tracking-[0.2em] font-bold transition-all relative py-5 ${
                tab.active ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
              {tab.active && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500 glow-cyan"></div>}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-all">
            <span className="text-xs">👤</span>
          </button>
          <button onClick={onLogout} className="text-[10px] font-mono text-slate-500 hover:text-red-400 transition-colors uppercase font-bold tracking-widest">Logout</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-8 relative flex flex-col">
          <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>
          
          <div className="relative z-10 flex-1 flex flex-col">
            <header className="mb-12 flex items-end justify-between">
              <div>
                <h2 className="text-sm font-mono text-slate-500 uppercase tracking-[0.4em] font-bold mb-2">Operational Formation</h2>
                <h1 className="text-4xl font-black text-white">YOUR ADVISORY BOARD</h1>
              </div>
              <button 
                onClick={onGoTeamSetup} 
                className="px-5 py-2 border border-cyan-500/30 rounded-full text-[10px] font-mono text-cyan-400 hover:text-cyan-300 hover:border-cyan-500 transition-all uppercase tracking-widest font-bold"
              >
                + Create New Team
              </button>
            </header>

            {/* FORMATION LAYOUT */}
            <div className="flex-1 flex flex-col justify-center items-center gap-16 py-12">
              {/* Row 1: Strategy, Product, Operations */}
              <div className="flex gap-12 md:gap-24 justify-center items-center w-full">
                {roles.filter(r => r.row === 1).map((role, i) => {
                  const expert = getExpertInSlot(role.id, i);
                  return (
                    <div key={role.id} className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-700">
                      <div 
                        onClick={() => expert ? onSelectExpert(expert) : onCreateNew()}
                        className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center relative group
                        ${expert 
                          ? 'border-cyan-500/50 glow-cyan bg-slate-900' 
                          : 'border-dashed border-slate-800 bg-[#0f172a]/20 hover:border-slate-700'
                        }`}
                      >
                        {expert ? (
                          <img src={expert.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="text-2xl text-slate-800 group-hover:text-slate-600 transition-colors">+</span>
                        )}
                        
                        {/* Status Light */}
                        {expert && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#020617] rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 rounded-full transition-opacity"></div>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-[10px] font-mono text-cyan-500 font-bold uppercase tracking-widest">{role.label}</p>
                        <p className="text-xs text-slate-400 font-medium">{expert ? expert.name : '(Empty Slot)'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Row 2: Growth, Technical */}
              <div className="flex gap-12 md:gap-32 justify-center items-center w-full">
                {roles.filter(r => r.row === 2).map((role, i) => {
                  const expert = getExpertInSlot(role.id, i + 3); // Simple mapping
                  return (
                    <div key={role.id} className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-700 delay-200">
                      <div 
                        onClick={() => expert ? onSelectExpert(expert) : onCreateNew()}
                        className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center relative group
                        ${expert 
                          ? 'border-purple-500/50 glow-purple bg-slate-900' 
                          : 'border-dashed border-slate-800 bg-[#0f172a]/20 hover:border-slate-700'
                        }`}
                      >
                        {expert ? (
                          <img src={expert.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="text-2xl text-slate-800 group-hover:text-slate-600 transition-colors">+</span>
                        )}

                        {expert && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#020617] rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                        )}
                        <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 rounded-full transition-opacity"></div>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-[10px] font-mono text-purple-500 font-bold uppercase tracking-widest">{role.label}</p>
                        <p className="text-xs text-slate-400 font-medium">{expert ? expert.name : '(Empty Slot)'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOTTOM ACTIONS */}
            <div className="flex flex-wrap justify-center gap-4 pt-12">
              <button className="px-8 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold font-mono tracking-widest hover:border-slate-700 transition-all flex items-center gap-3 group">
                <span className="text-lg group-hover:scale-125 transition-transform">🏆</span> BROWSE LEGENDS
              </button>
              <button 
                onClick={onCreateNew}
                className="px-8 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold font-mono tracking-widest hover:border-slate-700 transition-all flex items-center gap-3 group"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">✨</span> CREATE CUSTOM EXPERT
              </button>
              <button 
                onClick={onGoTeamSetup}
                className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-2xl text-xs font-bold font-mono tracking-widest shadow-xl shadow-cyan-900/20 transform hover:scale-[1.05] transition-all flex items-center gap-3"
              >
                <span className="text-lg">🎯</span> CREATE NEW TEAM
              </button>
              <button 
                onClick={onGoChat}
                className="px-8 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold font-mono tracking-widest hover:border-slate-700 transition-all flex items-center gap-3 group"
              >
                <span className="text-lg group-hover:scale-125 transition-transform">💬</span> OPEN TEAM CHAT
              </button>
            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR: ROSTER */}
        <aside className="hidden lg:flex w-80 border-l border-slate-800 bg-[#0f172a]/30 flex-col shrink-0">
          <div className="p-8 flex flex-col h-full space-y-8">
            <header>
              <h2 className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.4em] font-bold mb-1">Dossier Access</h2>
              <h3 className="text-xl font-bold text-white">YOUR TEAM</h3>
            </header>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {experts.length === 0 ? (
                <div className="text-center py-12 opacity-40">
                  <p className="text-xs font-mono uppercase tracking-widest mb-2">No active roster</p>
                  <p className="text-[10px]">Draft advisors to begin operations.</p>
                </div>
              ) : (
                experts.map((expert) => (
                  <button
                    key={expert.id}
                    onClick={() => onSelectExpert(expert)}
                    className="w-full p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center gap-3 hover:border-cyan-500/40 hover:bg-slate-900 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700">
                      <img src={expert.avatarUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-white text-xs font-bold truncate group-hover:text-cyan-400 transition-colors">{expert.name}</p>
                      <p className="text-slate-500 text-[9px] uppercase tracking-tighter truncate">{expert.essence}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  </button>
                ))
              )}
            </div>

            <div className="pt-8 space-y-6 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Legends</p>
                  <p className="text-xl font-black text-white">{legendCount}</p>
                </div>
                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Custom</p>
                  <p className="text-xl font-black text-white">{filledCount}</p>
                </div>
              </div>

              <button 
                onClick={onCreateNew}
                className="w-full py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-xl text-[10px] font-black font-mono tracking-[0.2em] uppercase transition-all shadow-lg shadow-cyan-900/20"
              >
                Draft New Advisor
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CommandCenter;
