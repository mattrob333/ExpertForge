import React from 'react';
import { Legend, LegendCategory } from '../types';
import { LEGEND_CATEGORIES } from '../data/legends';

interface HolographicLegendCardProps {
  legend: Legend;
  onClick?: () => void;
}

// Category accent colors (brighter, more vibrant for overlays)
const categoryAccents: Record<LegendCategory, string> = {
  innovation: 'from-violet-600 to-fuchsia-600',
  operations: 'from-orange-600 to-amber-600',
  growth: 'from-emerald-600 to-green-600',
  strategy: 'from-blue-600 to-cyan-600',
  product: 'from-pink-600 to-rose-600',
  leadership: 'from-amber-600 to-yellow-600',
  marketing: 'from-rose-600 to-pink-600',
  engineering: 'from-cyan-600 to-blue-600',
  sales: 'from-green-600 to-emerald-600',
};

// Category-specific metrics
const categoryMetrics: Record<LegendCategory, [string, string, string]> = {
  innovation: ['DISRUPTION', 'VISION', 'IMPACT'],
  operations: ['EFFICIENCY', 'SCALE', 'PROCESS'],
  growth: ['REVENUE', 'VELOCITY', 'RETENTION'],
  strategy: ['VISION', 'MOATS', 'UPSIDE'],
  product: ['UX', 'RETENTION', 'IMPACT'],
  leadership: ['CULTURE', 'VISION', 'INFLUENCE'],
  marketing: ['REACH', 'BRAND', 'CONVERSION'],
  engineering: ['SCALE', 'SPEED', 'QUALITY'],
  sales: ['CLOSING', 'PIPELINE', 'REVENUE'],
};

// Derive stats from legend data
const deriveStats = (legend: Legend) => {
  const mentalModelsCount = legend.thinkingStyle?.mentalModels?.length || legend.mentalModels?.length || 0;
  const beliefsCount = legend.worldview?.coreBeliefs?.length || legend.overview?.corePhilosophy?.length || 0;
  const masteryCount = legend.expertise?.deepMastery?.length || 0;
  
  // Base high stats for legends, with some variance based on their content depth
  return {
    metric1: Math.min(96 + Math.floor(mentalModelsCount * 0.5), 99),
    metric2: Math.min(95 + Math.floor(masteryCount * 0.8), 99),
    metric3: Math.min(97 + Math.floor(beliefsCount * 0.5), 99),
  };
};

const HolographicLegendCard: React.FC<HolographicLegendCardProps> = ({ legend, onClick }) => {
  const primaryCategory = legend.categories[0];
  const accent = categoryAccents[primaryCategory] || categoryAccents.strategy;
  const metrics = categoryMetrics[primaryCategory] || ['STRATEGY', 'EXECUTION', 'INSIGHT'];
  const stats = deriveStats(legend);
  
  // Get top 2 mental models without truncation
  const topModels = (legend.thinkingStyle?.mentalModels || legend.mentalModels || [])
    .slice(0, 2)
    .map(m => m.name);

  return (
    <button
      onClick={onClick}
      className="group relative flex-shrink-0 w-[340px] h-[500px] cursor-pointer text-left overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/20"
    >
      {/* 1. Full Background Image */}
      <div className="absolute inset-0">
        <img 
          src={legend.photo} 
          alt={legend.name}
          className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
        />
        {/* Gradient overlay to ensure text readability at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent opacity-90 group-hover:opacity-80 transition-opacity"></div>
        <div className={`absolute inset-0 bg-gradient-to-t ${accent} opacity-0 mix-blend-overlay group-hover:opacity-40 transition-opacity duration-500`}></div>
      </div>

      {/* 2. Content Container - Bottom Aligned */}
      <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col gap-5">
        
        {/* Identity Section */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold uppercase tracking-widest bg-gradient-to-r ${accent} bg-clip-text text-transparent`}>
              {LEGEND_CATEGORIES[primaryCategory]?.label || 'Legend'}
            </span>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <span key={i} className="text-amber-400 text-xs">★</span>
              ))}
            </div>
          </div>
          
          <h2 className="text-4xl font-black text-white leading-none tracking-tight mb-2 drop-shadow-lg">
            {legend.name}
          </h2>
          <p className="text-white/90 text-sm font-medium leading-relaxed drop-shadow-md border-l-2 border-white/30 pl-3">
            {legend.title}
          </p>
        </div>

        {/* Categories / Problem Solvers */}
        <div className="flex flex-wrap gap-2">
          {legend.categories.slice(0, 3).map(cat => (
            <span 
              key={cat} 
              className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-xs font-semibold text-white uppercase tracking-wide"
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Stats Section - Category Specific Labels */}
        <div className="grid grid-cols-3 gap-2 bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/5">
          <div className="text-center border-r border-white/10">
            <div className="text-2xl font-black text-cyan-400">{stats.metric1}</div>
            <div className="text-[9px] font-bold text-slate-300 uppercase tracking-wider mt-1">{metrics[0]}</div>
          </div>
          <div className="text-center border-r border-white/10">
            <div className="text-2xl font-black text-emerald-400">{stats.metric2}</div>
            <div className="text-[9px] font-bold text-slate-300 uppercase tracking-wider mt-1">{metrics[1]}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-purple-400">{stats.metric3}</div>
            <div className="text-[9px] font-bold text-slate-300 uppercase tracking-wider mt-1">{metrics[2]}</div>
          </div>
        </div>

        {/* Top Mental Models - Full Text */}
        <div className="flex flex-col gap-2">
          {topModels.map((model, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${accent}`}></span>
              <span className="text-sm text-white/80 font-medium truncate">{model}</span>
            </div>
          ))}
        </div>

      </div>

      {/* Hover Reveal: View Profile CTA */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
        <span className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
          View Profile
        </span>
      </div>
    </button>
  );
};

export default HolographicLegendCard;
