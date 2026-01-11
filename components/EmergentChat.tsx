/**
 * EmergentChat - Intellectual Emergence System
 * A structured discourse engine that assembles expert panels to debate questions
 * and produce novel insights through intellectual collision.
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  ExpertPersona,
  Legend,
  DiscoursePanel,
  DiscourseMessage,
  DiscoursePhase,
  DiscourseSession,
  QuestionAnalysis,
  EmergenceReport,
  DiscourseStance,
} from '../types';
import {
  selectDebatePanel,
  generatePositionStatement,
  generateChallenge,
  generateRedTeamIntervention,
  attemptSynthesis,
  detectEmergence,
  generateEmergenceReport,
  createDiscourseSession,
  STANCE_PROMPTS,
} from '../services/discourseService';

interface EmergentChatProps {
  teamAgents: ExpertPersona[];
  legendaryAdvisors: Legend[];
  teamContext?: string;
  onClose: () => void;
}

// Stance badge colors and icons
const STANCE_STYLES: Record<DiscourseStance, { bg: string; text: string; icon: string; label: string }> = {
  advocate: { bg: 'bg-green-500/20', text: 'text-green-400', icon: '⚔️', label: 'Advocate' },
  skeptic: { bg: 'bg-red-500/20', text: 'text-red-400', icon: '🛡️', label: 'Skeptic' },
  neutral: { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: '⚖️', label: 'Neutral' },
  devils_advocate: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: '😈', label: "Devil's Advocate" },
  synthesizer: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', icon: '🔗', label: 'Synthesizer' },
};

// Phase progress indicator
const PHASE_ORDER: DiscoursePhase[] = ['position', 'collision', 'challenge', 'response', 'red_team', 'synthesis', 'emergence'];
const PHASE_LABELS: Record<DiscoursePhase, string> = {
  position: 'Initial Positions',
  collision: 'Collision Mapping',
  challenge: 'Directed Challenges',
  response: 'Responses',
  red_team: 'Red Team',
  synthesis: 'Synthesis',
  emergence: 'Emergence Detection',
};

const EmergentChat: React.FC<EmergentChatProps> = ({
  teamAgents,
  legendaryAdvisors,
  teamContext,
  onClose,
}) => {
  // State
  const [view, setView] = useState<'input' | 'panel' | 'discourse' | 'report'>('input');
  const [question, setQuestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [session, setSession] = useState<DiscourseSession | null>(null);
  const [messages, setMessages] = useState<DiscourseMessage[]>([]);
  const [currentPhase, setCurrentPhase] = useState<DiscoursePhase>('position');
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [report, setReport] = useState<EmergenceReport | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);

  // Smart auto-scroll - only scroll if user hasn't manually scrolled up
  useEffect(() => {
    if (!userHasScrolled && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, userHasScrolled]);

  // Detect when user manually scrolls
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    // If user scrolls up (not near bottom), disable auto-scroll
    // If user scrolls back to bottom, re-enable auto-scroll
    setUserHasScrolled(!isNearBottom);
  };

  // Reset scroll tracking when discourse starts
  useEffect(() => {
    if (view === 'discourse') {
      setUserHasScrolled(false);
    }
  }, [view]);

  // Handle question submission
  const handleSubmitQuestion = async () => {
    if (!question.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const result = await selectDebatePanel(
        question,
        teamAgents,
        legendaryAdvisors,
        teamContext,
        5
      );

      const newSession = createDiscourseSession(
        question,
        result.panel,
        result.analysis
      );
      
      setSession(newSession);
      setView('panel');
    } catch (err) {
      console.error('Failed to analyze question:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Adjust panel member stance
  const handleStanceChange = (agentId: string, newStance: DiscourseStance) => {
    if (!session) return;
    
    setSession({
      ...session,
      panel: session.panel.map(p =>
        p.agentId === agentId ? { ...p, assignedStance: newStance } : p
      ),
    });
  };

  // Remove panel member
  const handleRemoveFromPanel = (agentId: string) => {
    if (!session || session.panel.length <= 2) return;
    
    setSession({
      ...session,
      panel: session.panel.filter(p => p.agentId !== agentId),
    });
  };

  // Begin the discourse
  const handleBeginDiscourse = async () => {
    if (!session) return;
    
    setView('discourse');
    setIsProcessing(true);
    setCurrentPhase('position');

    try {
      // Phase 1: Gather initial positions from each panel member
      const positionMessages: DiscourseMessage[] = [];
      
      for (const panelMember of session.panel) {
        setStreamingContent(`${panelMember.agent.name} is formulating their position...`);
        
        const position = await generatePositionStatement(
          panelMember.agent,
          panelMember.assignedStance,
          session.question,
          teamContext
        );
        
        positionMessages.push(position);
        setMessages(prev => [...prev, position]);
        
        // Small delay between responses for readability
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setStreamingContent(null);
      setCurrentPhase('challenge');

      // Phase 2: Directed challenges (pairs of experts challenge each other)
      const challengeMessages: DiscourseMessage[] = [];
      const advocates = session.panel.filter(p => p.assignedStance === 'advocate');
      const skeptics = session.panel.filter(p => p.assignedStance === 'skeptic');

      // Have skeptics challenge advocates
      for (const skeptic of skeptics) {
        for (const advocate of advocates) {
          const advocatePosition = positionMessages.find(m => m.agentId === advocate.agentId);
          if (!advocatePosition) continue;

          setStreamingContent(`${skeptic.agent.name} is challenging ${advocate.agent.name}...`);
          
          const challenge = await generateChallenge(
            skeptic.agent,
            skeptic.assignedStance,
            advocate.agent,
            advocatePosition.content,
            session.question
          );
          
          challengeMessages.push(challenge);
          setMessages(prev => [...prev, challenge]);
          
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setStreamingContent(null);
      setCurrentPhase('red_team');

      // Phase 3: Red team intervention
      setStreamingContent('Red Team analyzing shared assumptions...');
      
      const allMessages = [...positionMessages, ...challengeMessages];
      const redTeam = await generateRedTeamIntervention(allMessages, session.question);
      
      setMessages(prev => [...prev, redTeam]);
      setStreamingContent(null);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentPhase('synthesis');

      // Phase 4: Synthesis
      setStreamingContent('Synthesis Engine integrating perspectives...');
      
      const allMessagesWithRedTeam = [...allMessages, redTeam];
      const synthesis = await attemptSynthesis(
        allMessagesWithRedTeam,
        session.panel,
        session.question
      );
      
      setMessages(prev => [...prev, synthesis]);
      setStreamingContent(null);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentPhase('emergence');

      // Phase 5: Emergence detection
      setStreamingContent('Detecting intellectual emergence...');
      
      const evaluation = await detectEmergence(
        synthesis.content,
        allMessagesWithRedTeam,
        session.panel,
        session.question
      );

      // Generate final report
      const finalReport = generateEmergenceReport(
        session.id,
        session.question,
        synthesis,
        evaluation,
        [...allMessagesWithRedTeam, synthesis],
        session.panel
      );

      setReport(finalReport);
      setStreamingContent(null);
      setView('report');

    } catch (err) {
      console.error('Discourse failed:', err);
      setStreamingContent(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Render question input view
  const renderInputView = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-full flex items-center justify-center">
            <span className="text-4xl">⚡</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Oracle Mode</h1>
          <p className="text-slate-400 max-w-md mx-auto">
            Ask a complex question and watch your expert panel debate, challenge, and synthesize to produce insights no single expert would reach alone.
          </p>
        </div>

        {/* Question input */}
        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What strategic question should your panel debate? (e.g., 'Should we pivot from B2B to B2C given our traction?')"
              className="w-full h-32 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>

          {teamContext && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Team context loaded
            </div>
          )}

          <button
            onClick={handleSubmitQuestion}
            disabled={!question.trim() || isAnalyzing}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-3"
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing Question & Assembling Panel...
              </>
            ) : (
              <>
                <span>⚔️</span>
                Summon the Council
              </>
            )}
          </button>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="text-white font-bold text-sm">Panel Selection</h3>
            <p className="text-slate-500 text-xs mt-1">AI selects optimal debaters for your specific question</p>
          </div>
          <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
            <div className="text-2xl mb-2">⚔️</div>
            <h3 className="text-white font-bold text-sm">Structured Friction</h3>
            <p className="text-slate-500 text-xs mt-1">Assigned stances ensure productive intellectual collision</p>
          </div>
          <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
            <div className="text-2xl mb-2">✨</div>
            <h3 className="text-white font-bold text-sm">Emergence Detection</h3>
            <p className="text-slate-500 text-xs mt-1">System identifies insights no single expert would reach</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render panel selection view
  const renderPanelView = () => {
    if (!session) return null;

    return (
      <div className="flex-1 flex flex-col p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Proposed Debate Panel</h2>
            <p className="text-slate-400">
              Here's who I'm assembling for: "{session.question}"
            </p>
          </div>

          {/* Question Analysis */}
          <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Question Analysis</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Type:</span>
                <span className="ml-2 text-white capitalize">{session.questionAnalysis.type}</span>
              </div>
              <div>
                <span className="text-slate-500">Domains:</span>
                <span className="ml-2 text-cyan-400">{session.questionAnalysis.domains.join(', ')}</span>
              </div>
            </div>
            {session.questionAnalysis.tensions.length > 0 && (
              <div>
                <span className="text-slate-500 text-sm">Key Tensions:</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {session.questionAnalysis.tensions.map((tension, i) => (
                    <span key={i} className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-lg">
                      {tension}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Panel Members */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Panel Members ({session.panel.length})</h3>
            
            {session.panel.map((member) => {
              const stanceStyle = STANCE_STYLES[member.assignedStance];
              return (
                <div
                  key={member.agentId}
                  className="p-4 bg-slate-900/50 border border-slate-700 rounded-xl flex items-start gap-4"
                >
                  {/* Avatar */}
                  <div className={`relative shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 ${member.agent.isLegend ? 'border-amber-500' : 'border-cyan-500/30'}`}>
                    {member.agent.avatarUrl ? (
                      <img src={member.agent.avatarUrl} alt={member.agent.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-2xl">👤</div>
                    )}
                    {member.agent.isLegend && (
                      <div className="absolute -top-1 -right-1 text-sm">🏆</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-bold">{member.agent.name}</h4>
                      {member.agent.cognitive_style && (
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded uppercase">
                          {member.agent.cognitive_style}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm truncate">{member.agent.essence}</p>
                    
                    {/* Stance selector */}
                    <div className="mt-2 flex items-center gap-2">
                      <select
                        value={member.assignedStance}
                        onChange={(e) => handleStanceChange(member.agentId, e.target.value as DiscourseStance)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${stanceStyle.bg} ${stanceStyle.text} bg-opacity-50 border-0 focus:ring-1 focus:ring-cyan-500/50 cursor-pointer`}
                      >
                        {Object.entries(STANCE_STYLES).map(([stance, style]) => (
                          <option key={stance} value={stance} className="bg-slate-900 text-white">
                            {style.icon} {style.label}
                          </option>
                        ))}
                      </select>
                      
                      {session.panel.length > 2 && (
                        <button
                          onClick={() => handleRemoveFromPanel(member.agentId)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Remove from panel"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => setView('input')}
              className="px-6 py-3 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 rounded-xl font-bold transition-colors"
            >
              ← Adjust Question
            </button>
            <button
              onClick={handleBeginDiscourse}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>⚔️</span>
              Begin Discourse
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render discourse view
  const renderDiscourseView = () => {
    if (!session) return null;

    const currentPhaseIndex = PHASE_ORDER.indexOf(currentPhase);

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Phase progress bar */}
        <div className="shrink-0 px-8 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Discourse Phase:</span>
            <span className="text-sm font-bold text-cyan-400">{PHASE_LABELS[currentPhase]}</span>
          </div>
          <div className="flex gap-1">
            {PHASE_ORDER.map((phase, i) => (
              <div
                key={phase}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= currentPhaseIndex ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Panel chips + Back to Report button */}
        <div className="shrink-0 px-8 py-3 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto flex-1">
            {session.panel.map((member) => {
              const stanceStyle = STANCE_STYLES[member.assignedStance];
              return (
                <div
                  key={member.agentId}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-full shrink-0"
                >
                  <img
                    src={member.agent.avatarUrl}
                    alt={member.agent.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="text-white text-xs font-medium">{member.agent.name.split(' ')[0]}</span>
                  <span className={`text-[10px] ${stanceStyle.text}`}>{stanceStyle.icon}</span>
                </div>
              );
            })}
          </div>
          {/* Show Back to Report button if report exists */}
          {report && (
            <button
              onClick={() => setView('report')}
              className="ml-4 px-4 py-1.5 bg-gradient-to-r from-purple-600/50 to-cyan-600/50 hover:from-purple-600 hover:to-cyan-600 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shrink-0"
            >
              <span>✨</span>
              View Report
            </button>
          )}
        </div>

        {/* Messages - with scroll tracking */}
        <div 
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-8 space-y-6"
        >
          {messages.map((msg) => {
            const isSystem = msg.isSystem;
            const stanceStyle = msg.stance ? STANCE_STYLES[msg.stance] : null;
            
            return (
              <div
                key={msg.id}
                className={`flex gap-4 ${isSystem ? 'justify-center' : ''}`}
              >
                {!isSystem && (
                  <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-slate-700">
                    {msg.agentAvatar ? (
                      <img src={msg.agentAvatar} alt={msg.agentName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-lg">
                        {isSystem ? '🤖' : '👤'}
                      </div>
                    )}
                  </div>
                )}

                <div className={`flex-1 ${isSystem ? 'max-w-2xl' : ''}`}>
                  {!isSystem && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold text-sm">{msg.agentName}</span>
                      {stanceStyle && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${stanceStyle.bg} ${stanceStyle.text}`}>
                          {stanceStyle.icon} {stanceStyle.label}
                        </span>
                      )}
                      {msg.metadata?.targetAgent && (
                        <span className="text-slate-500 text-xs">
                          → challenging {msg.metadata.targetAgent}
                        </span>
                      )}
                    </div>
                  )}

                  <div className={`p-4 rounded-xl ${
                    isSystem
                      ? 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30'
                      : 'bg-slate-900/50 border border-slate-800'
                  }`}>
                    {isSystem && (
                      <div className="flex items-center gap-2 mb-2 text-purple-400 font-bold text-sm">
                        <span>🔮</span>
                        {msg.agentName}
                      </div>
                    )}
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-600 mt-1 block">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Streaming indicator */}
          {streamingContent && (
            <div className="flex items-center justify-center gap-3 py-4">
              <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-cyan-400 text-sm">{streamingContent}</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>
    );
  };

  // Render emergence report view
  const renderReportView = () => {
    if (!report) return null;

    const evaluation = report.evaluation;
    const noveltyColor = evaluation.noveltyScore >= 7 ? 'text-green-400' : evaluation.noveltyScore >= 4 ? 'text-amber-400' : 'text-red-400';

    return (
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
              evaluation.isGenuineEmergence
                ? 'bg-gradient-to-br from-green-500/20 to-cyan-500/20'
                : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20'
            }`}>
              <span className="text-4xl">{evaluation.isGenuineEmergence ? '✨' : '💭'}</span>
            </div>
            <h1 className="text-3xl font-bold text-white">
              {evaluation.isGenuineEmergence ? 'Emergence Detected!' : 'Synthesis Complete'}
            </h1>
            <p className="text-slate-400">
              {evaluation.verdict === 'genuine_emergence'
                ? 'A novel insight emerged from the collision of frameworks'
                : evaluation.verdict === 'obvious_combination'
                ? 'The synthesis combines existing ideas without true emergence'
                : 'The insight needs further development'}
            </p>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-xl text-center">
              <div className={`text-4xl font-bold ${noveltyColor}`}>{evaluation.noveltyScore}/10</div>
              <div className="text-slate-500 text-sm">Novelty Score</div>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-xl text-center">
              <div className="text-4xl font-bold text-white">{evaluation.singleExpertDerivable ? 'Yes' : 'No'}</div>
              <div className="text-slate-500 text-sm">Single Expert Derivable?</div>
            </div>
          </div>

          {/* The Synthesis */}
          <div className="p-6 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>💡</span> The Emerging Insight
            </h2>
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{report.synthesis}</ReactMarkdown>
            </div>
          </div>

          {/* Key Collision */}
          {evaluation.keyCollision && (
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-xl">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Key Collision</h3>
              <p className="text-white">{evaluation.keyCollision}</p>
            </div>
          )}

          {/* Attribution */}
          {Object.keys(evaluation.attribution).length > 0 && (
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-xl">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Attribution</h3>
              <div className="space-y-2">
                {Object.entries(evaluation.attribution).map(([expert, contribution]) => (
                  <div key={expert} className="flex items-start gap-3">
                    <span className="text-cyan-400 font-bold text-sm shrink-0">{expert}:</span>
                    <span className="text-slate-300 text-sm">{contribution}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Panel */}
          <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-xl">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Panel Members</h3>
            <div className="flex flex-wrap gap-2">
              {report.panel.map((member) => {
                const stanceStyle = STANCE_STYLES[member.assignedStance];
                return (
                  <div
                    key={member.agentId}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg"
                  >
                    <img
                      src={member.agent.avatarUrl}
                      alt={member.agent.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-white text-sm font-medium">{member.agent.name}</div>
                      <div className={`text-[10px] ${stanceStyle.text}`}>
                        {stanceStyle.icon} {stanceStyle.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setView('discourse')}
              className="px-5 py-3 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50 rounded-xl font-bold transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              View Discourse
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(report.synthesis);
                alert('Synthesis copied to clipboard!');
              }}
              className="px-5 py-3 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 rounded-xl font-bold transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Synthesis
            </button>
            <button
              onClick={() => {
                setView('input');
                setQuestion('');
                setSession(null);
                setMessages([]);
                setReport(null);
              }}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>⚡</span>
              Ask Another Question
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col">
      {/* Header */}
      <header className="shrink-0 h-16 px-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="font-mono text-sm font-black tracking-widest uppercase text-white">ORACLE MODE</span>
          <span className="text-slate-600 text-[10px] font-mono">INTELLECTUAL EMERGENCE</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors p-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* Content */}
      {view === 'input' && renderInputView()}
      {view === 'panel' && renderPanelView()}
      {view === 'discourse' && renderDiscourseView()}
      {view === 'report' && renderReportView()}
    </div>
  );
};

export default EmergentChat;
