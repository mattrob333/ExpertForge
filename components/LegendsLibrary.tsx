import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Legend, LegendCategory } from '../types';
import { LEGENDS, LEGEND_CATEGORIES, getLegendsByCategory, searchLegends, getAllCategories } from '../data/legends';
import HolographicLegendCard from './HolographicLegendCard';
import { generateLegend } from '../services/geminiService';

interface LegendsLibraryProps {
  onSelectLegend: (legend: Legend) => void;
  onDraftLegend?: (legend: Legend) => void;
  onBack: () => void;
  draftingForRole?: string; // When coming from TeamBuilder
  customLegends?: Legend[]; // User-generated legends
  onLegendGenerated?: (legend: Legend) => void; // Callback when new legend is created
}

const LegendsLibrary: React.FC<LegendsLibraryProps> = ({
  onSelectLegend,
  onDraftLegend,
  onBack,
  draftingForRole,
  customLegends = [],
  onLegendGenerated,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<LegendCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Generate Legend state
  const [generateInput, setGenerateInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const newLegendRef = useRef<HTMLDivElement>(null);
  const [newlyGeneratedId, setNewlyGeneratedId] = useState<string | null>(null);
  
  // Combine built-in legends with custom legends
  const allLegends = useMemo(() => [...LEGENDS, ...customLegends], [customLegends]);
  
  // Auto-scroll to newly generated legend
  useEffect(() => {
    if (newlyGeneratedId && newLegendRef.current) {
      newLegendRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Clear after animation
      setTimeout(() => setNewlyGeneratedId(null), 2000);
    }
  }, [newlyGeneratedId]);
  
  const handleGenerateLegend = async () => {
    if (!generateInput.trim()) return;
    
    const personName = generateInput.trim();
    
    // Check if legend already exists (case-insensitive)
    const existingLegend = allLegends.find(
      l => l.name.toLowerCase() === personName.toLowerCase()
    );
    
    if (existingLegend) {
      // Legend exists - scroll to it
      setNewlyGeneratedId(existingLegend.id);
      setSelectedCategory('all');
      setGenerateInput('');
      return;
    }
    
    // Generate new legend
    setIsGenerating(true);
    setShowGeneratingModal(true);
    setGenerationError(null);
    
    try {
      const newLegend = await generateLegend(personName);
      
      // Notify parent to add legend to state
      if (onLegendGenerated) {
        onLegendGenerated(newLegend);
      }
      
      // Set category to 'all' to show the new legend
      setSelectedCategory('all');
      setGenerateInput('');
      setNewlyGeneratedId(newLegend.id);
      
    } catch (err: any) {
      console.error('Failed to generate legend:', err);
      setGenerationError(err?.message || 'Failed to generate legend. Please try again.');
    } finally {
      setIsGenerating(false);
      setShowGeneratingModal(false);
    }
  };

  const categories = getAllCategories();

  const filteredLegends = useMemo(() => {
    let legends = selectedCategory === 'all' 
      ? allLegends 
      : allLegends.filter(l => l.categories.includes(selectedCategory));
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      legends = allLegends.filter(l => 
        l.name.toLowerCase().includes(query) ||
        l.title.toLowerCase().includes(query) ||
        l.categories.some(c => c.toLowerCase().includes(query))
      );
      if (selectedCategory !== 'all') {
        legends = legends.filter(l => l.categories.includes(selectedCategory));
      }
    }
    
    return legends;
  }, [selectedCategory, searchQuery, allLegends]);

  const legendsByCategory = useMemo(() => {
    if (selectedCategory !== 'all' || searchQuery) return null;
    
    const grouped: Record<LegendCategory, Legend[]> = {} as any;
    categories.forEach(cat => {
      grouped[cat] = allLegends.filter(l => l.categories.includes(cat)).slice(0, 4);
    });
    return grouped;
  }, [selectedCategory, searchQuery, categories, allLegends]);

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Generation Modal */}
      {showGeneratingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
              <span className="text-4xl">🏆</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Generating Legend</h2>
            <p className="text-slate-400 mb-6">Creating a legendary advisor profile for <span className="text-cyan-400 font-medium">{generateInput}</span>...</p>
            <div className="flex justify-center gap-2 mb-4">
              <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-slate-500 text-sm">Researching philosophy, mental models, and famous decisions...</p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-6">
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
            
            {/* Generate Legend Input */}
            <div className="flex-1 max-w-xl">
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Enter a famous person's name to generate..."
                    value={generateInput}
                    onChange={(e) => setGenerateInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateLegend()}
                    disabled={isGenerating}
                    className="w-full px-4 py-3 pl-12 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all disabled:opacity-50"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500">✨</span>
                </div>
                <button
                  onClick={handleGenerateLegend}
                  disabled={!generateInput.trim() || isGenerating}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold rounded-xl transition-all disabled:cursor-not-allowed shadow-lg shadow-cyan-900/30 disabled:shadow-none flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Generating
                    </>
                  ) : (
                    'Generate Legend'
                  )}
                </button>
              </div>
              {generationError && (
                <p className="text-red-400 text-sm mt-2">{generationError}</p>
              )}
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
      <main className="max-w-[1600px] mx-auto px-6 py-8">
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
                  
                  <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide px-2">
                    {legends.map((legend) => (
                      <div 
                        key={legend.id}
                        ref={legend.id === newlyGeneratedId ? newLegendRef : undefined}
                        className={`transition-all duration-500 ${legend.id === newlyGeneratedId ? 'ring-4 ring-cyan-500 ring-offset-4 ring-offset-slate-900 rounded-3xl animate-pulse' : ''}`}
                      >
                        <HolographicLegendCard
                          legend={legend}
                          onClick={() => onSelectLegend(legend)}
                        />
                      </div>
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
              <div className="flex flex-wrap gap-8 justify-center">
                {filteredLegends.map((legend) => (
                  <div 
                    key={legend.id}
                    ref={legend.id === newlyGeneratedId ? newLegendRef : undefined}
                    className={`transition-all duration-500 ${legend.id === newlyGeneratedId ? 'ring-4 ring-cyan-500 ring-offset-4 ring-offset-slate-900 rounded-3xl animate-pulse' : ''}`}
                  >
                    <HolographicLegendCard
                      legend={legend}
                      onClick={() => onSelectLegend(legend)}
                    />
                  </div>
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
