
import React, { useState, useEffect } from 'react';
import Background from './components/Background';
import LoadingScreen from './components/LoadingScreen';
import ExpertCard from './components/ExpertCard';
import TrainingDashboard from './components/TrainingDashboard';
import HomeDashboard from './components/HomeDashboard';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import CommandCenter from './components/CommandCenter';
import TeamChat from './components/TeamChat';
import TeamSetup from './components/TeamSetup';
import TeamStructurePreview from './components/TeamStructurePreview';
import { ExpertPersona, AppState, PersonalityDirection, TeamContext, TeamStructure } from './types';
import { generateExpertPersona, generateTeamStructure } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('landing');
  const [experts, setExperts] = useState<ExpertPersona[]>([]);
  const [currentPersona, setCurrentPersona] = useState<ExpertPersona | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [teamContext, setTeamContext] = useState<TeamContext | null>(null);
  const [teamStructure, setTeamStructure] = useState<TeamStructure | null>(null);

  // Persistence
  useEffect(() => {
    const savedExperts = localStorage.getItem('expertforge_experts');
    const savedContext = localStorage.getItem('expertforge_team_context');
    const savedStructure = localStorage.getItem('expertforge_team_structure');
    if (savedExperts) {
      try { setExperts(JSON.parse(savedExperts)); } catch (e) { console.error("Failed to load experts", e); }
    }
    if (savedContext) {
      try { setTeamContext(JSON.parse(savedContext)); } catch (e) { console.error("Failed to load context", e); }
    }
    if (savedStructure) {
      try { setTeamStructure(JSON.parse(savedStructure)); } catch (e) { console.error("Failed to load structure", e); }
    }
  }, []);

  useEffect(() => {
    if (experts.length > 0) localStorage.setItem('expertforge_experts', JSON.stringify(experts));
    if (teamContext) localStorage.setItem('expertforge_team_context', JSON.stringify(teamContext));
    if (teamStructure) localStorage.setItem('expertforge_team_structure', JSON.stringify(teamStructure));
  }, [experts, teamContext, teamStructure]);

  const handleGenerate = async (description: string, direction?: PersonalityDirection) => {
    setState('loading');
    setError(null);
    try {
      const result = await generateExpertPersona(description, direction);
      setExperts(prev => [...prev, result]);
      setCurrentPersona(result);
      setState('display');
    } catch (err) {
      console.error(err);
      setError("The digital oracle encountered a rift. Please try again.");
      setState('home');
    }
  };

  const handleTeamSetupSubmit = async (context: TeamContext) => {
    setTeamContext(context);
    setState('loading');
    setError(null);
    try {
      const structure = await generateTeamStructure(context);
      setTeamStructure(structure);
      setState('structure-preview');
    } catch (err) {
      console.error(err);
      setError("Failed to generate team formation.");
      setState('team-setup');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectExpert = (expert: ExpertPersona) => {
    setCurrentPersona(expert);
    setState('display');
  };

  const goHome = () => {
    setCurrentPersona(null);
    setError(null);
    setState('home');
  };

  const goDashboard = () => {
    setCurrentPersona(null);
    setError(null);
    setState('dashboard');
  };

  const goChat = () => {
    setCurrentPersona(null);
    setError(null);
    setState('chat');
  };

  const goTeams = () => {
    setCurrentPersona(null);
    setError(null);
    setState('teams');
  };

  const goTeamSetup = () => {
    setCurrentPersona(null);
    setError(null);
    setState('team-setup');
  }

  const startAuthFlow = () => {
    setState('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = () => {
    if (!teamContext) {
      setState('team-setup');
    } else {
      setState('dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setState('landing');
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-start">
      <Background />
      
      <main className="w-full flex-1 flex flex-col items-center justify-start">
        {state === 'landing' && <LandingPage onStart={startAuthFlow} />}

        {state === 'auth' && (
          <div className="pt-24 w-full">
            <AuthPage 
              onAuthSuccess={handleAuthSuccess} 
              onGoLanding={() => setState('landing')} 
            />
          </div>
        )}

        {state === 'team-setup' && (
          <div className="pt-24 w-full">
            <TeamSetup 
              onSubmit={handleTeamSetupSubmit} 
              onCancel={() => setState('dashboard')} 
            />
          </div>
        )}

        {state === 'structure-preview' && teamStructure && (
          <div className="pt-24 w-full">
            <TeamStructurePreview 
              structure={teamStructure}
              context={teamContext}
              onAccept={() => setState('dashboard')}
              onCustomize={() => setState('team-setup')}
              onAutoBuild={() => setState('loading')} // Mocking building legends
              onBack={() => setState('team-setup')}
            />
          </div>
        )}

        {state === 'teams' && (
          <div className="w-full h-screen flex flex-col pt-16 bg-[#020617]">
             <header className="fixed top-0 left-0 right-0 h-16 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-between px-6 z-30">
              <div className="flex items-center gap-3 cursor-pointer" onClick={goDashboard}>
                <div className="w-2 h-2 bg-cyan-500 rounded-full glow-cyan"></div>
                <span className="font-mono text-sm font-black tracking-widest uppercase text-white">EXPERTFORGE</span>
                <span className="text-slate-600 text-[10px] font-mono ml-2">TEAMS</span>
              </div>
              <button onClick={goDashboard} className="text-[10px] font-mono text-slate-500 hover:text-white transition-colors uppercase tracking-widest font-bold">Back to Command</button>
            </header>
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-4xl mx-auto space-y-12 py-12">
                <div className="flex items-center justify-between">
                  <h1 className="text-4xl font-black text-white">Your Teams</h1>
                  <button onClick={goTeamSetup} className="px-6 py-2 bg-cyan-600 text-white rounded-full text-xs font-bold hover:bg-cyan-500 transition-all">+ Create New Team</button>
                </div>
                {teamContext ? (
                  <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-white">{teamContext.name}</h3>
                      <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono uppercase rounded-full">{teamContext.type}</span>
                    </div>
                    <p className="text-slate-400">{teamContext.description}</p>
                    <div className="flex gap-2">
                       {teamContext.needs.map(n => <span key={n} className="px-3 py-1 bg-slate-800 text-slate-500 text-[10px] rounded-full">{n}</span>)}
                    </div>
                    <button onClick={goDashboard} className="mt-4 text-cyan-500 font-mono text-[10px] uppercase tracking-widest hover:text-cyan-400 transition-colors">Enter Boardroom →</button>
                  </div>
                ) : (
                  <div className="p-16 border border-dashed border-slate-800 rounded-3xl text-center">
                    <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">No teams defined yet.</p>
                    <button onClick={goTeamSetup} className="mt-4 text-cyan-500 font-mono text-xs uppercase tracking-widest hover:underline">Setup your first team now</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {state === 'dashboard' && (
          <CommandCenter 
            experts={experts}
            onSelectExpert={selectExpert}
            onCreateNew={() => setState('home')}
            onLogout={handleLogout}
            onGoHome={goDashboard}
            onGoChat={goChat}
            onGoTeams={goTeams}
            onGoTeamSetup={goTeamSetup}
          />
        )}

        {state === 'chat' && (
          <div className="w-full h-screen flex flex-col pt-16">
            <header className="fixed top-0 left-0 right-0 h-16 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-between px-6 z-30">
              <div className="flex items-center gap-3 cursor-pointer" onClick={goDashboard}>
                <div className="w-2 h-2 bg-cyan-500 rounded-full glow-cyan"></div>
                <span className="font-mono text-sm font-black tracking-widest uppercase text-white">EXPERTFORGE</span>
                <span className="text-slate-600 text-[10px] font-mono ml-2">TEAM CHAT</span>
              </div>
              <button onClick={goDashboard} className="text-[10px] font-mono text-slate-500 hover:text-white transition-colors uppercase tracking-widest font-bold">Back to Command</button>
            </header>
            <TeamChat experts={experts} onClose={goDashboard} onBrowseLegends={goDashboard} />
          </div>
        )}

        {state === 'home' && (
          <div className="pt-24 w-full">
            <HomeDashboard 
              experts={experts} 
              onSummon={handleGenerate} 
              onSelectExpert={selectExpert} 
            />
            {error && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl font-mono text-xs uppercase tracking-widest animate-pulse z-50">
                Error: {error}
              </div>
            )}
            <button 
              onClick={goDashboard}
              className="fixed bottom-8 right-8 bg-slate-900 border border-slate-800 p-4 rounded-full shadow-2xl hover:border-cyan-500 transition-all z-40 text-xl"
            >
              📊
            </button>
          </div>
        )}
        
        {state === 'loading' && <div className="pt-24"><LoadingScreen /></div>}
        
        {state === 'display' && currentPersona && (
          <div className="pt-24 w-full">
            <ExpertCard 
              persona={currentPersona} 
              onRestart={goDashboard} 
              onOpenTraining={() => setState('training')} 
            />
          </div>
        )}

        {state === 'training' && currentPersona && (
          <TrainingDashboard 
            persona={currentPersona} 
            onClose={() => setState('display')} 
          />
        )}
      </main>

      {/* Floating Header Bar */}
      {state !== 'training' && state !== 'loading' && state !== 'landing' && state !== 'auth' && state !== 'dashboard' && state !== 'chat' && state !== 'team-setup' && state !== 'teams' && state !== 'structure-preview' && (
        <nav className="fixed top-8 left-0 right-0 z-50 pointer-events-none flex justify-center">
          <button 
            onClick={goDashboard}
            className="pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-slate-800 px-6 py-2 rounded-full flex items-center gap-3 shadow-2xl hover:border-cyan-500/50 transition-all group"
          >
            <div className="w-3 h-3 bg-cyan-500 rounded-full glow-cyan group-hover:scale-125 transition-transform"></div>
            <span className="font-mono text-xs font-black tracking-[0.3em] uppercase text-slate-100">EXPERTFORGE</span>
            <span className="text-slate-600 text-[10px] font-mono ml-4">DASHBOARD</span>
          </button>
        </nav>
      )}

      {/* Landing Page Navbar */}
      {state === 'landing' && (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-slate-900/50 backdrop-blur-md border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-500 rounded-full glow-cyan"></div>
            <span className="font-mono text-sm font-black tracking-widest uppercase text-white">EXPERTFORGE</span>
          </div>
          <div className="flex items-center gap-8">
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="hidden sm:block text-[10px] font-mono text-slate-400 hover:text-white uppercase tracking-widest transition-colors">How it works</button>
            <button onClick={startAuthFlow} className="px-5 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] font-mono text-cyan-400 uppercase tracking-widest hover:bg-cyan-500 hover:text-slate-900 transition-all font-bold">Launch App</button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default App;
