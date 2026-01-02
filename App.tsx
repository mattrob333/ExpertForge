
import React, { useState, useEffect } from 'react';
import Background from './components/Background';
import LoadingScreen from './components/LoadingScreen';
import ExpertCard from './components/ExpertCard';
import TrainingDashboard from './components/TrainingDashboard';
import HomeDashboard from './components/HomeDashboard';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import TeamChat from './components/TeamChat';
import TeamSetup from './components/TeamSetup';
import TeamBuilder from './components/TeamBuilder';
import LegendsLibrary from './components/LegendsLibrary';
import LegendProfile from './components/LegendProfile';
import { ExpertPersona, AppState, PersonalityDirection, TeamContext, TeamStructure, Legend } from './types';
import { generateExpertPersona, generateTeamStructure } from './services/geminiService';
import { supabase, signOut, onAuthStateChange } from './lib/supabase';
import { getExperts, saveExpert, getTeamContext, saveTeamContext, getTeamStructure, saveTeamStructure, clearLocalStorage, getAllTeams, deleteTeam, TeamContextWithId } from './services/storageService';
import type { User } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('landing');
  const [experts, setExperts] = useState<ExpertPersona[]>([]);
  const [currentPersona, setCurrentPersona] = useState<ExpertPersona | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [teamContext, setTeamContext] = useState<TeamContext | null>(null);
  const [teamStructure, setTeamStructure] = useState<TeamStructure | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [allTeams, setAllTeams] = useState<TeamContextWithId[]>([]);
  const [selectedLegend, setSelectedLegend] = useState<Legend | null>(null);
  const [activeChatAdvisor, setActiveChatAdvisor] = useState<ExpertPersona | null>(null);

  // Auth state listener
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        setState('home');
        loadUserData(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN' && session?.user) {
        loadUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setExperts([]);
        setTeamContext(null);
        setTeamStructure(null);
        setCurrentTeamId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load user data from storage
  const loadUserData = async (userId: string) => {
    try {
      const [loadedExperts, loadedTeams] = await Promise.all([
        getExperts(userId),
        getAllTeams(userId),
      ]);
      setExperts(loadedExperts);
      setAllTeams(loadedTeams);
      
      // Set the first team as current context if available
      if (loadedTeams.length > 0) {
        setTeamContext(loadedTeams[0]);
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  };

  const handleGenerate = async (description: string, direction?: PersonalityDirection) => {
    setState('loading');
    setError(null);
    try {
      const result = await generateExpertPersona(description, direction);
      // Save to storage
      const savedExpert = await saveExpert(result, user?.id);
      setExperts(prev => [...prev, savedExpert]);
      setCurrentPersona(savedExpert);
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
      // Save team context first
      const teamId = await saveTeamContext(context, user?.id);
      setCurrentTeamId(teamId);
      
      // Add to allTeams list
      const newTeamWithId: TeamContextWithId = { ...context, id: teamId };
      setAllTeams(prev => [newTeamWithId, ...prev]);
      
      // Generate structure
      const structure = await generateTeamStructure(context);
      setTeamStructure(structure);
      
      // Save structure immediately so it loads instantly next time
      await saveTeamStructure(structure, teamId);
      
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
    setState('home');
  };

  const goChat = () => {
    setCurrentPersona(null);
    setError(null);
    setState('chat');
  };

  // goTeams removed - teams now shown in HomeDashboard

  const goTeamSetup = () => {
    setCurrentPersona(null);
    setError(null);
    setState('team-setup');
  }

  const goLegends = () => {
    setCurrentPersona(null);
    setError(null);
    setState('legends');
  }

  const handleSelectLegend = (legend: Legend) => {
    setSelectedLegend(legend);
    setState('legend-profile');
  }

  const handleDraftLegend = (legend: Legend): ExpertPersona => {
    // Convert legend to ExpertPersona format and add to experts
    const expertFromLegend: ExpertPersona = {
      id: `legend-${legend.id}`,
      name: legend.name,
      essence: legend.title,
      avatarUrl: legend.photo,
      introduction: legend.quote,
      role: legend.categories[0],
      isLegend: true,
      stats: {
        coreSkills: 95,
        mentalModels: legend.mentalModels.length * 20,
        coreBeliefs: legend.overview.corePhilosophy.length * 15,
        influences: legend.overview.influences.length * 10,
      },
      coreBeliefs: legend.overview.corePhilosophy,
      aesthetics: {
        beautiful: legend.overview.knownFor.slice(0, 2).join(', '),
        cringe: 'Mediocrity, short-term thinking',
      },
      expertiseMap: {
        deepMastery: legend.overview.knownFor,
        workingKnowledge: legend.categories,
        curiosityEdges: [],
        honestLimits: [],
      },
      thinking: {
        problemApproach: legend.mentalModels[0]?.description || '',
        mentalModels: legend.mentalModels.map(m => ({ name: m.name, description: m.description })),
        reasoningPatterns: legend.famousDecisions[0]?.logic || '',
      },
      personality: {
        energyProfile: 'High-intensity, strategic',
        interactionModes: {
          exploring: 'Asks probing questions',
          teaching: 'Uses real-world examples',
          building: 'Focuses on fundamentals',
          disagreeing: 'Direct but respectful',
        },
        signatureExpressions: legend.mockResponses.slice(0, 3),
        quirks: [],
        selfAwareness: 'Highly self-aware',
      },
      sidebar: {
        competencies: [
          { label: legend.categories[0], level: 95 },
          { label: 'Leadership', level: 90 },
          { label: 'Strategy', level: 88 },
        ],
        influences: legend.overview.influences,
        whatExcitesThem: legend.overview.knownFor[0] || 'Excellence',
      },
    };
    
    // Add to experts if not already there
    if (!experts.find(e => e.id === expertFromLegend.id)) {
      setExperts(prev => [...prev, expertFromLegend]);
    }
    
    // Return the expert for immediate use
    return expertFromLegend;
  }

  const handleDraftAndGoHome = (legend: Legend) => {
    handleDraftLegend(legend);
    setState('home');
  }

  const handleChatWithLegend = (legend: Legend) => {
    // First draft the legend and get the expert persona
    const expertFromLegend = handleDraftLegend(legend);
    // Set this as the active chat advisor so they respond by default
    setActiveChatAdvisor(expertFromLegend);
    // Then go to chat
    setState('chat');
  }

  const startAuthFlow = () => {
    setState('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = () => {
    // Always go to home dashboard after auth - experts first!
    setState('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await signOut();
    clearLocalStorage();
    setExperts([]);
    setTeamContext(null);
    setTeamStructure(null);
    setCurrentTeamId(null);
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
              onCancel={() => setState('home')} 
            />
          </div>
        )}

        {state === 'structure-preview' && teamStructure && (
          <TeamBuilder 
            structure={teamStructure}
            context={teamContext}
            teamId={currentTeamId || undefined}
            experts={experts}
            onSave={() => setState('home')}
            onBack={() => setState('team-setup')}
            onGoHome={goDashboard}
            onExpertCreated={async (expert) => {
              // Save the custom agent to storage and add to experts list
              const savedExpert = await saveExpert(expert, user?.id);
              setExperts(prev => [...prev, savedExpert]);
            }}
          />
        )}

        {/* Teams are now shown in HomeDashboard */}

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
            <TeamChat 
              experts={activeChatAdvisor ? [...experts.filter(e => e.id !== activeChatAdvisor.id), activeChatAdvisor].filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i) : experts} 
              activeAdvisor={activeChatAdvisor}
              onClose={() => { setActiveChatAdvisor(null); goDashboard(); }} 
              onBrowseLegends={() => { setActiveChatAdvisor(null); goLegends(); }} 
            />
          </div>
        )}

        {state === 'home' && (
          <div className="pt-24 w-full">
            <HomeDashboard 
              experts={experts} 
              teams={allTeams}
              onSummon={handleGenerate} 
              onSelectExpert={selectExpert}
              onCreateTeam={goTeamSetup}
              onGoLegends={goLegends}
              onSelectTeam={async (team: TeamContextWithId) => {
                // Try to load saved structure from database first
                setTeamContext(team);
                setCurrentTeamId(team.id);
                
                try {
                  const savedStructure = await getTeamStructure(team.id, user?.id);
                  if (savedStructure) {
                    // Instant display - structure is already saved
                    setTeamStructure(savedStructure);
                    setState('structure-preview');
                  } else {
                    // No saved structure - need to generate
                    setState('loading');
                    const structure = await generateTeamStructure(team);
                    setTeamStructure(structure);
                    // Note: structure will be saved when user clicks "Save Team"
                    setState('structure-preview');
                  }
                } catch (err) {
                  console.error('Failed to load team structure:', err);
                  setState('home');
                }
              }}
              onGoChat={goChat}
              onLogout={handleLogout}
              onDeleteTeam={async (teamId: string) => {
                try {
                  await deleteTeam(teamId);
                  // Refresh teams list
                  if (user?.id) {
                    const updatedTeams = await getAllTeams(user.id);
                    setAllTeams(updatedTeams);
                  }
                } catch (err) {
                  console.error('Failed to delete team:', err);
                  setError('Failed to delete team');
                }
              }}
            />
            {error && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl font-mono text-xs uppercase tracking-widest animate-pulse z-50">
                Error: {error}
              </div>
            )}
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

        {state === 'legends' && (
          <LegendsLibrary
            onSelectLegend={handleSelectLegend}
            onDraftLegend={handleDraftLegend}
            onBack={goDashboard}
          />
        )}

        {state === 'legend-profile' && selectedLegend && (
          <LegendProfile
            legend={selectedLegend}
            onBack={goLegends}
            onDraft={handleDraftAndGoHome}
            onChat={handleChatWithLegend}
          />
        )}
      </main>

      {/* Floating Header Bar - shows on display and other views */}
      {state !== 'training' && state !== 'loading' && state !== 'landing' && state !== 'auth' && state !== 'home' && state !== 'chat' && state !== 'team-setup' && state !== 'structure-preview' && state !== 'legends' && state !== 'legend-profile' && (
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
