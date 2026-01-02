import React, { useState, useMemo } from 'react';
import { Legend, LegendCategory } from '../types';
import { LEGENDS, LEGEND_CATEGORIES, getLegendsByCategory, searchLegends, getAllCategories } from '../data/legends';
import LegendCard from './LegendCard';

interface LegendsLibraryProps {
  onSelectLegend: (legend: Legend) => void;
  onDraftLegend?: (legend: Legend) => void;
  onBack: () => void;
  draftingForRole?: string; // When coming from TeamBuilder
}

const LegendsLibrary: React.FC<LegendsLibraryProps> = ({
  onSelectLegend,
  onDraftLegend,
  onBack,
  draftingForRole,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<LegendCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = getAllCategories();

  const filteredLegends = useMemo(() => {
    let legends = selectedCategory === 'all' 
      ? LEGENDS 
      : getLegendsByCategory(selectedCategory);
    
    if (searchQuery) {
      legends = searchLegends(searchQuery);
      if (selectedCategory !== 'all') {
        legends = legends.filter(l => l.categories.includes(selectedCategory));
      }
    }
    
    return legends;
  }, [selectedCategory, searchQuery]);

  const legendsByCategory = useMemo(() => {
    if (selectedCategory !== 'all' || searchQuery) return null;
    
    const grouped: Record<LegendCategory, Legend[]> = {} as any;
    categories.forEach(cat => {
      grouped[cat] = getLegendsByCategory(cat).slice(0, 4);
    });
    return grouped;
  }, [selectedCategory, searchQuery, categories]);

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <h1 className="text-2xl font-bold text-white tracking-tight">LEGENDS LEAGUE</h1>
                </div>
                <p className="text-slate-500 text-sm mt-0.5">Hire the minds that shaped industries</p>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search legends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 px-4 py-2 pl-10 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
            </div>
          </div>
        </div>
      </header>

      {/* Drafting Context Banner */}
      {draftingForRole && (
        <div className="bg-cyan-500/10 border-b border-cyan-500/30">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400">📋</span>
              <span className="text-cyan-400 text-sm font-medium">
                Selecting advisor for: <strong>{draftingForRole}</strong>
              </span>
            </div>
            <button 
              onClick={onBack}
              className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors"
            >
              Cancel Selection
            </button>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="border-b border-slate-800 bg-[#0f172a]/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              🏆 All Legends
            </button>
            {categories.map((cat) => {
              const catInfo = LEGEND_CATEGORIES[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {catInfo.emoji} {catInfo.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* All Categories View */}
        {legendsByCategory && !searchQuery && (
          <div className="space-y-12">
            {categories.map((cat) => {
              const legends = legendsByCategory[cat];
              if (!legends || legends.length === 0) return null;
              
              const catInfo = LEGEND_CATEGORIES[cat];
              
              return (
                <section key={cat}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>{catInfo.emoji}</span>
                        {catInfo.label.toUpperCase()}
                      </h2>
                      <p className="text-slate-500 text-sm mt-1">{catInfo.description}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCategory(cat)}
                      className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors"
                    >
                      View All →
                    </button>
                  </div>
                  
                  <div className="grid grid-flow-col auto-cols-[208px] gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {legends.map((legend) => (
                      <LegendCard
                        key={legend.id}
                        legend={legend}
                        onView={onSelectLegend}
                        onDraft={onDraftLegend}
                        compact
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Filtered/Category View */}
        {(selectedCategory !== 'all' || searchQuery) && (
          <div>
            {selectedCategory !== 'all' && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>{LEGEND_CATEGORIES[selectedCategory].emoji}</span>
                  {LEGEND_CATEGORIES[selectedCategory].label.toUpperCase()}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  {LEGEND_CATEGORIES[selectedCategory].description}
                </p>
              </div>
            )}
            
            {searchQuery && (
              <div className="mb-6">
                <p className="text-slate-400 text-sm">
                  {filteredLegends.length} result{filteredLegends.length !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
              </div>
            )}

            {filteredLegends.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                {filteredLegends.map((legend) => (
                  <LegendCard
                    key={legend.id}
                    legend={legend}
                    onView={onSelectLegend}
                    onDraft={onDraftLegend}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-slate-500 text-lg">No legends found</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="mt-4 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default LegendsLibrary;
