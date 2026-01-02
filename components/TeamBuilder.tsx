import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  NodeProps,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
// CRITICAL: Import React Flow CSS for zoom/pan/drag to work
import 'reactflow/dist/style.css';
import { TeamStructure, TeamContext, ExpertPersona, TeamSource, Legend } from '../types';
import { getLayoutedElements, inferNodeLevel } from '../lib/layoutOrgChart';
import { getTeamSources, saveTeamSource, deleteTeamSource, getRoleAssignments, saveRoleAssignments, RoleAssignment } from '../services/storageService';
import { scrapeUrlContent, generateCustomAgentForRole } from '../services/geminiService';
import { LEGENDS } from '../data/legends';
import { GoogleGenAI } from '@google/genai';

interface TeamBuilderProps {
  structure: TeamStructure;
  context: TeamContext | null;
  teamId?: string;
  experts: ExpertPersona[];
  onSave: () => void;
  onBack: () => void;
  onGoHome: () => void;
  onExpertCreated?: (expert: ExpertPersona) => void;
}

interface NodeAssignment {
  [nodeId: string]: {
    expert?: ExpertPersona | null;
    legend?: Legend | null;
    human?: { name: string; email?: string; title?: string } | null;
    customAgent?: ExpertPersona | null;
  };
}

type RoleModalTab = 'generate' | 'human' | 'expert' | 'legend';

// Custom node component - 3D stacked glass cards like reference image
const DraftNode = ({ data, selected }: NodeProps) => {
  const { role, level, assignment, onAssign } = data;
  
  // Get display info from assignment
  const getAssignmentDisplay = () => {
    if (!assignment) return null;
    if (assignment.customAgent) return { name: assignment.customAgent.name, type: 'AI Agent', avatar: assignment.customAgent.avatarUrl };
    if (assignment.expert) return { name: assignment.expert.name, type: 'Expert', avatar: assignment.expert.avatarUrl };
    if (assignment.legend) return { name: assignment.legend.name, type: 'Legend', avatar: assignment.legend.photo };
    if (assignment.human) return { name: assignment.human.name, type: 'Human', avatar: null };
    return null;
  };
  
  const assignmentDisplay = getAssignmentDisplay();
  
  // Color schemes matching reference image
  const levelStyles: Record<number, { bg: string; glow: string; border: string }> = {
    1: { // CEO - Purple/Violet
      bg: 'from-purple-600/90 via-purple-500/80 to-purple-600/90',
      glow: 'shadow-purple-500/40',
      border: 'border-purple-400/50',
    },
    2: { // VP Level - Magenta/Purple
      bg: 'from-fuchsia-600/90 via-fuchsia-500/80 to-purple-600/90',
      glow: 'shadow-fuchsia-500/40',
      border: 'border-fuchsia-400/50',
    },
    3: { // Manager Level - varies (blue, green, orange)
      bg: 'from-emerald-600/90 via-emerald-500/80 to-teal-600/90',
      glow: 'shadow-emerald-500/40',
      border: 'border-emerald-400/50',
    },
    4: { // IC Level - Orange/Amber
      bg: 'from-amber-600/90 via-orange-500/80 to-amber-600/90',
      glow: 'shadow-amber-500/40',
      border: 'border-amber-400/50',
    },
  };

  const style = levelStyles[level] || levelStyles[3];

  return (
    <div className="group">
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-cyan-400 !border-cyan-300 !w-2 !h-2 !opacity-0" 
      />
      
      <div 
        onClick={() => onAssign && onAssign()}
        className={`relative cursor-pointer transition-all duration-300 ${selected ? 'scale-105' : 'hover:scale-102 hover:-translate-y-1'}`}
        style={{ perspective: '1000px' }}
      >
        {/* 3D Stacked Cards - Back layers */}
        <div 
          className={`absolute w-48 h-16 rounded-lg bg-gradient-to-br ${style.bg} ${style.border} border backdrop-blur-sm`}
          style={{ 
            transform: 'translateZ(-30px) translateX(12px) translateY(10px)',
            opacity: 0.4,
          }}
        />
        <div 
          className={`absolute w-48 h-16 rounded-lg bg-gradient-to-br ${style.bg} ${style.border} border backdrop-blur-sm`}
          style={{ 
            transform: 'translateZ(-20px) translateX(8px) translateY(6px)',
            opacity: 0.6,
          }}
        />
        <div 
          className={`absolute w-48 h-16 rounded-lg bg-gradient-to-br ${style.bg} ${style.border} border backdrop-blur-sm`}
          style={{ 
            transform: 'translateZ(-10px) translateX(4px) translateY(3px)',
            opacity: 0.8,
          }}
        />
        
        {/* Main Card - Glass effect */}
        <div 
          className={`relative w-48 h-16 rounded-lg bg-gradient-to-br ${style.bg} ${style.border} border-2 backdrop-blur-md flex items-center justify-center shadow-lg ${style.glow} ${selected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : ''}`}
          style={{
            boxShadow: selected 
              ? '0 0 30px rgba(6, 182, 212, 0.5), 0 10px 40px -10px rgba(0, 0, 0, 0.5)' 
              : '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Glass texture overlay */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />
          <div className="absolute inset-0 rounded-lg bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48cmVjdCB3aWR0aD0iMiIgaGVpZ2h0PSIyIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-50 pointer-events-none" />
          
          {/* Content */}
          <div className="relative z-10 text-center px-3">
            <p className="text-white text-sm font-semibold leading-tight drop-shadow-md">
              {role}
            </p>
            {assignmentDisplay && (
              <p className="text-white/80 text-[10px] mt-0.5 truncate max-w-[160px]">
                {assignmentDisplay.name}
              </p>
            )}
          </div>
          
          {/* Assigned indicator */}
          {assignmentDisplay && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-lg">
              <span className="text-white text-[8px] font-bold">✓</span>
            </div>
          )}
        </div>
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!bg-cyan-400 !border-cyan-300 !w-2 !h-2 !opacity-0" 
      />
    </div>
  );
};

const TeamBuilder: React.FC<TeamBuilderProps> = ({
  structure,
  context,
  teamId,
  experts,
  onSave,
  onBack,
  onGoHome,
  onExpertCreated,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [assignments, setAssignments] = useState<NodeAssignment>({});
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [roleModalTab, setRoleModalTab] = useState<RoleModalTab>('generate');
  
  // Human team member input state
  const [humanName, setHumanName] = useState('');
  const [humanEmail, setHumanEmail] = useState('');
  const [humanTitle, setHumanTitle] = useState('');
  
  // Custom agent generation state
  const [generatingAgent, setGeneratingAgent] = useState(false);
  
  // Sources state
  const [sources, setSources] = useState<TeamSource[]>([]);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceContent, setNewSourceContent] = useState('');
  const [sourceType, setSourceType] = useState<'text' | 'markdown' | 'url'>('text');
  const [savingSource, setSavingSource] = useState(false);
  
  // URL scraping state
  const [urlInput, setUrlInput] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  
  // Role chat state
  const [roleChatInput, setRoleChatInput] = useState('');
  const [roleChatMessages, setRoleChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [sendingRoleChat, setSendingRoleChat] = useState(false);

  // Load sources when teamId is available
  useEffect(() => {
    if (teamId) {
      getTeamSources(teamId).then(setSources);
    }
  }, [teamId]);

  // Load role assignments when teamId is available
  useEffect(() => {
    if (teamId) {
      getRoleAssignments(teamId).then((savedAssignments) => {
        const assignmentsObj: NodeAssignment = {};
        savedAssignments.forEach((ra) => {
          // Find the expert/legend by ID
          const expert = ra.expertId ? experts.find(e => e.id === ra.expertId) : null;
          const customAgent = ra.customAgentId ? experts.find(e => e.id === ra.customAgentId) : null;
          const legend = ra.legendId ? LEGENDS.find(l => l.id === ra.legendId) : null;
          const human = ra.humanName ? { name: ra.humanName, email: ra.humanEmail || undefined, title: ra.humanTitle || undefined } : null;
          
          assignmentsObj[ra.nodeId] = {
            expert: expert || null,
            customAgent: customAgent || null,
            legend: legend || null,
            human: human,
          };
        });
        setAssignments(assignmentsObj);
      });
    }
  }, [teamId, experts]);

  // Save role assignments whenever they change
  useEffect(() => {
    if (teamId && Object.keys(assignments).length > 0) {
      const assignmentsToSave: RoleAssignment[] = Object.entries(assignments).map(([nodeId, assignment]) => ({
        nodeId,
        expertId: assignment.expert?.id || null,
        customAgentId: assignment.customAgent?.id || null,
        legendId: assignment.legend?.id || null,
        humanName: assignment.human?.name || null,
        humanEmail: assignment.human?.email || null,
        humanTitle: assignment.human?.title || null,
      }));
      saveRoleAssignments(teamId, assignmentsToSave);
    }
  }, [teamId, assignments]);

  const handleAddSource = async () => {
    if (!teamId || !newSourceTitle.trim() || !newSourceContent.trim()) return;
    
    setSavingSource(true);
    try {
      const saved = await saveTeamSource(teamId, {
        title: newSourceTitle.trim(),
        content: newSourceContent.trim(),
        sourceType,
      });
      setSources(prev => [saved, ...prev]);
      setNewSourceTitle('');
      setNewSourceContent('');
      setShowSourcesModal(false);
    } catch (err) {
      console.error('Failed to save source:', err);
    } finally {
      setSavingSource(false);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!teamId) return;
    try {
      await deleteTeamSource(sourceId, teamId);
      setSources(prev => prev.filter(s => s.id !== sourceId));
    } catch (err) {
      console.error('Failed to delete source:', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setNewSourceContent(content);
      setNewSourceTitle(file.name.replace(/\.(txt|md)$/, ''));
      setSourceType(file.name.endsWith('.md') ? 'markdown' : 'text');
    };
    reader.readAsText(file);
  };

  const handleScrapeUrl = async () => {
    if (!urlInput.trim()) return;
    
    // Basic URL validation
    try {
      new URL(urlInput.trim());
    } catch {
      setScrapeError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }
    
    setScrapingUrl(true);
    setScrapeError(null);
    
    try {
      const result = await scrapeUrlContent(urlInput.trim());
      setNewSourceTitle(result.title);
      setNewSourceContent(result.content);
      setSourceType('url');
      setUrlInput('');
    } catch (err) {
      console.error('Failed to scrape URL:', err);
      setScrapeError('Failed to fetch content from URL. Please try again or paste content manually.');
    } finally {
      setScrapingUrl(false);
    }
  };

  const handleGenerateCustomAgent = async () => {
    if (!context || !selectedNode) {
      console.error('Missing context or selectedNode:', { context, selectedNode });
      alert('Missing team context. Please ensure your team is properly set up.');
      return;
    }
    
    const roleName = structure.nodes.find(n => n.id === selectedNode)?.role || 'Agent';
    console.log('Generating custom agent for:', { roleName, context, sourcesCount: sources.length });
    
    setGeneratingAgent(true);
    try {
      const customAgent = await generateCustomAgentForRole(roleName, context, sources);
      console.log('Custom agent generated:', customAgent);
      
      // Save the custom agent to the experts list
      if (onExpertCreated) {
        onExpertCreated(customAgent);
      }
      
      // Assign the custom agent to the selected node
      setAssignments((prev) => ({
        ...prev,
        [selectedNode]: { expert: null, legend: null, human: null, customAgent },
      }));
      
      setShowAssignModal(false);
      setSelectedNode(null);
    } catch (err: any) {
      console.error('Failed to generate custom agent:', err);
      console.error('Error details:', err?.message, err?.stack);
      alert(`Failed to generate custom agent: ${err?.message || 'Unknown error'}`);
    } finally {
      setGeneratingAgent(false);
    }
  };

  const handleSendRoleChat = async () => {
    if (!roleChatInput.trim() || !selectedNode) return;
    
    const agent = assignments[selectedNode]?.customAgent || assignments[selectedNode]?.expert;
    if (!agent) return;
    
    const userMessage = roleChatInput.trim();
    setRoleChatInput('');
    setRoleChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setSendingRoleChat(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });
      
      // Build context from sources
      const sourcesContext = sources.map(s => `[${s.title}]: ${s.content.slice(0, 2000)}`).join('\n\n');
      
      // Build conversation history
      const history = roleChatMessages.map(m => 
        m.role === 'user' ? `User: ${m.content}` : `${agent.name}: ${m.content}`
      ).join('\n');
      
      const prompt = `You are ${agent.name}, ${agent.essence}.

Your introduction: "${agent.introduction}"
Your core beliefs: ${agent.coreBeliefs?.join(', ') || 'Excellence, innovation, results'}

You are the ${structure.nodes.find(n => n.id === selectedNode)?.role} for ${context?.name || 'this organization'}.

ORGANIZATIONAL CONTEXT:
${sourcesContext || 'No additional context provided.'}

${history ? `CONVERSATION SO FAR:\n${history}\n` : ''}

User: ${userMessage}

Respond as ${agent.name} in character, being helpful and specific to the role and organization. Keep responses conversational but substantive (2-4 paragraphs max).`;

      const response = await ai.models.generateContent({
        model: 'models/gemini-2.0-flash',
        contents: prompt,
      });
      
      setRoleChatMessages(prev => [...prev, { role: 'assistant', content: response.text || 'I apologize, I had trouble generating a response.' }]);
    } catch (err) {
      console.error('Failed to send role chat:', err);
      setRoleChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setSendingRoleChat(false);
    }
  };

  const nodeTypes = useMemo(() => ({ draft: DraftNode }), []);

  // Initialize nodes and edges from structure
  useEffect(() => {
    if (!structure || !structure.nodes || !structure.edges) return;

    // Create edges first for level inference - cyan glow like reference
    const rfEdges: Edge[] = structure.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: false,
      style: { 
        stroke: '#22d3ee', 
        strokeWidth: 2,
        filter: 'drop-shadow(0 0 4px rgba(34, 211, 238, 0.6))',
      },
    }));

    // Create nodes with assignment capability
    const rfNodes: Node[] = structure.nodes.map((node) => {
      const level = inferNodeLevel(node.id, rfEdges);
      return {
        id: node.id,
        type: 'draft',
        data: {
          role: node.role,
          level: Math.min(level, 4),
          assignment: assignments[node.id] || null,
          onAssign: () => {
            setSelectedNode(node.id);
            setShowAssignModal(true);
          },
        },
        position: node.position || { x: 0, y: 0 },
        draggable: true,
      };
    });

    // Apply Dagre layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      rfNodes,
      rfEdges,
      { direction: 'TB', nodeSep: 100, rankSep: 150 }
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [structure, assignments, setNodes, setEdges]);

  // Update node data when assignments change
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          assignment: assignments[node.id] || null,
        },
      }))
    );
  }, [assignments, setNodes]);

  const handleAssignExpert = (expert: ExpertPersona) => {
    if (selectedNode) {
      setAssignments((prev) => ({
        ...prev,
        [selectedNode]: { expert, legend: null, human: null, customAgent: null },
      }));
    }
    setShowAssignModal(false);
    setSelectedNode(null);
  };

  const handleAssignLegend = (legend: Legend) => {
    if (selectedNode) {
      setAssignments((prev) => ({
        ...prev,
        [selectedNode]: { expert: null, legend, human: null, customAgent: null },
      }));
    }
    setShowAssignModal(false);
    setSelectedNode(null);
  };

  const handleAssignHuman = (human: { name: string; email?: string; title?: string }) => {
    if (selectedNode) {
      setAssignments((prev) => ({
        ...prev,
        [selectedNode]: { expert: null, legend: null, human, customAgent: null },
      }));
    }
    setShowAssignModal(false);
    setSelectedNode(null);
  };

  const handleRemoveAssignment = () => {
    if (selectedNode) {
      setAssignments((prev) => {
        const updated = { ...prev };
        delete updated[selectedNode];
        return updated;
      });
    }
    setShowAssignModal(false);
    setSelectedNode(null);
  };

  // Count assignments that have any value
  const assignedCount = Object.values(assignments).filter(a => 
    a && (a.expert || a.legend || a.human || a.customAgent)
  ).length;
  const totalNodes = structure?.nodes?.length || 0;

  return (
    <div className="w-full h-screen flex flex-col bg-[#020617]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur-md flex items-center justify-between px-6 z-30">
        <div className="flex items-center gap-4">
          <button onClick={onGoHome} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-2 h-2 bg-cyan-500 rounded-full glow-cyan"></div>
            <span className="font-mono text-sm font-black tracking-widest uppercase text-white">EXPERTFORGE</span>
          </button>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 text-xs font-mono uppercase tracking-widest">Team Builder</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-500 text-xs font-mono">
            {assignedCount}/{totalNodes} ASSIGNED
          </span>
          <button 
            onClick={onBack}
            className="px-4 py-2 border border-slate-700 rounded-lg text-slate-400 text-xs font-mono uppercase tracking-wider hover:bg-slate-800 transition-colors"
          >
            ← Back
          </button>
          <button 
            onClick={onSave}
            className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg text-white text-xs font-bold uppercase tracking-wider hover:from-cyan-500 hover:to-purple-500 transition-all shadow-lg shadow-cyan-900/30"
          >
            Save Team
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex pt-16">
        {/* Left Sidebar - Context & Rationale */}
        <aside className="w-72 border-r border-slate-800 bg-slate-900/50 p-6 overflow-y-auto">
          {context && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Team</h3>
                <h2 className="text-xl font-bold text-white">{context.name}</h2>
                <span className="inline-block mt-2 px-2 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono uppercase rounded">
                  {context.type}
                </span>
              </div>
              
              <div>
                <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Objective</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{context.description}</p>
              </div>

              <div>
                <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Focus Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {context.needs.map((need) => (
                    <span key={need} className="px-2 py-1 bg-slate-800 text-slate-400 text-[10px] rounded">
                      {need}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {structure?.rationale && structure.rationale.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-800">
              <h3 className="text-xs font-mono text-purple-400 uppercase tracking-widest mb-3">AI Rationale</h3>
              <ul className="space-y-3">
                {structure.rationale.map((point, i) => (
                  <li key={i} className="text-slate-400 text-xs leading-relaxed flex gap-2">
                    <span className="text-purple-500">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sources Section */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Sources</h3>
              <button
                onClick={() => setShowSourcesModal(true)}
                className="text-[10px] font-mono text-slate-500 hover:text-cyan-400 uppercase tracking-wider transition-colors"
              >
                + Add
              </button>
            </div>
            
            {sources.length === 0 ? (
              <p className="text-slate-600 text-xs">No sources added yet</p>
            ) : (
              <ul className="space-y-2">
                {sources.map((source) => (
                  <li 
                    key={source.id} 
                    className="group flex items-start gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  >
                    <span className="text-cyan-500 text-xs mt-0.5">📄</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 text-xs font-medium truncate">{source.title}</p>
                      <p className="text-slate-600 text-[10px] truncate">
                        {source.sourceType === 'markdown' ? 'Markdown' : 'Text'} • {source.content.length} chars
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteSource(source.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 text-xs transition-all"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
            
            <button
              onClick={() => setShowSourcesModal(true)}
              className="w-full mt-3 py-2 border border-dashed border-slate-700 rounded-lg text-slate-500 text-[10px] font-mono uppercase tracking-wider hover:border-cyan-500/50 hover:text-cyan-400 transition-all"
            >
              + Add Knowledge Source
            </button>
          </div>
        </aside>

        {/* Center - React Flow Canvas */}
        <div className="flex-1 relative" style={{ height: 'calc(100vh - 4rem)' }}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              minZoom={0.1}
              maxZoom={2}
              // CRITICAL: Enable all interactivity
              nodesDraggable={true}
              nodesConnectable={false}
              elementsSelectable={true}
              zoomOnScroll={true}
              zoomOnPinch={true}
              panOnScroll={false}
              panOnDrag={true}
              selectionOnDrag={false}
              zoomOnDoubleClick={true}
              selectNodesOnDrag={false}
              proOptions={{ hideAttribution: true }}
              defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            >
              <Background variant={'dots' as any} gap={20} size={1} color="#1e293b" />
              <Controls 
                position="bottom-left"
                showZoom={true}
                showFitView={true}
                showInteractive={false}
                className="!bg-slate-900 !border-slate-700 !shadow-xl [&>button]:!bg-slate-800 [&>button]:!border-slate-700 [&>button]:!fill-slate-400 [&>button:hover]:!bg-slate-700" 
              />
              <MiniMap 
                nodeColor={(node) => {
                  const level = node.data?.level || 1;
                  const colors: Record<number, string> = {
                    1: '#8B5CF6',
                    2: '#3B82F6',
                    3: '#10B981',
                    4: '#F59E0B',
                  };
                  return colors[level] || '#64748B';
                }}
                maskColor="rgba(0, 0, 0, 0.8)"
                className="!bg-slate-900/90 !border-slate-700"
                zoomable
                pannable
              />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        {/* Right Sidebar - Expert Bench */}
        <aside className="w-80 border-l border-slate-800 bg-slate-900/50 flex flex-col">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest">Your Expert Bench</h3>
            <p className="text-slate-600 text-[10px] mt-1">Drag or click nodes to assign</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {experts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">No experts yet</p>
                <button 
                  onClick={onGoHome}
                  className="mt-3 text-cyan-400 text-xs font-mono uppercase tracking-wider hover:text-cyan-300"
                >
                  Create Expert →
                </button>
              </div>
            ) : (
              experts.map((expert) => {
                const isAssigned = Object.values(assignments).some(
                  (a) => a?.expert?.id === expert.id
                );
                return (
                  <div
                    key={expert.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isAssigned 
                        ? 'bg-slate-800/30 border-slate-700/50 opacity-50' 
                        : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 cursor-pointer'
                    }`}
                  >
                    <img
                      src={expert.avatarUrl}
                      alt={expert.name}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{expert.name}</p>
                      <p className="text-slate-500 text-[10px] truncate uppercase font-mono">{expert.essence}</p>
                    </div>
                    {isAssigned && (
                      <span className="text-green-500 text-xs">✓</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={onGoHome}
              className="w-full py-3 border border-dashed border-slate-700 rounded-xl text-slate-500 text-xs font-mono uppercase tracking-wider hover:border-cyan-500/50 hover:text-cyan-400 transition-all"
            >
              + Create New Expert
            </button>
          </div>
        </aside>
      </div>

      {/* Role Workspace Modal - Expanded Full Interface */}
      {showAssignModal && selectedNode && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-7xl h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${
                  assignments[selectedNode] ? 'bg-green-500' : 'bg-amber-500'
                }`}></div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {structure.nodes.find(n => n.id === selectedNode)?.role || 'Role'}
                  </h2>
                  <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">
                    Role Workspace • {context?.name || 'Team'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setHumanName('');
                  setHumanEmail('');
                  setHumanTitle('');
                }}
                className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Main Content - Three Column Layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Agents & Human */}
              <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/30">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest">Assigned Team</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Main Agent Card */}
                  <div>
                    <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-2">Primary AI Agent</div>
                    {(assignments[selectedNode]?.customAgent || assignments[selectedNode]?.expert) ? (
                      <div className="bg-gradient-to-br from-cyan-900/30 to-purple-900/30 border border-cyan-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={(assignments[selectedNode]?.customAgent || assignments[selectedNode]?.expert)?.avatarUrl}
                            alt="Agent"
                            className="w-14 h-14 rounded-xl object-cover border-2 border-cyan-500/50"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold truncate">
                              {(assignments[selectedNode]?.customAgent || assignments[selectedNode]?.expert)?.name}
                            </p>
                            <p className="text-cyan-400 text-xs truncate">
                              {(assignments[selectedNode]?.customAgent || assignments[selectedNode]?.expert)?.essence}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleRemoveAssignment}
                          className="mt-3 w-full py-2 text-red-400 text-xs border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-all"
                        >
                          Remove Agent
                        </button>
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-700 rounded-xl p-4 space-y-3">
                        {/* Existing experts to assign */}
                        {experts.length > 0 && (
                          <div className="max-h-32 overflow-y-auto space-y-2">
                            <p className="text-slate-500 text-[10px] uppercase tracking-wider">Select Existing Agent</p>
                            {experts.map((expert) => (
                              <button
                                key={expert.id}
                                onClick={() => handleAssignExpert(expert)}
                                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 transition-all text-left"
                              >
                                <img 
                                  src={expert.avatarUrl}
                                  alt={expert.name}
                                  className="w-8 h-8 rounded-lg object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-xs font-medium truncate">{expert.name}</p>
                                  <p className="text-slate-500 text-[10px] truncate">{expert.essence}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-slate-600 text-[10px]">
                          <div className="flex-1 h-px bg-slate-700"></div>
                          <span>or</span>
                          <div className="flex-1 h-px bg-slate-700"></div>
                        </div>
                        
                        <button
                          onClick={handleGenerateCustomAgent}
                          disabled={generatingAgent || sources.length === 0}
                          className="w-full py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-xs font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {generatingAgent ? 'Generating...' : '✨ Generate New Agent'}
                        </button>
                        {sources.length === 0 && (
                          <p className="text-amber-400 text-[10px] text-center">Add sources first to generate</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Human Team Member */}
                  <div>
                    <div className="text-[10px] font-mono text-green-400 uppercase tracking-widest mb-2">Human Team Member</div>
                    {assignments[selectedNode]?.human ? (
                      <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 text-xl">
                            👤
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold truncate">{assignments[selectedNode].human.name}</p>
                            {assignments[selectedNode].human.title && (
                              <p className="text-green-400 text-xs truncate">{assignments[selectedNode].human.title}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-700 rounded-xl p-4">
                        <input
                          type="text"
                          value={humanName}
                          onChange={(e) => setHumanName(e.target.value)}
                          placeholder="Team member name"
                          className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-green-500/50 mb-2"
                        />
                        <button
                          onClick={() => {
                            if (humanName.trim()) {
                              handleAssignHuman({ name: humanName.trim() });
                              setHumanName('');
                            }
                          }}
                          disabled={!humanName.trim()}
                          className="w-full py-2 bg-green-600 text-white text-xs font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          + Assign Human
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Legend/Backup Agent */}
                  <div>
                    <div className="text-[10px] font-mono text-purple-400 uppercase tracking-widest mb-2">Backup Advisor</div>
                    {assignments[selectedNode]?.legend ? (
                      <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={assignments[selectedNode].legend.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignments[selectedNode].legend.name)}&background=8B5CF6&color=fff`}
                            alt="Legend"
                            className="w-12 h-12 rounded-xl object-cover border border-purple-500/50"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold truncate">{assignments[selectedNode].legend.name}</p>
                            <p className="text-purple-400 text-xs truncate">{assignments[selectedNode].legend.title}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-700 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
                        {LEGENDS.slice(0, 4).map((legend) => (
                          <button
                            key={legend.id}
                            onClick={() => handleAssignLegend(legend)}
                            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-purple-500/10 transition-all text-left"
                          >
                            <img 
                              src={legend.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(legend.name)}&background=8B5CF6&color=fff`}
                              alt={legend.name}
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs font-medium truncate">{legend.name}</p>
                              <p className="text-slate-500 text-[10px] truncate">{legend.title}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sub-agents Section */}
                  <div>
                    <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest mb-2">Sub-Agents</div>
                    <div className="border border-dashed border-slate-700 rounded-xl p-4 text-center">
                      <p className="text-slate-500 text-xs mb-2">Specialized assistants for this role</p>
                      <button className="w-full py-2 border border-amber-500/30 text-amber-400 text-xs font-medium rounded-lg hover:bg-amber-500/10 transition-all">
                        + Add Sub-Agent
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Panel - Chat Interface */}
              <div className="flex-1 flex flex-col bg-[#0f172a]">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Role Chat</h3>
                    <p className="text-slate-500 text-xs">Discuss this role with assigned agents</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Talking to:</span>
                    <select className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500/50">
                      <option>Primary Agent</option>
                      <option>Backup Advisor</option>
                      <option>All Agents</option>
                    </select>
                  </div>
                </div>
                
                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {(assignments[selectedNode]?.customAgent || assignments[selectedNode]?.expert) ? (
                    <>
                      {/* Initial agent greeting */}
                      <div className="flex gap-3">
                        <img 
                          src={(assignments[selectedNode]?.customAgent || assignments[selectedNode]?.expert)?.avatarUrl}
                          alt="Agent"
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                        />
                        <div className="bg-slate-800/50 rounded-2xl rounded-tl-none p-4 max-w-[80%]">
                          <p className="text-white text-sm">
                            {(assignments[selectedNode]?.customAgent || assignments[selectedNode]?.expert)?.introduction || 
                             `Hi! I'm ready to help with the ${structure.nodes.find(n => n.id === selectedNode)?.role} role. What would you like to discuss?`}
                          </p>
                        </div>
                      </div>
                      
                      {/* Chat messages */}
                      {roleChatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          {msg.role === 'assistant' ? (
                            <img 
                              src={(assignments[selectedNode]?.customAgent || assignments[selectedNode]?.expert)?.avatarUrl}
                              alt="Agent"
                              className="w-10 h-10 rounded-xl object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
                              <span className="text-cyan-400">👤</span>
                            </div>
                          )}
                          <div className={`rounded-2xl p-4 max-w-[80%] ${
                            msg.role === 'user' 
                              ? 'bg-cyan-600/20 rounded-tr-none' 
                              : 'bg-slate-800/50 rounded-tl-none'
                          }`}>
                            <p className="text-white text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Loading indicator */}
                      {sendingRoleChat && (
                        <div className="flex gap-3">
                          <img 
                            src={(assignments[selectedNode]?.customAgent || assignments[selectedNode]?.expert)?.avatarUrl}
                            alt="Agent"
                            className="w-10 h-10 rounded-xl object-cover shrink-0"
                          />
                          <div className="bg-slate-800/50 rounded-2xl rounded-tl-none p-4">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <span className="text-3xl">💬</span>
                        </div>
                        <p className="text-slate-400 text-sm">Assign an agent to start chatting</p>
                        <p className="text-slate-600 text-xs mt-1">Generate or select an AI agent from the left panel</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-slate-800">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={roleChatInput}
                      onChange={(e) => setRoleChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendRoleChat();
                        }
                      }}
                      placeholder={assignments[selectedNode]?.customAgent || assignments[selectedNode]?.expert 
                        ? "Ask about this role, discuss challenges, get advice..."
                        : "Assign an agent first to chat"}
                      disabled={(!assignments[selectedNode]?.customAgent && !assignments[selectedNode]?.expert) || sendingRoleChat}
                      className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
                    />
                    <button 
                      onClick={handleSendRoleChat}
                      disabled={(!assignments[selectedNode]?.customAgent && !assignments[selectedNode]?.expert) || sendingRoleChat || !roleChatInput.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-500 hover:to-purple-500 transition-all"
                    >
                      {sendingRoleChat ? '...' : 'Send'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Panel - Sources & Resources */}
              <div className="w-72 border-l border-slate-800 flex flex-col bg-slate-900/30">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest">Knowledge Sources</h3>
                  <button 
                    onClick={() => {
                      setShowAssignModal(false);
                      setShowSourcesModal(true);
                    }}
                    className="text-cyan-400 text-xs hover:text-cyan-300"
                  >
                    + Add
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {sources.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">📚</span>
                      </div>
                      <p className="text-slate-500 text-sm">No sources added</p>
                      <button 
                        onClick={() => {
                          setShowAssignModal(false);
                          setShowSourcesModal(true);
                        }}
                        className="mt-2 text-cyan-400 text-xs hover:text-cyan-300"
                      >
                        Add knowledge sources →
                      </button>
                    </div>
                  ) : (
                    sources.map((source) => (
                      <div 
                        key={source.id}
                        className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 hover:border-cyan-500/30 transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg">
                            {source.sourceType === 'url' ? '🌐' : source.sourceType === 'markdown' ? '📝' : '📄'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{source.title}</p>
                            <p className="text-slate-500 text-[10px] uppercase tracking-wider mt-0.5">
                              {source.sourceType} • {source.content.length.toLocaleString()} chars
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Quick Actions */}
                <div className="p-4 border-t border-slate-800 space-y-2">
                  <button className="w-full py-2 text-xs text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-800 transition-all">
                    📊 View Role Analytics
                  </button>
                  <button className="w-full py-2 text-xs text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-800 transition-all">
                    📋 Export Role Config
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sources Modal */}
      {showSourcesModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">Add Knowledge Source</h3>
              <p className="text-slate-500 text-sm mt-1">
                Paste text or import a file to add organizational context
              </p>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              {/* URL Scraping */}
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">
                  Import from URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setScrapeError(null);
                    }}
                    placeholder="https://company.com"
                    className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                  <button
                    onClick={handleScrapeUrl}
                    disabled={!urlInput.trim() || scrapingUrl}
                    className="px-4 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {scrapingUrl ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Scraping...</span>
                      </>
                    ) : (
                      <>🔍 Scrape</>
                    )}
                  </button>
                </div>
                {scrapeError && (
                  <p className="mt-2 text-red-400 text-xs">{scrapeError}</p>
                )}
                <p className="mt-2 text-slate-600 text-xs">
                  We'll extract business information from the website using AI
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-800"></div>
                <span className="text-slate-600 text-xs">or</span>
                <div className="flex-1 h-px bg-slate-800"></div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">
                  Import File
                </label>
                <label className="flex items-center justify-center gap-2 p-4 border border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all">
                  <span className="text-cyan-400">📁</span>
                  <span className="text-slate-400 text-sm">Choose .txt or .md file</span>
                  <input
                    type="file"
                    accept=".txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-800"></div>
                <span className="text-slate-600 text-xs">or paste below</span>
                <div className="flex-1 h-px bg-slate-800"></div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newSourceTitle}
                  onChange={(e) => setNewSourceTitle(e.target.value)}
                  placeholder="e.g., Company Overview, Product Specs..."
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">
                  Content
                </label>
                <textarea
                  value={newSourceContent}
                  onChange={(e) => setNewSourceContent(e.target.value)}
                  placeholder="Paste your organizational knowledge, documentation, or context here..."
                  rows={8}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>

              {/* Source Type Toggle */}
              <div className="flex items-center gap-4">
                <span className="text-slate-500 text-xs">Format:</span>
                <button
                  onClick={() => setSourceType('text')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono ${
                    sourceType === 'text' 
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  Plain Text
                </button>
                <button
                  onClick={() => setSourceType('markdown')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono ${
                    sourceType === 'markdown' 
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  Markdown
                </button>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => {
                  setShowSourcesModal(false);
                  setNewSourceTitle('');
                  setNewSourceContent('');
                  setUrlInput('');
                  setScrapeError(null);
                }}
                className="flex-1 py-3 border border-slate-700 text-slate-400 rounded-xl text-sm font-medium hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSource}
                disabled={!newSourceTitle.trim() || !newSourceContent.trim() || savingSource}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingSource ? 'Saving...' : 'Add Source'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamBuilder;
