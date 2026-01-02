
import React, { useState, useEffect, useRef } from 'react';
import { ExpertPersona } from '../types';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';

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
  onClose: () => void;
  onBrowseLegends: () => void;
}

const TeamChat: React.FC<TeamChatProps> = ({ experts, activeAdvisor, onClose, onBrowseLegends }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState<string[]>([]); // Array of advisor names currently typing
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `User said: "${userText}". Context of conversation: ${messages.slice(-5).map(m => m.text).join('\n')}. 
          Respond as ${advisor.name} (${advisor.essence}). Use your signature expressions like: ${advisor.personality.signatureExpressions.join(', ')}. 
          Stay in character. Your core beliefs: ${advisor.coreBeliefs.join('. ')}. Respond in Markdown.`,
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
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Active Board</h3>
          <span className="text-[10px] text-cyan-500 font-mono">{experts.length} Online</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {experts.map(exp => (
            <button
              key={exp.id}
              onClick={() => addMention(exp.name)}
              className="w-full p-3 rounded-xl flex items-center gap-3 hover:bg-slate-800/50 transition-all group text-left"
            >
              <div className={`relative shrink-0 w-10 h-10 rounded-full border-2 ${exp.isLegend ? 'border-amber-500/50' : 'border-cyan-500/30'} overflow-hidden`}>
                <img src={exp.avatarUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#020617] rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold truncate ${exp.isLegend ? 'text-amber-400' : 'text-white'}`}>{exp.name}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-tighter truncate">{exp.role || 'Advisor'}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-slate-800">
           <button onClick={onBrowseLegends} className="w-full py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 hover:text-cyan-400 transition-colors">
             + Draft Advisor
           </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative">
        <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>
        
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
          <div className="max-w-4xl mx-auto">
            {/* Quick Mentions */}
            <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
              {experts.map(exp => (
                <button 
                  key={exp.id}
                  onClick={() => addMention(exp.name)}
                  className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[10px] font-mono text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-all whitespace-nowrap"
                >
                  @{exp.name.split(' ')[0]}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="relative group">
              <div className="absolute inset-0 bg-cyan-500/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full"></div>
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="@mention advisors to ask them questions..."
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
    </div>
  );
};

export default TeamChat;
