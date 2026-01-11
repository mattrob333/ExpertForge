import React from 'react';
import { ExpertPersona, Legend, LegendCategory } from '../types';
import { LEGEND_CATEGORIES } from '../data/legends';

interface UnifiedProfileCardProps {
  persona?: ExpertPersona;
  legend?: Legend;
  onClick?: () => void;
  variant?: 'full' | 'compact' | 'mini';
}

// Category accent colors
const categoryAccents: Record<LegendCategory | string, string> = {
  innovation: 'from-violet-600 to-fuchsia-600',
  operations: 'from-orange-600 to-amber-600',
  growth: 'from-emerald-600 to-green-600',
  strategy: 'from-blue-600 to-cyan-600',
  product: 'from-pink-600 to-rose-600',
  leadership: 'from-amber-600 to-yellow-600',
  marketing: 'from-rose-600 to-pink-600',
  engineering: 'from-cyan-600 to-blue-600',
  sales: 'from-green-600 to-emerald-600',
  // Department colors for personas
  Executive: 'from-amber-600 to-yellow-600',
  Sales: 'from-green-600 to-emerald-600',
  Marketing: 'from-rose-600 to-pink-600',
  Operations: 'from-orange-600 to-amber-600',
  Finance: 'from-blue-600 to-indigo-600',
  Technology: 'from-cyan-600 to-blue-600',
  'Human Resources': 'from-purple-600 to-violet-600',
  Strategy: 'from-blue-600 to-cyan-600',
  Product: 'from-pink-600 to-rose-600',
  Legal: 'from-slate-600 to-gray-600',
  default: 'from-cyan-600 to-purple-600',
};

// Normalize data from either persona or legend
const normalizeProfile = (persona?: ExpertPersona, legend?: Legend) => {
  if (legend) {
    const mentalModels = legend.thinkingStyle?.mentalModels || legend.mentalModels || [];
    const beliefs = legend.worldview?.coreBeliefs || legend.overview?.corePhilosophy || [];
    const mastery = legend.expertise?.deepMastery || [];
    
    return {
      id: legend.id,
      name: legend.name,
      title: legend.title,
      essence: legend.identity?.essence || '',
      avatar: legend.photo,
      isLegend: true,
      categories: legend.categories,
      department: legend.categories[0] as string,
      stats: {
        models: mentalModels.length,
        beliefs: beliefs.length,
        mastery: mastery.length,
      },
      topModels: mentalModels.slice(0, 2).map(m => m.name),
      expertise: mastery.slice(0, 3),
    };
  }
  
  if (persona) {
    return {
      id: persona.id,
      name: persona.name,
      title: persona.role || persona.department || 'AI Expert',
      essence: persona.essence,
      avatar: persona.avatarUrl || `https://picsum.photos/seed/${encodeURIComponent(persona.name)}/400/400`,
      isLegend: persona.isLegend || false,
      categories: persona.category ? [persona.category] : [],
      department: persona.department || persona.category || 'default',
      stats: {
        models: persona.thinking?.mentalModels?.length || 0,
        beliefs: persona.coreBeliefs?.length || 0,
        mastery: persona.expertiseMap?.deepMastery?.length || 0,
      },
      topModels: persona.thinking?.mentalModels?.slice(0, 2).map(m => m.name) || [],
      expertise: persona.expertiseMap?.deepMastery?.slice(0, 3) || [],
    };
  }
  
  return null;
};

const UnifiedProfileCard: React.FC<UnifiedProfileCardProps> = ({ 
  persona, 
  legend, 
  onClick,
  variant = 'full' 
}) => {
  const profile = normalizeProfile(persona, legend);
  
  if (!profile) return null;
  
  const accent = categoryAccents[profile.department] || categoryAccents.default;
  
  // Mini variant - small avatar with name
  if (variant === 'mini') {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
          profile.isLegend 
            ? 'bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60' 
            : 'bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50'
        }`}
      >
        <img 
          src={profile.avatar} 
          alt={profile.name}
          className={`w-6 h-6 rounded-full object-cover border ${
            profile.isLegend ? 'border-amber-500/50' : 'border-cyan-500/30'
          }`}
        />
        <span className={`text-xs font-medium ${profile.isLegend ? 'text-amber-400' : 'text-white'}`}>
          {profile.name.split(' ')[0]}
        </span>
      </button>
    );
  }
  
  // Compact variant - horizontal card
  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        className={`group relative flex items-center gap-4 p-4 rounded-2xl transition-all text-left overflow-hidden ${
          profile.isLegend 
            ? 'bg-gradient-to-r from-amber-900/20 to-orange-900/10 border border-amber-500/30 hover:border-amber-500/60 hover:shadow-lg hover:shadow-amber-900/20' 
            : 'bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-900/20'
        }`}
      >
        <div className={`relative shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 ${
          profile.isLegend ? 'border-amber-500/50' : 'border-cyan-500/30'
        }`}>
          <img 
            src={profile.avatar} 
            alt={profile.name}
            className="w-full h-full object-cover"
          />
          {profile.isLegend && (
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-amber-500 rounded-tl-lg flex items-center justify-center">
              <span className="text-[8px]">★</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-bold truncate ${profile.isLegend ? 'text-amber-400' : 'text-white'}`}>
              {profile.name}
            </h3>
            {profile.isLegend && (
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[8px] font-bold uppercase rounded">
                Legend
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm truncate">{profile.title}</p>
          {profile.expertise.length > 0 && (
            <div className="flex gap-1 mt-2">
              {profile.expertise.slice(0, 2).map((skill, i) => (
                <span key={i} className="px-2 py-0.5 bg-slate-900/50 text-slate-500 text-[10px] rounded-full truncate max-w-[100px]">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <svg className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    );
  }
  
  // Full variant - holographic card style
  return (
    <button
      onClick={onClick}
      className="group relative flex-shrink-0 w-[320px] h-[460px] cursor-pointer text-left overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/20"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={profile.avatar} 
          alt={profile.name}
          className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent opacity-90 group-hover:opacity-80 transition-opacity"></div>
        <div className={`absolute inset-0 bg-gradient-to-t ${accent} opacity-0 mix-blend-overlay group-hover:opacity-40 transition-opacity duration-500`}></div>
      </div>

      {/* Legend Badge */}
      {profile.isLegend && (
        <div className="absolute top-4 left-4 px-3 py-1 bg-amber-500/20 backdrop-blur-md border border-amber-500/40 rounded-full flex items-center gap-1.5">
          <span className="text-amber-400 text-xs">★</span>
          <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">Legend</span>
        </div>
      )}

      {/* Content Container */}
      <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col gap-4">
        
        {/* Identity Section */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold uppercase tracking-widest bg-gradient-to-r ${accent} bg-clip-text text-transparent`}>
              {profile.department}
            </span>
            {profile.isLegend && (
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <span key={i} className="text-amber-400 text-xs">★</span>
                ))}
              </div>
            )}
          </div>
          
          <h2 className="text-3xl font-black text-white leading-none tracking-tight mb-2 drop-shadow-lg">
            {profile.name}
          </h2>
          <p className="text-white/90 text-sm font-medium leading-relaxed drop-shadow-md border-l-2 border-white/30 pl-3">
            {profile.title}
          </p>
        </div>

        {/* Expertise Tags */}
        {profile.expertise.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.expertise.map((skill, i) => (
              <span 
                key={i} 
                className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-xs font-semibold text-white uppercase tracking-wide"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-2 bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/5">
          <div className="text-center border-r border-white/10">
            <div className="text-2xl font-black text-cyan-400">{profile.stats.models}</div>
            <div className="text-[9px] font-bold text-slate-300 uppercase tracking-wider mt-1">Models</div>
          </div>
          <div className="text-center border-r border-white/10">
            <div className="text-2xl font-black text-emerald-400">{profile.stats.mastery}</div>
            <div className="text-[9px] font-bold text-slate-300 uppercase tracking-wider mt-1">Mastery</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-purple-400">{profile.stats.beliefs}</div>
            <div className="text-[9px] font-bold text-slate-300 uppercase tracking-wider mt-1">Beliefs</div>
          </div>
        </div>

        {/* Mental Models */}
        {profile.topModels.length > 0 && (
          <div className="flex flex-col gap-2">
            {profile.topModels.map((model, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${accent}`}></span>
                <span className="text-sm text-white/80 font-medium truncate">{model}</span>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Hover CTA */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
        <span className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
          View Profile
        </span>
      </div>
    </button>
  );
};

export default UnifiedProfileCard;
