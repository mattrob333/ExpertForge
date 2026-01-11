
import React, { useState } from 'react';
import { PersonalityDirection } from '../types';

interface ExpertFormProps {
  onSubmit: (description: string, direction?: PersonalityDirection) => void;
}

const ExpertForm: React.FC<ExpertFormProps> = ({ onSubmit }) => {
  const [description, setDescription] = useState('');
  const [direction, setDirection] = useState<PersonalityDirection | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim()) {
      onSubmit(description, direction);
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-colors">
        {/* Holographic Sheen */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-cyan-500/10 via-purple-500/10 to-transparent blur-[100px] opacity-30 pointer-events-none rounded-full -translate-y-1/2 translate-x-1/2"></div>
        
        {/* Top Border Gradient */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50"></div>

        <header className="mb-8 relative z-10">
          <h3 className="text-3xl font-black text-white mb-2 tracking-tight">
            Summon Your Expert
          </h3>
          <p className="text-slate-400 text-sm font-mono uppercase tracking-wider opacity-80 flex items-center gap-2">
            <span className="text-cyan-400">⚡</span> Create a custom persona OR summon a famous figure
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 'Create Elon Musk' OR 'A grumpy database architect with 30 years of SQL experience'..."
              className="w-full h-40 bg-[#020617]/60 border border-slate-800 rounded-2xl p-6 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:bg-[#020617]/80 focus:ring-1 focus:ring-cyan-500/50 transition-all duration-300 resize-none text-lg leading-relaxed shadow-inner"
            />
            <p className="text-[10px] text-slate-500 font-mono text-right uppercase tracking-widest">
              AI will research real people or invent new ones based on your prompt
            </p>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-mono text-slate-500 uppercase tracking-widest block">
              Personality Direction (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.values(PersonalityDirection).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDirection(direction === p ? undefined : p)}
                  className={`px-4 py-2 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all duration-300 border ${
                    direction === p
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold py-5 rounded-2xl shadow-lg shadow-cyan-900/20 transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-3 text-lg border-t border-white/20"
          >
            <span className="text-xl">✨</span> Begin Synthesis
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExpertForm;
