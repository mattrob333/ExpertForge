
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
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden group">
        {/* Glow Effect Overlay */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
        
        <header className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-2">
            Summon Your Expert
          </h3>
          <p className="text-slate-400 text-sm font-mono uppercase tracking-wider opacity-80">
            Define the persona and capabilities of your new advisor
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., A grumpy but brilliant database architect who's seen every way SQL can go wrong over 30 years and has strong opinions about ORMs..."
              className="w-full h-40 bg-[#020617] border border-slate-800 rounded-2xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-300 resize-none text-lg"
            />
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
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 glow-cyan'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-cyan-500/20 transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 text-lg"
          >
            <span className="text-xl">✨</span> Begin Synthesis
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExpertForm;
