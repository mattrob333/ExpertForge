/**
 * EmergentChat - Silent Director Mode
 * An intellectual discourse system where expert personas debate naturally
 * based on their authentic worldviews, without assigned stances.
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  ExpertPersona,
  Legend,
  QuestionAnalysis,
  DebateExchange,
  DebateSummary,
  SilentDirectorSession,
  DebateStage,
} from '../types';
import {
  selectSilentDirectorPanel,
  generateSingleExchange,
  getNextSpeaker,
  generateDebateSummary,
  createSilentDirectorSession,
  structureDebateStage,
} from '../services/discourseService';

interface EmergentChatProps {
  teamAgents: ExpertPersona[];
  legendaryAdvisors: Legend[];
  teamContext?: string;
  onClose: () => void;
}

const EmergentChat: React.FC<EmergentChatProps> = ({
  teamAgents,
  legendaryAdvisors,
  teamContext,
  onClose,
}) => {
  const [view, setView] = useState<'input' | 'panel' | 'discourse' | 'summary'>('input');
  const [question, setQuestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [session, setSession] = useState<SilentDirectorSession | null>(null);
  const [debateStage, setDebateStage] = useState<DebateStage | null>(null);
  const [analysis, setAnalysis] = useState<QuestionAnalysis | null>(null);
  const [rationale, setRationale] = useState<string>('');
  const [exchanges, setExchanges] = useState<DebateExchange[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [summary, setSummary] = useState<DebateSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  // File upload for context
  const [uploadedFile, setUploadedFile] = useState<{ name: string; content: string; size: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  
  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    const validTypes = ['.txt', '.md', '.markdown', '.json'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validTypes.includes(ext)) {
      alert('Please upload a .txt, .md, or .json file');
      return;
    }
    
    // Check file size (max 50KB)
    if (file.size > 50 * 1024) {
      alert('File too large. Maximum size is 50KB.');
      return;
    }
    
    const content = await file.text();
    setUploadedFile({ name: file.name, content, size: file.size });
  };
  
  const removeUploadedFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  // Get short descriptor for a persona (2-4 words max)
  const getShortDescriptor = (persona: ExpertPersona): string => {
    if (persona.isLegend) {
      // For legends, try to extract from essence
      const essence = persona.essence || '';
      const words = essence.split(' ').slice(0, 4).join(' ');
      return words.length > 30 ? words.slice(0, 30) + '...' : words;
    }
    // For custom agents, use cognitive style or first part of essence
    if (persona.cognitive_style) {
      return persona.cognitive_style.charAt(0).toUpperCase() + persona.cognitive_style.slice(1) + ' Thinker';
    }
    const essence = persona.essence || 'Expert Advisor';
    return essence.split(' ').slice(0, 3).join(' ');
  };

  useEffect(() => {
    if (!userHasScrolled && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [exchanges, isAnimating, userHasScrolled]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setUserHasScrolled(!isNearBottom);
  };

  useEffect(() => {
    if (view === 'discourse') setUserHasScrolled(false);
  }, [view]);

  const handleSubmitQuestion = async () => {
    if (!question.trim()) return;
    setIsAnalyzing(true);
    try {
      // Combine team context with uploaded file content
      const combinedContext = [
        teamContext,
        uploadedFile ? `\n\n--- UPLOADED CONTEXT: ${uploadedFile.name} ---\n${uploadedFile.content}` : ''
      ].filter(Boolean).join('\n');
      
      // First, structure the raw input into a proper debate format
      const stage = await structureDebateStage(question, combinedContext || undefined);
      setDebateStage(stage);
      
      // Then select the panel based on the clarified question
      const result = await selectSilentDirectorPanel(stage.clarifiedQuestion, teamAgents, legendaryAdvisors, combinedContext || undefined, 3);
      const newSession = createSilentDirectorSession(stage.clarifiedQuestion, result.personas, combinedContext || undefined);
      newSession.debateStage = stage;
      
      setSession(newSession);
      setAnalysis(result.analysis);
      setRationale(result.rationale);
      setView('panel');
    } catch (err) {
      console.error('Failed to analyze question:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemoveFromPanel = (personaId: string) => {
    if (!session || session.personas.length <= 2) return;
    setSession({ ...session, personas: session.personas.filter(p => p.id !== personaId) });
  };

  // Generate exchanges one at a time with visual streaming effect
  const generateStreamingExchanges = async (numExchanges: number, startingExchanges: DebateExchange[]) => {
    if (!session || !debateStage) return;
    
    let currentExchanges = [...startingExchanges];
    
    for (let i = 0; i < numExchanges; i++) {
      const nextPersona = getNextSpeaker(session.personas, currentExchanges);
      setCurrentSpeaker(nextPersona.name);
      
      try {
        const exchange = await generateSingleExchange(nextPersona, debateStage, currentExchanges, session.personas);
        currentExchanges = [...currentExchanges, exchange];
        setExchanges(currentExchanges);
        
        // Brief pause between exchanges for readability
        if (i < numExchanges - 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      } catch (err) {
        console.error('Failed to generate exchange:', err);
        break;
      }
    }
    
    setCurrentSpeaker(null);
    setSession({ ...session, exchanges: currentExchanges, updatedAt: new Date() });
  };

  const handleBeginDebate = async () => {
    if (!session || !debateStage) return;
    setView('discourse');
    setIsAnimating(true);
    setExchanges([]);
    
    try {
      // Generate 4-5 initial exchanges (each persona speaks 1-2 times)
      await generateStreamingExchanges(5, []);
    } catch (err) {
      console.error('Debate animation failed:', err);
    } finally {
      setIsAnimating(false);
    }
  };

  const handleContinueDebate = async () => {
    if (!session || !debateStage) return;
    setIsAnimating(true);
    
    try {
      // Generate 3-4 more exchanges
      await generateStreamingExchanges(4, exchanges);
    } catch (err) {
      console.error('Debate continuation failed:', err);
    } finally {
      setIsAnimating(false);
    }
  };

  const handleConcludeDebate = async () => {
    if (!session || exchanges.length === 0) return;
    setIsGeneratingSummary(true);
    try {
      const debateSummary = await generateDebateSummary(session.topic, exchanges, session.personas);
      setSummary(debateSummary);
      setSession({ ...session, summary: debateSummary, status: 'complete', updatedAt: new Date() });
      setView('summary');
    } catch (err) {
      console.error('Summary generation failed:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const renderInputView = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-full flex items-center justify-center">
            <span className="text-4xl">🎭</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Oracle Mode</h1>
          <p className="text-slate-400 max-w-md mx-auto">
            Ask a question and watch your experts debate from their authentic perspectives—no assigned stances, just genuine intellectual collision.
          </p>
        </div>
        <div className="space-y-4">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What should your experts debate? (e.g., 'Should we prioritize growth or profitability?')"
            className="w-full h-32 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none focus:border-cyan-500/50"
          />
          
          {/* File upload section */}
          <div className="space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.md,.markdown,.json"
              className="hidden"
            />
            
            {!uploadedFile ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 border border-dashed border-slate-600 hover:border-cyan-500/50 rounded-xl text-slate-400 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2"
              >
                <span>📎</span>
                <span>Add context file (.txt, .md, .json)</span>
              </button>
            ) : (
              <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📄</span>
                  <div>
                    <p className="text-white text-sm font-medium">{uploadedFile.name}</p>
                    <p className="text-slate-500 text-xs">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  onClick={removeUploadedFile}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
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
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-3"
          >
            {isAnalyzing ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Analyzing...</>
            ) : (
              <><span>🎭</span>Summon the Council</>
            )}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="text-white font-bold text-sm">Smart Selection</h3>
            <p className="text-slate-500 text-xs mt-1">AI selects experts whose worldviews naturally create friction</p>
          </div>
          <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
            <div className="text-2xl mb-2">⚔️</div>
            <h3 className="text-white font-bold text-sm">Authentic Debate</h3>
            <p className="text-slate-500 text-xs mt-1">Experts argue from genuine perspectives, not assigned positions</p>
          </div>
          <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
            <div className="text-2xl mb-2">💡</div>
            <h3 className="text-white font-bold text-sm">Actionable Insights</h3>
            <p className="text-slate-500 text-xs mt-1">Specific recommendations with names, numbers, and concrete steps</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPanelView = () => {
    if (!session) return null;
    return (
      <div className="flex-1 flex flex-col p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Your Debate Panel</h2>
            <p className="text-slate-400">These experts will debate: "{session.topic}"</p>
          </div>
          {analysis && (
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-xl space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Question Analysis</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">Type:</span><span className="ml-2 text-white capitalize">{analysis.type}</span></div>
                <div><span className="text-slate-500">Domains:</span><span className="ml-2 text-cyan-400">{analysis.domains.join(', ')}</span></div>
              </div>
              {analysis.tensions.length > 0 && (
                <div>
                  <span className="text-slate-500 text-sm">Key Tensions:</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {analysis.tensions.map((t, i) => <span key={i} className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-lg">{t}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}
          {rationale && <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg"><p className="text-purple-300 text-sm">{rationale}</p></div>}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Panel Members ({session.personas.length})</h3>
            {session.personas.map((persona) => (
              <div key={persona.id} className="p-4 bg-slate-900/50 border border-slate-700 rounded-xl flex items-start gap-4">
                <div className={`relative shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 ${persona.isLegend ? 'border-amber-500' : 'border-cyan-500/30'}`}>
                  {persona.avatarUrl ? <img src={persona.avatarUrl} alt={persona.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-2xl">👤</div>}
                  {persona.isLegend && <div className="absolute -top-1 -right-1 text-sm">🏆</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-bold">{persona.name}</h4>
                    {persona.isLegend && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded uppercase font-bold">Legend</span>}
                    {persona.cognitive_style && <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded uppercase">{persona.cognitive_style}</span>}
                  </div>
                  <p className="text-slate-400 text-sm mt-1">{persona.essence}</p>
                  {persona.coreBeliefs?.slice(0, 1).map((b, i) => <p key={i} className="text-[10px] text-slate-500 italic mt-1">"{b.slice(0, 60)}..."</p>)}
                  {session.personas.length > 2 && (
                    <button onClick={() => handleRemoveFromPanel(persona.id)} className="mt-2 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Remove">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4">
            <button onClick={() => setView('input')} className="px-6 py-3 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 rounded-xl font-bold transition-colors">← Adjust Question</button>
            <button onClick={handleBeginDebate} className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"><span>🎭</span>Let Them Debate</button>
          </div>
        </div>
      </div>
    );
  };

  const renderDiscourseView = () => {
    if (!session) return null;
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Debate Stage Header */}
        {debateStage && (
          <div className="shrink-0 px-8 py-4 border-b border-slate-800 bg-gradient-to-r from-purple-900/20 to-cyan-900/20">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase rounded">{debateStage.debateFormat}</span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-xs">{exchanges.length} exchanges</span>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">{debateStage.clarifiedQuestion}</h2>
              <div className="flex flex-wrap gap-4 text-xs">
                <div><span className="text-slate-500">Intent:</span> <span className="text-slate-300">{debateStage.userIntent}</span></div>
                <div><span className="text-slate-500">Goal:</span> <span className="text-cyan-400">{debateStage.desiredOutcome}</span></div>
              </div>
              {debateStage.keyConsiderations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {debateStage.keyConsiderations.map((c, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded">{c}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Panel chips */}
        <div className="shrink-0 px-8 py-3 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto flex-1">
            {session.personas.map((p) => (
              <div key={p.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full shrink-0 ${p.isLegend ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-slate-800/50 border border-slate-700'} ${currentSpeaker === p.name ? 'ring-2 ring-cyan-500 ring-opacity-50' : ''}`}>
                <img src={p.avatarUrl} alt={p.name} className="w-6 h-6 rounded-full object-cover" />
                <span className={`text-xs font-medium ${p.isLegend ? 'text-amber-400' : 'text-white'}`}>{p.name.split(' ')[0]}</span>
                {currentSpeaker === p.name && <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>}
              </div>
            ))}
          </div>
        </div>
        
        {/* Messages - Left/Right alternating layout */}
        <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-8 space-y-6">
          {exchanges.map((ex, index) => {
            const persona = session.personas.find(p => p.id === ex.speakerId || p.name === ex.speakerName);
            const personaIndex = session.personas.findIndex(p => p.id === ex.speakerId || p.name === ex.speakerName);
            const isLeft = personaIndex === 0; // First persona on left, others on right
            const descriptor = persona ? getShortDescriptor(persona) : '';
            
            return (
              <div key={ex.id} className={`flex ${isLeft ? 'justify-start' : 'justify-end'}`}>
                <div className={`flex gap-3 max-w-[80%] ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                  {/* Avatar */}
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${persona?.isLegend ? 'border-amber-500' : 'border-slate-600'}`}>
                      {ex.speakerAvatar ? (
                        <img src={ex.speakerAvatar} alt={ex.speakerName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xl">👤</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Message bubble */}
                  <div className={`flex flex-col ${isLeft ? 'items-start' : 'items-end'}`}>
                    {/* Name and descriptor */}
                    <div className={`flex items-center gap-2 mb-1 ${isLeft ? '' : 'flex-row-reverse'}`}>
                      <span className={`font-bold text-sm ${persona?.isLegend ? 'text-amber-400' : 'text-white'}`}>
                        {ex.speakerName}
                      </span>
                      {persona?.isLegend && <span className="text-amber-500 text-xs">🏆</span>}
                    </div>
                    {/* Short descriptor */}
                    <p className={`text-[10px] text-slate-500 mb-2 ${isLeft ? '' : 'text-right'}`}>{descriptor}</p>
                    
                    {/* Message content */}
                    <div className={`p-4 rounded-2xl ${
                      isLeft 
                        ? 'bg-slate-800/80 border border-slate-700 rounded-tl-sm' 
                        : 'bg-gradient-to-br from-purple-900/40 to-cyan-900/40 border border-purple-500/20 rounded-tr-sm'
                    }`}>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{ex.content}</ReactMarkdown>
                      </div>
                    </div>
                    
                    <span className="text-[10px] text-slate-600 mt-1">
                      {ex.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Streaming indicator with current speaker */}
          {isAnimating && currentSpeaker && (() => {
            const speakerPersona = session.personas.find(p => p.name === currentSpeaker);
            const speakerIndex = session.personas.findIndex(p => p.name === currentSpeaker);
            const isLeft = speakerIndex === 0;
            const descriptor = speakerPersona ? getShortDescriptor(speakerPersona) : '';
            
            return (
              <div className={`flex ${isLeft ? 'justify-start' : 'justify-end'}`}>
                <div className={`flex gap-3 max-w-[80%] ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className="shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-500 animate-pulse">
                      {speakerPersona?.avatarUrl ? (
                        <img src={speakerPersona.avatarUrl} alt={currentSpeaker} className="w-full h-full object-cover opacity-70" />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xl">👤</div>
                      )}
                    </div>
                  </div>
                  <div className={`flex flex-col ${isLeft ? 'items-start' : 'items-end'}`}>
                    <div className={`flex items-center gap-2 mb-1 ${isLeft ? '' : 'flex-row-reverse'}`}>
                      <span className="font-bold text-sm text-cyan-400">{currentSpeaker}</span>
                    </div>
                    <p className={`text-[10px] text-slate-500 mb-2 ${isLeft ? '' : 'text-right'}`}>{descriptor}</p>
                    <div className={`p-4 rounded-2xl border border-dashed border-cyan-500/40 bg-slate-900/30 ${isLeft ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <span className="text-cyan-500 text-xs ml-2">thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
          <div ref={chatEndRef} />
        </div>
        <div className="shrink-0 px-8 py-4 border-t border-slate-800 bg-slate-900/50 flex gap-3">
          <button onClick={handleContinueDebate} disabled={isAnimating || isGeneratingSummary} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
            {isAnimating ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Debating...</> : <><span>🔄</span>Continue Debate</>}
          </button>
          <button onClick={handleConcludeDebate} disabled={isAnimating || isGeneratingSummary || exchanges.length === 0} className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
            {isGeneratingSummary ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Summarizing...</> : <><span>📋</span>Conclude &amp; Summarize</>}
          </button>
        </div>
      </div>
    );
  };

  const renderSummaryView = () => {
    if (!summary || !session) return null;
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-cyan-500/20"><span className="text-4xl">📋</span></div>
            <h1 className="text-3xl font-bold text-white">Debate Summary</h1>
            <p className="text-slate-400">{summary.exchangeCount} exchanges between {summary.participants.join(', ')}</p>
          </div>
          {summary.bottomLine && (
            <div className="p-6 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-xl">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><span>💡</span>The Bottom Line</h2>
              <p className="text-white leading-relaxed">{summary.bottomLine}</p>
            </div>
          )}
          {summary.keyInsights.length > 0 && (
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-xl">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Key Insights</h3>
              <ul className="space-y-2">{summary.keyInsights.map((ins, i) => <li key={i} className="flex items-start gap-2"><span className="text-cyan-500">•</span><span className="text-white text-sm">{ins}</span></li>)}</ul>
            </div>
          )}
          {summary.agreements.length > 0 && (
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-xl">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Points of Agreement</h3>
              <ul className="space-y-2">{summary.agreements.map((a, i) => <li key={i} className="flex items-start gap-2"><span className="text-green-500">✓</span><span className="text-white text-sm">{a}</span></li>)}</ul>
            </div>
          )}
          {summary.tensions.length > 0 && (
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-xl">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Productive Tensions</h3>
              <ul className="space-y-2">{summary.tensions.map((t, i) => <li key={i} className="flex items-start gap-2"><span className="text-amber-500">⚡</span><span className="text-white text-sm">{t}</span></li>)}</ul>
            </div>
          )}
          {summary.recommendations.length > 0 && (
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-xl">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Recommendations</h3>
              <ul className="space-y-2">{summary.recommendations.map((r, i) => <li key={i} className="flex items-start gap-2"><span className="text-purple-500">→</span><span className="text-white text-sm">{r}</span></li>)}</ul>
            </div>
          )}
          {Object.keys(summary.contributions).length > 0 && (
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-xl">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Contributions</h3>
              <div className="space-y-2">{Object.entries(summary.contributions).map(([name, contrib]) => <div key={name} className="flex items-start gap-3"><span className="text-cyan-400 font-bold text-sm shrink-0">{name}:</span><span className="text-slate-300 text-sm">{contrib}</span></div>)}</div>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setView('discourse')} className="px-5 py-3 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50 rounded-xl font-bold transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              View Full Debate
            </button>
            <button onClick={() => { navigator.clipboard.writeText(summary.bottomLine + '\n\n' + summary.recommendations.join('\n')); alert('Summary copied!'); }} className="px-5 py-3 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 rounded-xl font-bold transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              Copy Summary
            </button>
            <button onClick={() => { setView('input'); setQuestion(''); setSession(null); setExchanges([]); setSummary(null); }} className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
              <span>🎭</span>New Debate
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col">
      <header className="shrink-0 h-16 px-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="font-mono text-sm font-black tracking-widest uppercase text-white">ORACLE MODE</span>
          <span className="text-slate-600 text-[10px] font-mono">SILENT DIRECTOR</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>
      {view === 'input' && renderInputView()}
      {view === 'panel' && renderPanelView()}
      {view === 'discourse' && renderDiscourseView()}
      {view === 'summary' && renderSummaryView()}
    </div>
  );
};

export default EmergentChat;
