
import React, { useState, useEffect, useRef } from 'react';
import { ExpertPersona, ExpertResource, ResourceRecommendations } from '../types';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { getExpertResources, saveExpertResource } from '../services/storageService';
import { generateResourceRecommendations, autoPopulateAllResources } from '../services/geminiService';

interface TrainingDashboardProps {
  persona: ExpertPersona;
  onClose: () => void;
}

const TrainingDashboard: React.FC<TrainingDashboardProps> = ({ persona, onClose }) => {
  const [resources, setResources] = useState<ExpertResource[]>([]);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Resource recommendation state
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<ResourceRecommendations | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [autoPopulating, setAutoPopulating] = useState(false);
  const [populateProgress, setPopulateProgress] = useState({ current: 0, total: 0, item: '' });
  const [expandedResource, setExpandedResource] = useState<ExpertResource | null>(null);

  // Load resources when component mounts
  useEffect(() => {
    if (persona.id) {
      getExpertResources(persona.id).then(setResources);
    }
  }, [persona.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  const handleAskForResources = async () => {
    setLoadingRecommendations(true);
    setShowRecommendations(true);
    try {
      const result = await generateResourceRecommendations(persona);
      setRecommendations(result);
    } catch (err) {
      console.error('Failed to generate recommendations:', err);
      setRecommendations({ 
        introduction: 'I apologize, but I encountered an issue generating my resource recommendations. Please try again.',
        resources: []
      });
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleAutoPopulate = async () => {
    if (!recommendations || recommendations.resources.length === 0) return;
    
    setAutoPopulating(true);
    try {
      const results = await autoPopulateAllResources(
        recommendations,
        persona,
        (current, total, item) => setPopulateProgress({ current, total, item })
      );
      
      // Save populated resources to storage (only those that weren't skipped)
      for (const result of results) {
        if (!result.skipped && result.content) {
          await saveExpertResource(persona.id, {
            title: result.resource.title,
            description: result.resource.description,
            resourceType: result.resource.category === 'book' ? 'book' : 
                          result.resource.category === 'website' ? 'url' : 'document',
            content: result.content,
            url: result.url,
            isRecommended: true,
            isAttached: true,
          });
        }
      }
      
      // Refresh resources list
      const updatedResources = await getExpertResources(persona.id);
      setResources(updatedResources);
      setShowRecommendations(false);
    } catch (err) {
      console.error('Failed to auto-populate resources:', err);
    } finally {
      setAutoPopulating(false);
      setPopulateProgress({ current: 0, total: 0, item: '' });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'capability': return '⚡';
      case 'book': return '📚';
      case 'website': return '🌐';
      case 'document': return '📄';
      case 'data': return '📊';
      default: return '📦';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'required': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'recommended': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'nice-to-have': return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
      default: return 'text-slate-400';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'url': return '🔗';
      case 'book': return '📖';
      case 'api': return '⚡';
      case 'tool': return '🛠️';
      case 'capability': return '⚡';
      default: return '📄';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `You are ${persona.name}. Essence: ${persona.essence}. Intro: ${persona.introduction}. You are speaking in your unique voice. Use the context of your core beliefs: ${persona.coreBeliefs.join(', ')}. Use the information in your dossier and any uploaded sources to inform your responses. Respond in rich Markdown format (use bolding, bullet points, headers where appropriate). Stay in character.`,
        }
      });

      const response = await chat.sendMessage({ message: userMessage });
      setChatHistory(prev => [...prev, { role: 'model', text: response.text || "I'm processing that information..." }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'model', text: "**Systems offline.** Connection lost. Please try re-initializing the uplink." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAction = (action: string) => {
    setChatHistory(prev => [...prev, { role: 'model', text: `Initiating **${action}** generation based on your training sources... *(Mock Output Generation)*` }]);
  };

  return (
    <div className="fixed inset-0 bg-[#020617] z-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-800 bg-[#0f172a]/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-cyan-500/30">
              <img src={persona.avatarUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-white font-bold leading-none">{persona.name} <span className="text-slate-500 font-normal text-xs ml-2">Training Session</span></h1>
              <p className="text-cyan-400 text-[10px] font-mono uppercase tracking-widest mt-1">Active Learning Mode</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-4 py-1.5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-all">Analytics</button>
          <button className="px-4 py-1.5 rounded-full bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 transition-all">Share Agent</button>
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">🛠️</div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Resources */}
        <aside className="w-72 border-r border-slate-800 flex flex-col bg-[#0f172a]/20">
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-slate-400 text-[10px] font-mono uppercase tracking-widest font-bold">Resources</h2>
              <span className="text-slate-600 text-[10px]">{resources.length} items</span>
            </div>
            
            {resources.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-3">📭</div>
                <p className="text-slate-500 text-xs mb-4">No resources loaded yet</p>
                <button 
                  onClick={handleAskForResources}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold rounded-xl transition-all"
                >
                  📋 What Resources Do You Need?
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {resources.map(resource => (
                  <div 
                    key={resource.id} 
                    onClick={() => setExpandedResource(resource)}
                    className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center gap-3 hover:border-cyan-500/50 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-cyan-500/10 text-cyan-400">
                      {getResourceIcon(resource.resourceType)}
                    </div>
                    <div className="truncate flex-1">
                      <p className="text-slate-200 text-xs truncate font-medium">{resource.title}</p>
                      <p className="text-slate-500 text-[9px] uppercase tracking-tighter">
                        {resource.resourceType} {resource.isAttached && '• ✓ Attached'}
                      </p>
                    </div>
                    {resource.content && (
                      <span className="text-emerald-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity">View</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-slate-800 space-y-3">
            <button 
              onClick={handleAskForResources}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span>📋</span> What Resources Do You Need?
            </button>
          </div>
        </aside>

        {/* Middle: Chat */}
        <main className="flex-1 flex flex-col bg-[#020617] relative">
          <div className="flex-1 overflow-y-auto p-8 space-y-10">
            {chatHistory.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4">
                <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-2xl border border-slate-800 mb-2">💬</div>
                <h3 className="text-xl font-bold text-white">Direct Interface Active</h3>
                <p className="text-slate-400 text-sm">Ask {persona.name} anything about the uploaded sources, or start training them on new concepts.</p>
                <div className="grid grid-cols-2 gap-2 w-full pt-4">
                  <button onClick={() => setInputValue("Summarize your core beliefs.")} className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-xs text-slate-300 hover:border-cyan-500/30 transition-all">"Summarize your core beliefs"</button>
                  <button onClick={() => setInputValue("What is your thinking process?")} className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-xs text-slate-300 hover:border-cyan-500/30 transition-all">"What is your thinking process?"</button>
                </div>
              </div>
            )}
            {chatHistory.map((chat, i) => (
              <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start items-start gap-4'}`}>
                {chat.role === 'model' && (
                  <div className="w-10 h-10 rounded-full border border-cyan-500/30 overflow-hidden shrink-0 mt-1">
                    <img src={persona.avatarUrl} alt={persona.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={`max-w-[80%] flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {chat.role === 'model' && (
                    <span className="text-cyan-400 text-[10px] font-mono uppercase tracking-[0.2em] mb-1 font-bold">
                      {persona.name}
                    </span>
                  )}
                  <div className={`p-4 rounded-2xl leading-relaxed text-[15px] ${
                    chat.role === 'user' 
                      ? 'bg-cyan-600 text-white rounded-tr-none' 
                      : 'bg-slate-900/80 border border-slate-800 text-slate-300 rounded-tl-none'
                  }`}>
                    {chat.role === 'model' ? (
                      <div className="markdown-content">
                        <ReactMarkdown>{chat.text}</ReactMarkdown>
                      </div>
                    ) : (
                      chat.text
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start items-start gap-4">
                <div className="w-10 h-10 rounded-full border border-cyan-500/30 overflow-hidden shrink-0 animate-pulse bg-slate-800">
                  <img src={persona.avatarUrl} alt={persona.name} className="w-full h-full object-cover opacity-50" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-cyan-400 text-[10px] font-mono uppercase tracking-[0.2em] mb-1 font-bold animate-pulse">
                    {persona.name}
                  </span>
                  <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl rounded-tl-none text-slate-500 text-xs flex gap-1 items-center">
                    <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce"></span>
                    <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-8 pt-0">
            <form onSubmit={handleSendMessage} className="relative group">
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full"></div>
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Train ${persona.name}...`}
                className="w-full bg-[#0f172a] border border-slate-800 rounded-full py-4 px-8 text-white focus:outline-none focus:border-cyan-500 transition-all relative z-10"
              />
              <button 
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-cyan-600 rounded-full text-white hover:bg-cyan-500 transition-all z-20 disabled:opacity-50 flex items-center justify-center"
                disabled={!inputValue.trim() || isTyping}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
              </button>
            </form>
            <p className="text-center text-slate-600 text-[10px] uppercase tracking-widest mt-4">Training session is persistent. Results update Agent Dossier in real-time.</p>
          </div>
        </main>

        {/* Right Sidebar: Studio / Outputs */}
        <aside className="w-80 border-l border-slate-800 bg-[#0f172a]/20 flex flex-col">
          <div className="p-6 space-y-8 flex-1 overflow-y-auto">
            <header className="flex items-center justify-between mb-4">
              <h2 className="text-slate-400 text-[10px] font-mono uppercase tracking-widest font-bold">Studio</h2>
              <div className="text-xs text-slate-600">4 Tools Available</div>
            </header>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Audio Brief', icon: '🎙️', action: 'Audio Overview', color: 'cyan' },
                { label: 'Video Dossier', icon: '🎥', action: 'Video Summary', color: 'purple' },
                { label: 'Mind Map', icon: '🕸️', action: 'Knowledge Graph', color: 'green' },
                { label: 'Report', icon: '📝', action: 'Detailed Report', color: 'amber' },
                { label: 'Quiz', icon: '❓', action: 'Expert Quiz', color: 'pink' },
                { label: 'Slide Deck', icon: '📊', action: 'Presentation Slides', color: 'blue' },
              ].map((tool, i) => (
                <button 
                  key={i} 
                  onClick={() => handleAction(tool.action)}
                  className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-cyan-500/40 hover:bg-slate-900 transition-all text-left flex flex-col gap-2 group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">{tool.icon}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{tool.label}</span>
                </button>
              ))}
            </div>

            <section className="pt-8">
              <h3 className="text-slate-400 text-[10px] font-mono uppercase tracking-widest font-bold mb-4">Saved Outputs</h3>
              <div className="space-y-3">
                <div className="p-4 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl text-center py-10">
                  <p className="text-slate-600 text-xs italic">No outputs generated yet.</p>
                  <p className="text-[10px] text-slate-700 mt-2 font-mono">Select a studio tool to begin.</p>
                </div>
              </div>
            </section>
          </div>
          
          <div className="p-6">
            <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-2">
              <span>📤</span> Export All Data
            </button>
          </div>
        </aside>
      </div>

      {/* Resource Recommendations Modal */}
      {showRecommendations && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Resources I Need</h3>
                <p className="text-slate-500 text-sm mt-1">
                  {persona.name}'s recommended resources and tools
                </p>
              </div>
              <button
                onClick={() => setShowRecommendations(false)}
                className="text-slate-500 hover:text-white text-xl transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loadingRecommendations ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-400 font-mono text-sm">{persona.name} is thinking...</p>
                </div>
              ) : autoPopulating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-white font-medium mb-2">Auto-populating resources...</p>
                  <p className="text-slate-400 font-mono text-sm">
                    {populateProgress.current}/{populateProgress.total}: {populateProgress.item}
                  </p>
                </div>
              ) : recommendations ? (
                <div className="space-y-6">
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <p className="text-slate-300 leading-relaxed">{recommendations.introduction}</p>
                  </div>
                  
                  {['capability', 'book', 'website', 'document', 'data'].map(category => {
                    const categoryResources = recommendations.resources.filter(r => r.category === category);
                    if (categoryResources.length === 0) return null;
                    
                    const categoryLabels: Record<string, string> = {
                      capability: 'Capabilities & Tools',
                      book: 'Books & Reading',
                      website: 'Websites & Resources',
                      document: 'Documents Needed',
                      data: 'Data Sources'
                    };
                    
                    return (
                      <div key={category}>
                        <h4 className="text-cyan-400 font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span>{getCategoryIcon(category)}</span>
                          {categoryLabels[category]}
                        </h4>
                        <div className="space-y-2">
                          {categoryResources.map((resource, idx) => (
                            <div 
                              key={idx}
                              className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-white font-medium">{resource.title}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(resource.priority)}`}>
                                      {resource.priority}
                                    </span>
                                  </div>
                                  <p className="text-slate-400 text-sm leading-relaxed">{resource.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
            
            <div className="p-4 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => setShowRecommendations(false)}
                className="flex-1 py-3 border border-slate-700 text-slate-400 rounded-xl text-sm font-medium hover:bg-slate-800 transition-all"
              >
                Close
              </button>
              <button
                onClick={handleAutoPopulate}
                disabled={autoPopulating || !recommendations || recommendations.resources.length === 0}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl text-sm font-bold hover:from-emerald-500 hover:to-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>🔄</span> Auto-Populate All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Resource View Modal */}
      {expandedResource && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getResourceIcon(expandedResource.resourceType)}</span>
                <div>
                  <h3 className="text-xl font-bold text-white">{expandedResource.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full uppercase">
                      {expandedResource.resourceType}
                    </span>
                    {expandedResource.isAttached && (
                      <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
                        ✓ Attached
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setExpandedResource(null)}
                className="text-slate-500 hover:text-white text-xl transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {expandedResource.description && (
                <div className="mb-4">
                  <h4 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Description</h4>
                  <p className="text-slate-300">{expandedResource.description}</p>
                </div>
              )}
              
              {expandedResource.content ? (
                <div>
                  <h4 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Content</h4>
                  <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                    <div className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
                      {expandedResource.content}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-slate-400">No content attached yet</p>
                  <p className="text-slate-500 text-sm mt-1">
                    This resource needs to be manually configured or uploaded
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={() => setExpandedResource(null)}
                className="w-full py-3 border border-slate-700 text-slate-400 rounded-xl text-sm font-medium hover:bg-slate-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingDashboard;
