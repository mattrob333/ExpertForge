import React from 'react';
import { Legend } from '../types';
import { LEGEND_CATEGORIES } from '../data/legends';

interface LegendCardProps {
  legend: Legend;
  onView: (legend: Legend) => void;
  onDraft?: (legend: Legend) => void;
  compact?: boolean;
}

const LegendCard: React.FC<LegendCardProps> = ({ legend, onView, onDraft, compact = false }) => {
  const primaryCategory = legend.categories[0];
  const categoryInfo = LEGEND_CATEGORIES[primaryCategory];
  
  // Rank badge colors
  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-amber-600 text-black';
    if (rank === 2) return 'bg-gradient-to-br from-slate-300 to-slate-500 text-black';
    if (rank === 3) return 'bg-gradient-to-br from-orange-400 to-orange-700 text-white';
    return 'bg-slate-700 text-slate-300';
  };

  return (
    <div 
      className={`group relative bg-[#1e293b] border border-slate-700 rounded-xl overflow-hidden transition-all duration-300 hover:border-cyan-500/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10 flex flex-col ${compact ? 'min-h-[320px] w-52' : 'min-h-[380px] w-72'}`}
    >
      {/* Rank Badge */}
      <div className={`absolute top-3 left-3 z-10 w-8 h-8 rounded-lg ${getRankStyle(legend.rank)} flex items-center justify-center font-bold text-sm shadow-lg`}>
        #{legend.rank}
      </div>
      
      {/* Legend Star Badge */}
      <div className="absolute top-3 right-3 z-10">
        <span className="text-amber-400 text-lg">⭐</span>
      </div>

      {/* Photo Section */}
      <div className={`relative ${compact ? 'h-32' : 'h-40'} bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden`}>
        {legend.photo ? (
          <img 
            src={legend.photo} 
            alt={legend.name}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            {legend.name.split(' ').map(n => n[0]).join('')}
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b] via-transparent to-transparent"></div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1">
        {/* Name */}
        <h3 className={`font-bold text-white ${compact ? 'text-base' : 'text-lg'}`}>
          {legend.name}
        </h3>
        
        {/* Title */}
        <p className={`text-cyan-400 italic mt-1 ${compact ? 'text-xs' : 'text-sm'}`}>
          "{legend.title}"
        </p>

        {/* Category Tags */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {legend.categories.slice(0, 2).map((cat) => {
            const catInfo = LEGEND_CATEGORIES[cat];
            return (
              <span 
                key={cat}
                className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded-full flex items-center gap-1"
              >
                <span>{catInfo.emoji}</span>
                <span className="capitalize">{cat}</span>
              </span>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto pt-3">
          <button
            onClick={() => onView(legend)}
            className="flex-1 py-2 px-3 border border-slate-600 rounded-lg text-slate-300 text-xs font-medium uppercase tracking-wider hover:border-cyan-500 hover:text-cyan-400 transition-all"
          >
            View
          </button>
          {onDraft && (
            <button
              onClick={() => onDraft(legend)}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg text-white text-xs font-bold uppercase tracking-wider hover:from-cyan-500 hover:to-purple-500 transition-all shadow-lg shadow-cyan-900/20"
            >
              Hire
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegendCard;
