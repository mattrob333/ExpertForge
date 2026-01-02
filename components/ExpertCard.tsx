
import React, { useState, useEffect } from 'react';
import { ExpertPersona, ExpertResource, ResourceRecommendations } from '../types';
import { getExpertResources, saveExpertResource, deleteExpertResource } from '../services/storageService';
import { generateResourceRecommendations, autoPopulateAllResources } from '../services/geminiService';

interface ExpertCardProps {
  persona: ExpertPersona;
  onRestart: () => void;
  onOpenTraining: () => void;
}

const ExpertCard: React.FC<ExpertCardProps> = ({ persona, onRestart, onOpenTraining }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'expertise' | 'thinking' | 'personality'>('overview');
  const [visible, setVisible] = useState(false);
  
  // Resources state
  const [resources, setResources] = useState<ExpertResource[]>([]);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<ResourceRecommendations | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [autoPopulating, setAutoPopulating] = useState(false);
  const [populateProgress, setPopulateProgress] = useState({ current: 0, total: 0, item: '' });
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    resourceType: 'url' as ExpertResource['resourceType'],
    url: '',
    content: '',
  });
  const [savingResource, setSavingResource] = useState(false);
  const [expandedResource, setExpandedResource] = useState<ExpertResource | null>(null);

  useEffect(() => {
    setVisible(true);
  }, []);

  // Load resources when persona changes
  useEffect(() => {
    if (persona.id) {
      getExpertResources(persona.id).then(setResources);
    }
  }, [persona.id]);

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
      
      // Log skipped resources for user awareness
      const skipped = results.filter(r => r.skipped);
      if (skipped.length > 0) {
        console.log(`Skipped ${skipped.length} resources that require manual configuration:`, 
          skipped.map(s => `${s.resource.title}: ${s.skipReason}`));
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

  const handleAddResource = async () => {
    if (!persona.id || !newResource.title.trim()) return;
    
    setSavingResource(true);
    try {
      const saved = await saveExpertResource(persona.id, {
        title: newResource.title.trim(),
        description: newResource.description.trim() || undefined,
        resourceType: newResource.resourceType,
        url: newResource.url.trim() || undefined,
        content: newResource.content.trim() || undefined,
      });
      setResources(prev => [saved, ...prev]);
      setNewResource({ title: '', description: '', resourceType: 'url', url: '', content: '' });
      setShowResourcesModal(false);
    } catch (err) {
      console.error('Failed to save resource:', err);
    } finally {
      setSavingResource(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!persona.id) return;
    try {
      await deleteExpertResource(resourceId, persona.id);
      setResources(prev => prev.filter(r => r.id !== resourceId));
    } catch (err) {
      console.error('Failed to delete resource:', err);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'expertise', label: 'Expertise', icon: '🎯' },
    { id: 'thinking', label: 'Thinking', icon: '🧠' },
    { id: 'personality', label: 'Personality', icon: '🎭' },
  ];

  return (
    <div className={`max-w-[1200px] w-full mx-auto px-4 py-8 md:py-12 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="bg-[#0f172a]/90 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        
        {/* HEADER SECTION */}
        <div className="p-8 md:p-12 border-b border-slate-800/50">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="relative shrink-0 mx-auto md:mx-0">
              <div className="w-48 h-48 md:w-56 md:h-56 relative group">
                <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-cyan-400"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-cyan-400"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-cyan-400"></div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-cyan-400"></div>
                
                <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-cyan-500/30 glow-cyan p-1 bg-slate-900">
                  <img 
                    src={persona.avatarUrl || `https://picsum.photos/seed/${persona.name}/400/400`} 
                    alt={persona.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Identity */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold tracking-[0.2em] rounded-full border border-cyan-500/20">
                  KNOWLEDGE WORKER v2.0
                </span>
                <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-mono font-bold tracking-[0.2em] rounded-full border border-green-500/20 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  ONLINE
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent tracking-tight">
                {persona.name}
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-400 font-light leading-relaxed">
                {persona.essence}
              </p>

              <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                {[
                  { val: persona.stats.coreSkills, label: 'Core Skills', color: 'cyan' },
                  { val: persona.stats.mentalModels, label: 'Mental Models', color: 'purple' },
                  { val: persona.stats.coreBeliefs, label: 'Core Beliefs', color: 'pink' },
                  { val: persona.stats.influences, label: 'Influences', color: 'green' }
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2 min-w-[100px]">
                    <div className={`text-${stat.color}-400 text-2xl font-bold`}>{stat.val}</div>
                    <div className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 bg-slate-900/30 border-l-4 border-cyan-500 rounded-r-2xl p-6 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-purple-600"></div>
            <p className="text-slate-300 italic text-xl leading-relaxed">
              &quot;{persona.introduction}&quot;
            </p>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="px-8 md:px-12 bg-slate-900/20">
          <div className="flex overflow-x-auto no-scrollbar gap-2 md:gap-4 border-b border-slate-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-6 px-6 flex items-center gap-3 font-mono text-sm uppercase tracking-widest transition-all relative shrink-0 ${
                  activeTab === tab.id 
                    ? 'text-cyan-400' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-cyan-500 glow-cyan"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* MAIN CONTENT AREA */}
          <div className="flex-1 p-8 md:p-12 space-y-12">
            {activeTab === 'overview' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-700">
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">📜</span>
                    <h2 className="text-2xl font-bold">Core Beliefs</h2>
                  </div>
                  <div className="grid gap-4">
                    {persona.coreBeliefs.map((belief, i) => (
                      <div key={i} className="group flex items-start gap-4 p-5 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-cyan-500/50 transition-all">
                        <span className="text-cyan-500 mt-1">›</span>
                        <p className="text-slate-300 text-lg group-hover:text-white transition-colors">{belief}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-900/40 border-2 border-emerald-500/20 rounded-2xl p-6">
                    <h3 className="font-bold text-emerald-100 flex items-center gap-2 mb-4"><span>✨</span> Aesthetics</h3>
                    <p className="text-slate-400 leading-relaxed">{persona.aesthetics.beautiful}</p>
                  </div>
                  <div className="bg-slate-900/40 border-2 border-amber-500/20 rounded-2xl p-6">
                    <h3 className="font-bold text-amber-100 flex items-center gap-2 mb-4"><span>⚠️</span> Cringe</h3>
                    <p className="text-slate-400 leading-relaxed">{persona.aesthetics.cringe}</p>
                  </div>
                </div>
                {/* Restore Key Influences Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">📚</span>
                    <h2 className="text-2xl font-bold">Key Influences</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {persona.sidebar.influences.map((inf, i) => (
                      <span key={i} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-mono uppercase tracking-widest rounded-full border border-slate-700 hover:border-purple-500/50 hover:bg-purple-900/20 transition-all cursor-default">
                        {inf}
                      </span>
                    ))}
                  </div>
                </section>
              </div>
            )}
            {activeTab === 'expertise' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
                {[
                  { title: 'Deep Mastery', skills: persona.expertiseMap.deepMastery, color: 'cyan' },
                  { title: 'Working Knowledge', skills: persona.expertiseMap.workingKnowledge, color: 'purple' },
                  { title: 'Curiosity Edges', skills: persona.expertiseMap.curiosityEdges, color: 'pink' },
                  { title: 'Honest Limits', skills: persona.expertiseMap.honestLimits, color: 'amber' },
                ].map((tier, i) => (
                  <div key={i} className="space-y-3">
                    <h4 className={`font-mono text-xs uppercase tracking-widest text-${tier.color}-400`}>{tier.title}</h4>
                    <div className="flex flex-wrap gap-2">
                      {tier.skills.map((skill, j) => (
                        <span key={j} className={`px-4 py-2 rounded-full text-sm border bg-${tier.color}-500/5 border-${tier.color}-500/20 text-${tier.color}-200`}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'thinking' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-700">
                <section className="bg-purple-900/5 border border-purple-500/20 rounded-3xl p-8">
                  <h3 className="text-xl font-bold mb-4">🧠 How They See Problems</h3>
                  <p className="text-slate-300 text-lg leading-relaxed">{persona.thinking.problemApproach}</p>
                </section>
                <div className="grid md:grid-cols-2 gap-4">
                  {persona.thinking.mentalModels.map((model, i) => (
                    <div key={i} className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl">
                      <h4 className="font-bold text-purple-300 mb-2">🧩 {model.name}</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">{model.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'personality' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="bg-cyan-900/5 border border-cyan-500/20 rounded-2xl p-8">
                  <h4 className="font-mono text-[10px] tracking-widest text-cyan-500 mb-2 uppercase">Energy Profile</h4>
                  <p className="text-xl text-slate-200">{persona.personality.energyProfile}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(persona.personality.interactionModes).map(([key, text], i) => (
                    <div key={i} className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl">
                      <h5 className="font-bold text-cyan-400 mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1')}</h5>
                      <p className="text-slate-400 text-sm leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="w-full lg:w-[350px] bg-slate-900/40 border-l border-slate-800 p-8 space-y-10">
            <section className="space-y-6">
              <h3 className="font-bold text-white uppercase tracking-widest text-xs flex items-center gap-2"><span>🎯</span> Competency</h3>
              <div className="space-y-6">
                {persona.sidebar.competencies.map((comp, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest">
                      <span className="text-slate-400">{comp.label}</span>
                      <span className="text-cyan-400">{comp.level}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-1000 delay-500"
                        style={{ width: `${visible ? comp.level : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Resources Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white uppercase tracking-widest text-xs flex items-center gap-2">
                  <span>📚</span> Resources
                </h3>
                <button
                  onClick={() => setShowResourcesModal(true)}
                  className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 uppercase tracking-wider transition-colors"
                >
                  + Add
                </button>
              </div>
              
              {resources.length === 0 ? (
                <p className="text-slate-600 text-xs">No resources added yet</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {resources.map((resource) => (
                    <div 
                      key={resource.id} 
                      className="group flex items-start gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 cursor-pointer transition-all"
                      onClick={() => setExpandedResource(resource)}
                    >
                      <span className="text-cyan-500 text-xs mt-0.5">
                        {resource.resourceType === 'url' ? '🔗' : 
                         resource.resourceType === 'book' ? '📖' : 
                         resource.resourceType === 'api' ? '⚡' : 
                         resource.resourceType === 'tool' ? '🛠️' : '📄'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 text-xs font-medium truncate">{resource.title}</p>
                        {resource.description && (
                          <p className="text-slate-500 text-[10px] truncate">{resource.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {resource.content && (
                          <span className="text-emerald-500 text-[10px]">✓</span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteResource(resource.id); }}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 text-xs transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                onClick={() => setShowResourcesModal(true)}
                className="w-full py-2 border border-dashed border-slate-700 rounded-lg text-slate-500 text-[10px] font-mono uppercase tracking-wider hover:border-cyan-500/50 hover:text-cyan-400 transition-all"
              >
                + Add Resource
              </button>
            </section>

            <div className="space-y-4">
              <button 
                onClick={handleAskForResources}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 transform hover:scale-[1.02] transition-all text-sm"
              >
                <span>📋</span> What Resources Do You Need?
              </button>
              <button 
                onClick={onOpenTraining}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20 transform hover:scale-[1.02] transition-all"
              >
                <span>🛠️</span> Training Dashboard
              </button>
              <button 
                onClick={onRestart}
                className="w-full py-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 font-bold flex items-center justify-center gap-2 transition-all"
              >
                <span>➕</span> Create New Agent
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Resource Modal */}
      {showResourcesModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">Add Resource</h3>
              <p className="text-slate-500 text-sm mt-1">
                Add a resource for {persona.name} to reference
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">
                  Resource Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['url', 'book', 'document', 'api', 'tool'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewResource(prev => ({ ...prev, resourceType: type }))}
                      className={`px-3 py-1 rounded-lg text-xs font-mono capitalize ${
                        newResource.resourceType === type 
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newResource.title}
                  onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Good to Great, OpenAI API..."
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {(newResource.resourceType === 'url' || newResource.resourceType === 'api') && (
                <div>
                  <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">
                    URL
                  </label>
                  <input
                    type="url"
                    value={newResource.url}
                    onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newResource.description}
                  onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Why this resource is important..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => {
                  setShowResourcesModal(false);
                  setNewResource({ title: '', description: '', resourceType: 'url', url: '', content: '' });
                }}
                className="flex-1 py-3 border border-slate-700 text-slate-400 rounded-xl text-sm font-medium hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddResource}
                disabled={!newResource.title.trim() || savingResource}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingResource ? 'Saving...' : 'Add Resource'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resource Recommendations Modal */}
      {showRecommendations && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                  {/* Introduction */}
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <p className="text-slate-300 leading-relaxed">{recommendations.introduction}</p>
                  </div>
                  
                  {/* Resources by category */}
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
                              className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50 hover:border-slate-600 transition-colors"
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
                                {category === 'capability' && (
                                  <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors">
                                    Enable
                                  </button>
                                )}
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
              <button
                onClick={() => {
                  setShowRecommendations(false);
                  setShowResourcesModal(true);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-cyan-500 hover:to-purple-500 transition-all"
              >
                + Add Manually
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Resource View Modal */}
      {expandedResource && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {expandedResource.resourceType === 'url' ? '🔗' : 
                   expandedResource.resourceType === 'book' ? '📖' : 
                   expandedResource.resourceType === 'api' ? '⚡' : 
                   expandedResource.resourceType === 'tool' ? '🛠️' : '📄'}
                </span>
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
                    {expandedResource.isRecommended && (
                      <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                        AI Recommended
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
              
              {expandedResource.url && (
                <div className="mb-4">
                  <h4 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">URL</h4>
                  <a 
                    href={expandedResource.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline break-all"
                  >
                    {expandedResource.url}
                  </a>
                </div>
              )}
              
              {expandedResource.content ? (
                <div>
                  <h4 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Content</h4>
                  <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 prose prose-invert prose-sm max-w-none">
                    <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
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
            
            <div className="p-4 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => setExpandedResource(null)}
                className="flex-1 py-3 border border-slate-700 text-slate-400 rounded-xl text-sm font-medium hover:bg-slate-800 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDeleteResource(expandedResource.id);
                  setExpandedResource(null);
                }}
                className="py-3 px-6 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/10 transition-all"
              >
                Delete Resource
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertCard;
