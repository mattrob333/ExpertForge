
import React, { useState, useEffect, useRef } from 'react';
import { ExpertPersona, ExpertCategory } from '../types';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';

// Infer category from expert's essence/role if not set
const inferCategory = (expert: ExpertPersona): ExpertCategory => {
  if (expert.category) return expert.category;
  
  const text = `${expert.essence || ''} ${expert.role || ''} ${expert.expertiseMap?.deepMastery?.join(' ') || ''}`.toLowerCase();
  
  if (text.includes('marketing') || text.includes('brand') || text.includes('content') || text.includes('social media') || text.includes('viral') || text.includes('narrative')) return 'marketing';
  if (text.includes('sales') || text.includes('revenue') || text.includes('closing') || text.includes('deals')) return 'sales';
  if (text.includes('engineer') || text.includes('developer') || text.includes('coding') || text.includes('software') || text.includes('technical')) return 'engineering';
  if (text.includes('product') || text.includes('ux') || text.includes('user experience')) return 'product';
  if (text.includes('finance') || text.includes('accounting') || text.includes('investment') || text.includes('capital')) return 'finance';
  if (text.includes('operation') || text.includes('logistics') || text.includes('supply chain') || text.includes('process')) return 'operations';
  if (text.includes('hr') || text.includes('human resource') || text.includes('talent') || text.includes('recruit') || text.includes('people')) return 'hr';
  if (text.includes('legal') || text.includes('compliance') || text.includes('contract') || text.includes('law')) return 'legal';
  if (text.includes('consult') || text.includes('advisor') || text.includes('strategic')) return 'consulting';
  if (text.includes('strategy') || text.includes('growth') || text.includes('vision') || text.includes('business development')) return 'strategy';
  if (text.includes('design') || text.includes('creative') || text.includes('visual') || text.includes('aesthetic')) return 'design';
  if (text.includes('data') || text.includes('analytics') || text.includes('intelligence') || text.includes('insight')) return 'data';
  if (text.includes('leader') || text.includes('ceo') || text.includes('executive') || text.includes('founder') || text.includes('director')) return 'leadership';
  
  return 'consulting'; // Default to consulting for advisors
};

// Category color mapping
const CATEGORY_COLORS: Record<ExpertCategory, { bg: string; text: string; border: string }> = {
  marketing: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
  sales: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  engineering: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  product: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  finance: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  operations: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  hr: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
  legal: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
  consulting: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  strategy: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  design: { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30' },
  data: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30' },
  leadership: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  general: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
};

interface Message {
  id: string;
  role: 'user' | 'advisor';
  advisorId?: string;
  advisorName?: string;
  advisorAvatar?: string;
  isLegend?: boolean;
  text: string;
  timestamp: Date;
}

interface TeamChatProps {
  experts: ExpertPersona[];
  activeAdvisor?: ExpertPersona | null;
  initialMessage?: string;
  onClose: () => void;
  onBrowseLegends: () => void;
}

const TeamChat: React.FC<TeamChatProps> = ({ experts, activeAdvisor, initialMessage, onClose, onBrowseLegends }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState<string[]>([]); // Array of advisor names currently typing
  const [hoveredExpert, setHoveredExpert] = useState<ExpertPersona | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [showMentionDrawer, setShowMentionDrawer] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [hasSentInitial, setHasSentInitial] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get unique departments from experts
  const departments = ['all', ...Array.from(new Set(experts.map(e => {
    const cat = inferCategory(e);
    return cat;
  })))];

  // Filter experts by selected department
  const departmentFilteredExperts = selectedDepartment === 'all' 
    ? experts 
    : experts.filter(e => inferCategory(e) === selectedDepartment);

  // Sort experts: Legends first, then others
  const sortedExperts = [...experts].sort((a, b) => {
    if (a.isLegend && !b.isLegend) return -1;
    if (!a.isLegend && b.isLegend) return 1;
    return 0;
  });

  // Separate legends and regular experts for sidebar
  const legends = sortedExperts.filter(e => e.isLegend);
  const regularExperts = sortedExperts.filter(e => !e.isLegend);

  // Filter experts for mention drawer
  const filteredExperts = sortedExperts.filter(exp =>
    exp.name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  // Handle @ detection in input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Check if user just typed @ or is typing after @
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = value.substring(lastAtIndex + 1);
      // Show drawer if @ is at end or followed by text without space
      if (!textAfterAt.includes(' ')) {
        setShowMentionDrawer(true);
        setMentionFilter(textAfterAt);
      } else {
        setShowMentionDrawer(false);
        setMentionFilter('');
      }
    } else {
      setShowMentionDrawer(false);
      setMentionFilter('');
    }
  };

  // Handle mention selection from drawer
  const selectMention = (expert: ExpertPersona) => {
    const lastAtIndex = inputValue.lastIndexOf('@');
    const beforeAt = inputValue.substring(0, lastAtIndex);
    const newValue = `${beforeAt}@${expert.name.split(' ')[0]} `;
    setInputValue(newValue);
    setShowMentionDrawer(false);
    setMentionFilter('');
    inputRef.current?.focus();
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-send initial message when provided
  useEffect(() => {
    if (initialMessage && !hasSentInitial && activeAdvisor && experts.length > 0) {
      setHasSentInitial(true);
      // Small delay to ensure component is mounted
      const timer = setTimeout(() => {
        sendMessageProgrammatically(initialMessage);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialMessage, hasSentInitial, activeAdvisor, experts]);

  // Programmatic message send (for initial message auto-send)
  const sendMessageProgrammatically = async (messageText: string) => {
    if (!messageText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);

    // Use active advisor or first expert
    const advisor = activeAdvisor || experts[0];
    if (!advisor) return;

    setIsTyping(prev => [...prev, advisor.name]);
    
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `User said: "${messageText}". 
        Respond as ${advisor.name} (${advisor.essence || ''}). ${advisor.personality?.signatureExpressions ? `Use your signature expressions like: ${advisor.personality.signatureExpressions.join(', ')}.` : ''} 
        Stay in character. ${advisor.coreBeliefs ? `Your core beliefs: ${advisor.coreBeliefs.join('. ')}.` : ''} Respond in Markdown.`,
        config: {
          systemInstruction: `You are ${advisor.name}, a member of an elite AI advisory board. You are direct, expert, and consistent with your persona.`,
        }
      });

      const advisorMsg: Message = {
        id: Math.random().toString(),
        role: 'advisor',
        advisorId: advisor.id,
        advisorName: advisor.name,
        advisorAvatar: advisor.avatarUrl,
        isLegend: advisor.isLegend,
        text: response.text || "I'm processing that...",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, advisorMsg]);
    } catch (err) {
      console.error('Error generating response:', err);
    } finally {
      setIsTyping(prev => prev.filter(name => name !== advisor.name));
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue('');

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);

    // Parse mentions like @Bezos or @Jobs
    const mentionedAdvisors = experts.filter(exp => 
      userText.toLowerCase().includes(`@${exp.name.split(' ')[0].toLowerCase()}`) ||
      userText.toLowerCase().includes(`@${exp.name.toLowerCase().replace(/\s/g, '')}`)
    );

    // If no specific mention, use the active advisor (if set) or first expert
    const defaultAdvisor = activeAdvisor || (experts.length > 0 ? experts[0] : null);
    const targets = mentionedAdvisors.length > 0 ? mentionedAdvisors : (defaultAdvisor ? [defaultAdvisor] : []);

    if (targets.length === 0) return;

    // Trigger sequential or parallel responses
    for (const advisor of targets) {
      setIsTyping(prev => [...prev, advisor.name]);
      
      try {
        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: `User said: "${userText}". Context of conversation: ${messages.slice(-5).map(m => m.text).join('\n')}. 
          Respond as ${advisor.name} (${advisor.essence || ''}). ${advisor.personality?.signatureExpressions ? `Use your signature expressions like: ${advisor.personality.signatureExpressions.join(', ')}.` : ''} 
          Stay in character. ${advisor.coreBeliefs ? `Your core beliefs: ${advisor.coreBeliefs.join('. ')}.` : ''} Respond in Markdown.`,
          config: {
            systemInstruction: `You are ${advisor.name}, a member of an elite AI advisory board. You are direct, expert, and consistent with your persona.`,
          }
        });

        const advisorMsg: Message = {
          id: Math.random().toString(),
          role: 'advisor',
          advisorId: advisor.id,
          advisorName: advisor.name,
          advisorAvatar: advisor.avatarUrl,
          isLegend: advisor.isLegend,
          text: response.text || "I'm processing that...",
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, advisorMsg]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsTyping(prev => prev.filter(name => name !== advisor.name));
      }
    }
  };

  const addMention = (name: string) => {
    const mention = `@${name.split(' ')[0]} `;
    if (!inputValue.includes(mention)) {
      setInputValue(prev => prev + mention);
    }
  };

  if (experts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center text-4xl border border-slate-800">
          👥
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">You haven&apos;t drafted any advisors yet</h2>
          <p className="text-slate-500 max-w-sm mx-auto">Build your team to start high-level group conversations and strategic debates.</p>
        </div>
        <button 
          onClick={onBrowseLegends}
          className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transition-all"
        >
          Browse Legends
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden w-full h-full bg-[#020617]">
      {/* Sidebar: Advisors List */}
      <aside className="w-72 border-r border-slate-800 bg-[#0f172a]/20 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Active Board</h3>
          <span className="text-[10px] text-cyan-500 font-mono">{experts.length} Online</span>
        </div>
        
        {/* Legends Section - Always at Top */}
        {legends.length > 0 && (
          <div className="border-b border-amber-500/20">
            <div className="px-4 py-2 bg-gradient-to-r from-amber-500/10 to-transparent">
              <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest font-bold">🏆 Legends</span>
            </div>
            <div className="p-2 space-y-1">
              {legends.map(exp => {
                const category = inferCategory(exp);
                const colors = CATEGORY_COLORS[category];
                return (
                  <div
                    key={exp.id}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPos({ x: rect.right + 8, y: rect.top });
                      setHoveredExpert(exp);
                    }}
                    onMouseLeave={() => setHoveredExpert(null)}
                  >
                    <button
                      onClick={() => addMention(exp.name)}
                      className="w-full p-2.5 rounded-lg flex items-center gap-3 hover:bg-amber-500/10 transition-all text-left border border-transparent hover:border-amber-500/30"
                    >
                      <div className="relative shrink-0 w-9 h-9 rounded-full border-2 border-amber-500/50 overflow-hidden shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                        <img src={exp.avatarUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-[#020617] rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate text-amber-400">{exp.name}</p>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${colors.bg} ${colors.text}`}>
                          {category}
                        </span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Regular Experts Section */}
        <div className="flex-1 overflow-y-auto">
          {regularExperts.length > 0 && (
            <>
              <div className="px-4 py-2">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Your Experts</span>
              </div>
              <div className="px-2 pb-2 space-y-1">
                {regularExperts.map(exp => {
                  const category = inferCategory(exp);
                  const colors = CATEGORY_COLORS[category];
                  return (
                    <div
                      key={exp.id}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltipPos({ x: rect.right + 8, y: rect.top });
                        setHoveredExpert(exp);
                      }}
                      onMouseLeave={() => setHoveredExpert(null)}
                    >
                      <button
                        onClick={() => addMention(exp.name)}
                        className="w-full p-2.5 rounded-lg flex items-center gap-3 hover:bg-slate-800/50 transition-all text-left"
                      >
                        <div className="relative shrink-0 w-9 h-9 rounded-full border-2 border-cyan-500/30 overflow-hidden">
                          <img src={exp.avatarUrl} alt="" className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-[#020617] rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate text-white">{exp.name}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${colors.bg} ${colors.text}`}>
                            {category}
                          </span>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Add Sources Panel */}
        <div className="border-t border-slate-800">
          <div className="p-3">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold mb-2">📎 Add Sources</div>
            <div className="space-y-2">
              <button className="w-full p-2 rounded-lg border border-dashed border-slate-700 text-slate-500 text-[10px] font-mono hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-500/5 transition-all flex items-center justify-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Drop Files or URLs
              </button>
            </div>
          </div>
          <div className="p-3 pt-0">
            <button onClick={onBrowseLegends} className="w-full py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 hover:text-cyan-400 transition-colors border border-slate-800 rounded-lg hover:border-cyan-500/50">
              + Draft Advisor
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative">
        <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>
        
        {/* Department Filter Bar */}
        <div className="px-8 py-3 border-b border-slate-800/50 flex items-center gap-3 relative z-10 bg-[#020617]/80 backdrop-blur-sm">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Filter by Department:</span>
          <div className="flex flex-wrap gap-2">
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all ${
                  selectedDepartment === dept
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                {dept === 'all' ? '👥 Full Team' : `${CATEGORY_COLORS[dept as ExpertCategory]?.text?.replace('text-', '').replace('-400', '') || ''} ${dept}`}
              </button>
            ))}
          </div>
          {selectedDepartment !== 'all' && (
            <span className="ml-auto text-[10px] text-cyan-400 font-mono">
              {departmentFilteredExperts.length} member{departmentFilteredExperts.length !== 1 ? 's' : ''} in {selectedDepartment}
            </span>
          )}
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 relative z-10">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.3em]">Board Room Encrypted</p>
              <p className="text-sm mt-2">Mention an advisor like @{experts[0].name.split(' ')[0]} to start the session.</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start gap-4 animate-in fade-in slide-in-from-left-2 duration-300'}`}>
              {msg.role === 'advisor' && (
                <div className={`shrink-0 w-10 h-10 rounded-full border-2 ${msg.isLegend ? 'border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'border-cyan-500/30'} overflow-hidden`}>
                  <img src={msg.advisorAvatar} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              
              <div className={`max-w-[80%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.role === 'advisor' && (
                  <span className={`text-[10px] font-mono uppercase tracking-widest mb-1 font-bold ${msg.isLegend ? 'text-amber-400' : 'text-cyan-400'}`}>
                    {msg.advisorName} {msg.isLegend && '🏆'}
                  </span>
                )}
                <div className={`p-4 rounded-2xl text-[15px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-cyan-600 text-white rounded-tr-none shadow-lg shadow-cyan-900/10'
                    : 'bg-slate-900/60 border border-slate-800 text-slate-300 rounded-tl-none backdrop-blur-sm'
                }`}>
                  <div className="markdown-content">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
                <span className="text-[9px] text-slate-600 mt-1 font-mono">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}

          {isTyping.map(name => (
            <div key={name} className="flex justify-start items-start gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700"></div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">{name} is thinking...</span>
                <div className="bg-slate-900/40 border border-slate-800 p-3 rounded-2xl rounded-tl-none w-16 flex gap-1 items-center">
                  <span className="w-1 h-1 bg-slate-600 rounded-full animate-bounce"></span>
                  <span className="w-1 h-1 bg-slate-600 rounded-full animate-bounce delay-100"></span>
                  <span className="w-1 h-1 bg-slate-600 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-8 pt-0 relative z-10">
          <div className="max-w-4xl mx-auto relative">
            {/* @Mention Drawer - appears above input */}
            {showMentionDrawer && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="p-3 border-b border-slate-800">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Select an advisor to mention</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {filteredExperts.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-sm">No matching advisors</div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredExperts.map(exp => {
                        const category = inferCategory(exp);
                        const colors = CATEGORY_COLORS[category];
                        return (
                          <button
                            key={exp.id}
                            onClick={() => selectMention(exp)}
                            className="w-full p-3 rounded-lg flex items-center gap-3 hover:bg-slate-800 transition-all text-left"
                          >
                            <div className={`relative shrink-0 w-10 h-10 rounded-full border-2 ${exp.isLegend ? 'border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.2)]' : 'border-cyan-500/30'} overflow-hidden`}>
                              <img src={exp.avatarUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold truncate ${exp.isLegend ? 'text-amber-400' : 'text-white'}`}>
                                {exp.name}
                                {exp.isLegend && <span className="ml-1.5 text-[10px]">🏆</span>}
                              </p>
                              <p className="text-slate-500 text-xs truncate">{exp.essence}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${colors.bg} ${colors.text}`}>
                              {category}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="relative group">
              <div className="absolute inset-0 bg-cyan-500/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full"></div>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowMentionDrawer(false);
                  }
                }}
                placeholder="Type @ to mention advisors..."
                className="w-full bg-[#0f172a] border border-slate-800 rounded-full py-4 px-8 text-white focus:outline-none focus:border-cyan-500 transition-all relative z-10"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isTyping.length > 0}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-cyan-600 rounded-full text-white hover:bg-cyan-500 transition-all z-20 disabled:opacity-50 flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Fixed position tooltip - appears on top of everything */}
      {hoveredExpert && (
        <div 
          className="fixed w-72 p-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[9999] pointer-events-none"
          style={{ 
            left: Math.min(tooltipPos.x, window.innerWidth - 300),
            top: Math.min(tooltipPos.y, window.innerHeight - 200)
          }}
        >
          <p className="text-white font-bold text-sm">{hoveredExpert.name}</p>
          <p className="text-cyan-400 text-xs mb-3">{hoveredExpert.essence}</p>
          {hoveredExpert.expertiseMap?.deepMastery && hoveredExpert.expertiseMap.deepMastery.length > 0 && (
            <div className="mb-3">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1.5">Deep Mastery</p>
              <div className="flex flex-wrap gap-1">
                {hoveredExpert.expertiseMap.deepMastery.slice(0, 4).map((skill, i) => (
                  <span key={i} className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] rounded">{skill}</span>
                ))}
              </div>
            </div>
          )}
          {hoveredExpert.coreBeliefs && hoveredExpert.coreBeliefs.length > 0 && (
            <div>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1.5">Core Belief</p>
              <p className="text-slate-300 text-[11px] italic leading-relaxed">"{hoveredExpert.coreBeliefs[0]}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamChat;
