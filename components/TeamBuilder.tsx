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
import { TeamStructure, TeamContext, ExpertPersona, TeamSource, Legend, ExpertCategory } from '../types';
import { getLayoutedElements, inferNodeLevel } from '../lib/layoutOrgChart';
import { getTeamSources, saveTeamSource, deleteTeamSource, getRoleAssignments, saveRoleAssignments, RoleAssignment, TeamContextWithId } from '../services/storageService';
import { scrapeUrlContent, generateCustomAgentForRole } from '../services/geminiService';
import { LEGENDS } from '../data/legends';
import { GoogleGenAI } from '@google/genai';

// Simple markdown renderer for chat messages
const renderMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;
  
  // Split by code blocks first to preserve them
  const parts = text.split(/(`{3}[\s\S]*?`{3}|`[^`]+`)/g);
  
  return parts.map((part, i) => {
    // Code blocks
    if (part.startsWith('```') && part.endsWith('```')) {
      const code = part.slice(3, -3).replace(/^\w+\n/, ''); // Remove language identifier
      return <pre key={i} className="bg-slate-900 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono text-green-400">{code}</pre>;
    }
    // Inline code
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-slate-700 px-1.5 py-0.5 rounded text-cyan-300 text-xs font-mono">{part.slice(1, -1)}</code>;
    }
    
    // Process other markdown
    let processed: React.ReactNode[] = [];
    const lines = part.split('\n');
    
    lines.forEach((line, lineIdx) => {
      // Headers
      if (line.startsWith('### ')) {
        processed.push(<h4 key={`h3-${lineIdx}`} className="text-white font-bold text-sm mt-3 mb-1">{line.slice(4)}</h4>);
        return;
      }
      if (line.startsWith('## ')) {
        processed.push(<h3 key={`h2-${lineIdx}`} className="text-white font-bold text-base mt-3 mb-1">{line.slice(3)}</h3>);
        return;
      }
      if (line.startsWith('# ')) {
        processed.push(<h2 key={`h1-${lineIdx}`} className="text-white font-bold text-lg mt-3 mb-1">{line.slice(2)}</h2>);
        return;
      }
      
      // Bullet points
      if (line.match(/^[\-\*]\s/)) {
        const content = line.slice(2);
        processed.push(
          <div key={`li-${lineIdx}`} className="flex gap-2 ml-2">
            <span className="text-cyan-500">•</span>
            <span>{renderInlineMarkdown(content)}</span>
          </div>
        );
        return;
      }
      
      // Numbered lists
      if (line.match(/^\d+\.\s/)) {
        const num = line.match(/^(\d+)\./)?.[1];
        const content = line.replace(/^\d+\.\s/, '');
        processed.push(
          <div key={`ol-${lineIdx}`} className="flex gap-2 ml-2">
            <span className="text-cyan-500 font-mono text-xs">{num}.</span>
            <span>{renderInlineMarkdown(content)}</span>
          </div>
        );
        return;
      }
      
      // Regular line
      if (line.trim()) {
        processed.push(<span key={`p-${lineIdx}`}>{renderInlineMarkdown(line)}{lineIdx < lines.length - 1 ? '\n' : ''}</span>);
      } else if (lineIdx < lines.length - 1) {
        processed.push(<br key={`br-${lineIdx}`} />);
      }
    });
    
    return <span key={i}>{processed}</span>;
  });
};

// Render inline markdown (bold, italic, links, @mentions)
const renderInlineMarkdown = (text: string): React.ReactNode => {
  // Process bold, italic, links, and @mentions
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  
  while (remaining.length > 0) {
    // @mentions - highlight in cyan
    const mentionMatch = remaining.match(/^@([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)*)/);
    if (mentionMatch) {
      parts.push(<span key={key++} className="text-cyan-400 font-semibold">{mentionMatch[0]}</span>);
      remaining = remaining.slice(mentionMatch[0].length);
      continue;
    }
    
    // Bold **text**
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      parts.push(<strong key={key++} className="font-bold text-white">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }
    
    // Italic *text*
    const italicMatch = remaining.match(/^\*(.+?)\*/);
    if (italicMatch) {
      parts.push(<em key={key++} className="italic">{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }
    
    // Links [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      parts.push(
        <a key={key++} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" 
           className="text-cyan-400 underline hover:text-cyan-300">
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }
    
    // Plain URLs
    const urlMatch = remaining.match(/^(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      parts.push(
        <a key={key++} href={urlMatch[1]} target="_blank" rel="noopener noreferrer"
           className="text-cyan-400 underline hover:text-cyan-300 break-all">
          {urlMatch[1]}
        </a>
      );
      remaining = remaining.slice(urlMatch[0].length);
      continue;
    }
    
    // Regular character
    parts.push(remaining[0]);
    remaining = remaining.slice(1);
  }
  
  return parts;
};

interface TeamBuilderProps {
  structure: TeamStructure;
  context: TeamContextWithId | TeamContext | null;
  teamId?: string;
  experts: ExpertPersona[];
  onSave: () => void;
  onBack: () => void;
  onGoHome: () => void;
  onExpertCreated?: (expert: ExpertPersona) => Promise<ExpertPersona> | void;
  onSelectExpert?: (expert: ExpertPersona) => void;
  onDeleteExpert?: (expertId: string) => void;
}

type CenterPanelView = 'orgChart' | 'teamChat';

// Category inference and colors (same as TeamChat)
const inferCategory = (expert: ExpertPersona): ExpertCategory => {
  if (expert.category) return expert.category;
  const text = `${expert.essence || ''} ${expert.role || ''} ${expert.expertiseMap?.deepMastery?.join(' ') || ''}`.toLowerCase();
  if (text.includes('marketing') || text.includes('brand') || text.includes('content')) return 'marketing';
  if (text.includes('sales') || text.includes('revenue') || text.includes('account')) return 'sales';
  if (text.includes('engineer') || text.includes('developer') || text.includes('technical')) return 'engineering';
  if (text.includes('product') || text.includes('ux')) return 'product';
  if (text.includes('finance') || text.includes('accounting') || text.includes('budget')) return 'finance';
  if (text.includes('operation') || text.includes('logistics') || text.includes('process')) return 'operations';
  if (text.includes('hr') || text.includes('talent') || text.includes('recruit')) return 'hr';
  if (text.includes('legal') || text.includes('compliance') || text.includes('contract')) return 'legal';
  if (text.includes('consult') || text.includes('advisor') || text.includes('strategic')) return 'consulting';
  if (text.includes('strategy') || text.includes('growth') || text.includes('vision')) return 'strategy';
  if (text.includes('design') || text.includes('creative') || text.includes('visual')) return 'design';
  if (text.includes('data') || text.includes('analytics') || text.includes('insight')) return 'data';
  if (text.includes('leader') || text.includes('ceo') || text.includes('executive') || text.includes('director')) return 'leadership';
  return 'consulting';
};

const CATEGORY_COLORS: Record<ExpertCategory, { bg: string; text: string }> = {
  marketing: { bg: 'bg-pink-500/20', text: 'text-pink-400' },
  sales: { bg: 'bg-green-500/20', text: 'text-green-400' },
  engineering: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  product: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  finance: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  operations: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  hr: { bg: 'bg-rose-500/20', text: 'text-rose-400' },
  legal: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
  consulting: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  strategy: { bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
  design: { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-400' },
  data: { bg: 'bg-teal-500/20', text: 'text-teal-400' },
  leadership: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  general: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
};

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
  onSelectExpert,
  onDeleteExpert,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [assignments, setAssignments] = useState<NodeAssignment>({});
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [roleModalTab, setRoleModalTab] = useState<RoleModalTab>('generate');
  
  // Center panel view state (org chart vs team chat)
  const [centerPanelView, setCenterPanelView] = useState<CenterPanelView>('orgChart');
  
  // Team chat state - includes agentRole for display
  const [teamChatMessages, setTeamChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; agentName?: string; agentAvatar?: string; agentRole?: string }>>([]);
  const [teamChatInput, setTeamChatInput] = useState('');
  const [sendingTeamChat, setSendingTeamChat] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<{ agentName: string; agentAvatar: string; agentRole: string; content: string } | null>(null);
  const [synthesizing, setSynthesizing] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  
  // Auto-scroll chat to bottom when new messages arrive
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [teamChatMessages, streamingMessage]);
  
  // Hover tooltip state for expert bench
  const [hoveredExpert, setHoveredExpert] = useState<ExpertPersona | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
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
  
  // Bulk team generation state
  const [generatingAllAgents, setGeneratingAllAgents] = useState(false);
  const [bulkGenerationProgress, setBulkGenerationProgress] = useState<{
    current: number;
    total: number;
    currentRole: string;
    completed: Array<{ role: string; success: boolean; error?: string }>;
  } | null>(null);
  const [cancelBulkGeneration, setCancelBulkGeneration] = useState(false);
  const cancelBulkGenerationRef = React.useRef(false);
  const bulkGeneratingRef = React.useRef(false); // Prevents assignment reload during bulk generation
  const [showAgentSelector, setShowAgentSelector] = useState(false);

  // Helper: Find direct subordinates (nodes that this node is the source of)
  const getSubordinateNodes = useCallback((nodeId: string) => {
    if (!structure?.edges || !structure?.nodes) return [];
    // Find edges where this node is the source (parent)
    const subordinateEdges = structure.edges.filter(e => e.source === nodeId);
    const subordinateIds = subordinateEdges.map(e => e.target);
    return structure.nodes.filter(n => subordinateIds.includes(n.id));
  }, [structure]);

  // Helper: Get subordinates with their assignments for chat context
  const getSubordinatesWithAgents = useCallback((nodeId: string) => {
    const subordinates = getSubordinateNodes(nodeId);
    return subordinates.map(sub => ({
      role: sub.role,
      agent: assignments[sub.id]?.customAgent || assignments[sub.id]?.expert || null,
      human: assignments[sub.id]?.human || null,
    }));
  }, [getSubordinateNodes, assignments]);

  // Load sources when teamId is available
  useEffect(() => {
    if (teamId) {
      getTeamSources(teamId).then(setSources);
    }
  }, [teamId]);

  // Load role assignments when teamId is available
  // Skip during bulk generation to prevent race condition
  useEffect(() => {
    if (teamId && !bulkGeneratingRef.current) {
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
    
    // Verify context matches teamId to prevent cross-team contamination
    const contextWithId = context as TeamContextWithId;
    if (teamId && contextWithId.id && contextWithId.id !== teamId) {
      console.error('Context mismatch detected!', { contextId: contextWithId.id, teamId, contextName: context.name });
      alert('Team context mismatch detected. Please refresh the page and try again.');
      return;
    }
    
    const roleName = structure.nodes.find(n => n.id === selectedNode)?.role || 'Agent';
    console.log('Generating custom agent for:', { roleName, teamId, contextName: context.name, sourcesCount: sources.length });
    
    setGeneratingAgent(true);
    try {
      // Get existing agent names to avoid duplicates
      const existingNames = experts.map(e => e.name);
      const customAgent = await generateCustomAgentForRole(roleName, context, sources, existingNames);
      console.log('Custom agent generated:', customAgent);
      
      // Add teamId to associate this agent with this specific team
      customAgent.teamId = teamId;
      
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

  // Bulk generate all agents for the entire team
  const handleGenerateAllAgents = async () => {
    if (!context || sources.length === 0) {
      alert('Please add at least one knowledge source before generating team agents.');
      return;
    }
    
    // Verify context matches teamId to prevent cross-team contamination
    const contextWithId = context as TeamContextWithId;
    if (teamId && contextWithId.id && contextWithId.id !== teamId) {
      console.error('Context mismatch detected!', { contextId: contextWithId.id, teamId, contextName: context.name });
      alert('Team context mismatch detected. Please refresh the page and try again.');
      return;
    }
    
    // Log context to help debug cross-team contamination
    console.log('Generating agents for team:', { 
      teamId, 
      contextId: contextWithId.id,
      contextName: context.name, 
      contextType: context.type,
      sourcesCount: sources.length,
      sourcesTitles: sources.map(s => s.title)
    });

    // Get all nodes that don't have an assignment yet
    const unassignedNodes = structure.nodes.filter(node => {
      const assignment = assignments[node.id];
      return !assignment?.customAgent && !assignment?.expert && !assignment?.legend;
    });

    if (unassignedNodes.length === 0) {
      alert('All roles already have agents assigned!');
      return;
    }

    // Reset cancellation flag and set bulk generating flag
    cancelBulkGenerationRef.current = false;
    bulkGeneratingRef.current = true; // Prevent assignment reload during generation
    setCancelBulkGeneration(false);
    setGeneratingAllAgents(true);
    setBulkGenerationProgress({
      current: 0,
      total: unassignedNodes.length,
      currentRole: '',
      completed: [],
    });

    // Accumulate all new assignments to ensure they're all applied
    const newAssignments: NodeAssignment = {};

    // Process each node sequentially with delays
    for (let i = 0; i < unassignedNodes.length; i++) {
      // Check for cancellation
      if (cancelBulkGenerationRef.current) {
        console.log('Bulk generation cancelled by user');
        break;
      }

      const node = unassignedNodes[i];
      const roleName = node.role;

      // Update progress - starting this role
      setBulkGenerationProgress(prev => prev ? {
        ...prev,
        current: i + 1,
        currentRole: roleName,
      } : null);

      try {
        console.log(`Generating agent ${i + 1}/${unassignedNodes.length}: ${roleName}`);
        
        // Get existing agent names (including newly generated ones) to avoid duplicates
        const existingNames = [
          ...experts.map(e => e.name),
          ...Object.values(newAssignments).map(a => a?.customAgent?.name).filter(Boolean) as string[]
        ];
        
        // Generate the custom agent for this role
        const customAgent = await generateCustomAgentForRole(roleName, context, sources, existingNames);
        customAgent.teamId = teamId;
        customAgent.role = roleName; // Store the role for display purposes

        // Save the custom agent and get back the saved version (with correct ID from database)
        let savedAgent = customAgent;
        if (onExpertCreated) {
          // onExpertCreated returns the saved expert with the correct database ID
          const result = await onExpertCreated(customAgent);
          if (result) {
            savedAgent = result;
            // Also ensure role is preserved after save
            savedAgent.role = roleName;
          }
        }

        // Store in accumulated assignments
        newAssignments[node.id] = { expert: null, legend: null, human: null, customAgent: savedAgent };

        // Update assignments state immediately for UI feedback
        setAssignments(prev => ({
          ...prev,
          ...newAssignments, // Merge ALL accumulated assignments each time
        }));

        // Update progress - completed successfully
        setBulkGenerationProgress(prev => prev ? {
          ...prev,
          completed: [...prev.completed, { role: roleName, success: true }],
        } : null);

        // Rate limit delay (1.5 seconds between calls)
        if (i < unassignedNodes.length - 1 && !cancelBulkGenerationRef.current) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

      } catch (err: any) {
        console.error(`Failed to generate agent for ${roleName}:`, err);
        
        // Update progress - failed
        setBulkGenerationProgress(prev => prev ? {
          ...prev,
          completed: [...prev.completed, { role: roleName, success: false, error: err?.message || 'Unknown error' }],
        } : null);

        // Continue with next role after a brief delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Final update to ensure all assignments are applied
    setAssignments(prev => ({
      ...prev,
      ...newAssignments,
    }));

    // Allow a brief delay for state to persist before re-enabling assignment loading
    setTimeout(() => {
      bulkGeneratingRef.current = false;
    }, 1000);

    // Generation complete
    setGeneratingAllAgents(false);
  };

  const handleCancelBulkGeneration = () => {
    cancelBulkGenerationRef.current = true;
    setCancelBulkGeneration(true);
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
      
      // Build hierarchy context - direct reports
      const subordinates = getSubordinatesWithAgents(selectedNode);
      const hierarchyContext = subordinates.length > 0 
        ? `\nYOUR DIRECT REPORTS:\n${subordinates.map(sub => {
            if (sub.agent) {
              return `- ${sub.role}: ${sub.agent.name} (${sub.agent.essence})`;
            } else if (sub.human) {
              return `- ${sub.role}: ${sub.human.name} (Human team member)`;
            } else {
              return `- ${sub.role}: (Position unfilled)`;
            }
          }).join('\n')}\n\nYou can delegate tasks to your direct reports or ask them for input on matters within their domain.`
        : '';
      
      const prompt = `You are ${agent.name}, ${agent.essence}.

Your introduction: "${agent.introduction}"
Your core beliefs: ${agent.coreBeliefs?.join(', ') || 'Excellence, innovation, results'}

You are the ${structure.nodes.find(n => n.id === selectedNode)?.role} for ${context?.name || 'this organization'}.
${hierarchyContext}

ORGANIZATIONAL CONTEXT:
${sourcesContext || 'No additional context provided.'}

${history ? `CONVERSATION SO FAR:\n${history}\n` : ''}

User: ${userMessage}

Respond as ${agent.name} in character, being helpful and specific to the role and organization. Keep responses conversational but substantive (2-4 paragraphs max).`;

      const response = await ai.models.generateContent({
        model: 'models/gemini-3-flash-preview',
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

  // Helper: Get direct reports for a given node
  const getDirectReportsForNode = (nodeId: string) => {
    const childEdges = structure.edges.filter(e => e.source === nodeId);
    return childEdges.map(edge => {
      const childNode = structure.nodes.find(n => n.id === edge.target);
      const childAssignment = assignments[edge.target];
      const childAgent = childAssignment?.customAgent || childAssignment?.expert;
      return childNode ? { node: childNode, agent: childAgent } : null;
    }).filter(Boolean) as Array<{ node: { id: string; role: string }; agent: ExpertPersona | null }>;
  };

  // Helper: Build full org hierarchy map
  const buildOrgHierarchyMap = () => {
    const map: Record<string, { role: string; agent: ExpertPersona | null; directReports: string[] }> = {};
    
    for (const node of structure.nodes) {
      const assignment = assignments[node.id];
      const agent = assignment?.customAgent || assignment?.expert;
      const directReports = getDirectReportsForNode(node.id);
      
      map[node.id] = {
        role: node.role,
        agent,
        directReports: directReports.map(dr => dr.node.id),
      };
    }
    return map;
  };

  // Helper: Generate streaming response from a specific agent
  const generateAgentResponseStreaming = async (
    ai: any,
    agentData: { agent: ExpertPersona; role: string; nodeId: string },
    userMessage: string,
    conversationContext: string,
    allAgents: Array<{ agent: ExpertPersona; role: string; nodeId: string }>,
    onChunk: (text: string) => void
  ): Promise<{ content: string; mentionedAgents: Array<{ agent: ExpertPersona; role: string; nodeId: string }> }> => {
    
    // Build this agent's direct reports info
    const directReports = getDirectReportsForNode(agentData.nodeId);
    const directReportsInfo = directReports.length > 0
      ? directReports.map(dr => dr.agent 
          ? `  - @${dr.agent.name} (${dr.node.role}): ${dr.agent.essence}`
          : `  - ${dr.node.role}: [Unfilled position]`
        ).join('\n')
      : '  None - you have no direct reports';

    // Build full org structure for context
    const orgStructure = allAgents.map(a => `- ${a.role}: @${a.agent.name}`).join('\n');
    const sourcesContext = sources.map(s => `[${s.title}]: ${s.content.slice(0, 1000)}`).join('\n\n');

    // Determine if this is a follow-up response or the first response
    const isFollowUp = conversationContext.length > 0;
    
    const prompt = `You are ${agentData.agent.name}, the ${agentData.role} at ${context?.name || 'this organization'}.

WHO YOU ARE:
${agentData.agent.essence}
Your beliefs: ${agentData.agent.coreBeliefs?.join('; ') || 'Excellence, innovation, results'}
${agentData.agent.introduction ? `Your voice: "${agentData.agent.introduction}"` : ''}

YOUR RESOURCES & TOOLS:
- Web Search: You can research anything online if you need data, examples, or validation
- Company Knowledge: ${sourcesContext ? 'You have access to company documents (shown below)' : 'No documents loaded yet'}
- Your Team: ${directReportsInfo !== '  None - you have no direct reports' ? 'You have direct reports who can help (shown below)' : 'You have no direct reports'}

${sourcesContext ? `COMPANY DOCUMENTS:\n${sourcesContext}\n` : ''}

YOUR DIRECT REPORTS:
${directReportsInfo}

FULL TEAM:
${orgStructure}

${conversationContext ? `=== CONVERSATION THREAD ===\n${conversationContext}\n=== END THREAD ===\n` : ''}

THE REQUEST: ${userMessage}

---

BEFORE YOU RESPOND, THINK THROUGH THIS (don't write this out, just internalize):
1. What's the REAL problem or opportunity here? Look beneath the surface.
2. What's MY unique perspective as ${agentData.role}? What do I see that others might miss?
3. What do I already know that's relevant? (my expertise, company docs, industry knowledge)
4. Should I research something? (I can use web search if I need data or examples)
5. Should I handle this myself, or does someone else have better expertise for part of this?

HOW TO RESPOND:
${isFollowUp ? `You're joining an ongoing discussion. Your colleagues have already weighed in.
- If you AGREE with someone, say so briefly and BUILD on their point
- If you DISAGREE or see a flaw, say so directly but respectfully - "I see it differently..." or "I'd push back on that..."
- Reference what was said: "What [Name] said about X is spot on, and I'd add..."
- Don't just echo - add something NEW from your perspective` : `You're kicking off this discussion as ${agentData.role}.
- What's your honest take? Share your thinking.
- If you need input from someone specific, @mention them with a focused question
- Set direction but leave room for others to contribute or challenge`}

THE TEAM'S GOAL:
- We're working toward a RESOLUTION or actionable outcome
- Think: Big Picture (macro) → Specific Actions (micro)
- If the conversation is going in circles, call it out and propose a path forward
- Every response should move us closer to solving the problem

YOUR RESPONSE STYLE:
- Be conversational and NATURAL - like a real colleague, not a report
- Vary your length: sometimes 1 punchy paragraph, sometimes 3-4 if needed
- Show personality: humor, frustration, excitement - whatever fits
- Challenge ideas you think are wrong. Defend positions you believe in.
- NO corporate speak, NO "Great question!", NO "I appreciate the opportunity"
- Just dive in and say what you think

WHEN TO @MENTION SOMEONE:
- Only if you genuinely need their specific expertise
- Be specific: "@[Full Name], what's your take on [specific thing]?"
- Don't delegate just to seem collaborative - that's performative

Now respond as ${agentData.agent.name}. Be real. Be useful. Move us forward.`;

    // Use streaming with Google Search grounding
    let fullText = '';
    const stream = await ai.models.generateContentStream({
      model: 'models/gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    for await (const chunk of stream) {
      const chunkText = chunk.text || '';
      fullText += chunkText;
      onChunk(fullText);
    }
    
    // Detect @mentions in the response - improved regex to catch more patterns
    // Matches: @FirstName LastName, @FirstName, @First Last, etc.
    const mentionPattern = /@([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g;
    const mentions = [...fullText.matchAll(mentionPattern)].map(m => m[1].trim());
    
    // Find mentioned agents by matching name (full or partial)
    const mentionedAgents: Array<{ agent: ExpertPersona; role: string; nodeId: string }> = [];
    for (const mentionName of mentions) {
      const matchedAgent = allAgents.find(a => {
        const agentFullName = a.agent.name.toLowerCase();
        const mentionLower = mentionName.toLowerCase();
        // Match full name or first name
        return agentFullName === mentionLower || 
               agentFullName.startsWith(mentionLower + ' ') ||
               agentFullName.split(' ')[0] === mentionLower;
      });
      if (matchedAgent && matchedAgent.agent.id !== agentData.agent.id && 
          !mentionedAgents.some(m => m.agent.id === matchedAgent.agent.id)) {
        mentionedAgents.push(matchedAgent);
      }
    }

    return { content: fullText, mentionedAgents };
  };

  // Team Chat - send message with cascading agent responses
  const handleTeamChatSend = async () => {
    if (!teamChatInput.trim()) return;
    
    const userMessage = teamChatInput.trim();
    setTeamChatInput('');
    setTeamChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setSendingTeamChat(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });
      
      // Get all assigned agents with their node IDs
      const assignedAgents = Object.entries(assignments)
        .map(([nodeId, assignment]) => {
          const agent = assignment?.customAgent || assignment?.expert;
          if (!agent) return null;
          const node = structure.nodes.find(n => n.id === nodeId);
          return { agent, role: node?.role || 'Team Member', nodeId };
        })
        .filter(Boolean) as Array<{ agent: ExpertPersona; role: string; nodeId: string }>;
      
      if (assignedAgents.length === 0) {
        setTeamChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'No agents are assigned yet. Please generate or assign agents to the org chart first.',
          agentName: 'System'
        }]);
        setSendingTeamChat(false);
        return;
      }
      
      // Find the CEO/top-level agent to respond first (or first agent if no CEO)
      const ceoAgent = assignedAgents.find(a => 
        a.role.toLowerCase().includes('ceo') || 
        a.role.toLowerCase().includes('chief executive')
      ) || assignedAgents[0];
      
      // Track which agents have already responded to avoid loops
      const respondedAgents = new Set<string>();
      let conversationContext = '';
      
      // Cascading response loop - allow more responses for full team discussions
      const pendingResponders = [ceoAgent];
      let responseCount = 0;
      const maxResponses = 10; // Allow up to 10 responses for thorough team discussions
      
      while (pendingResponders.length > 0 && responseCount < maxResponses) {
        const currentResponder = pendingResponders.shift()!;
        
        // Skip if already responded
        if (respondedAgents.has(currentResponder.agent.id)) continue;
        respondedAgents.add(currentResponder.agent.id);
        
        // Set up streaming message display
        setStreamingMessage({
          agentName: currentResponder.agent.name,
          agentAvatar: currentResponder.agent.avatarUrl,
          agentRole: currentResponder.role,
          content: ''
        });
        
        // Generate streaming response
        const { content, mentionedAgents } = await generateAgentResponseStreaming(
          ai,
          currentResponder,
          userMessage,
          conversationContext,
          assignedAgents,
          (streamedText) => {
            setStreamingMessage(prev => prev ? { ...prev, content: streamedText } : null);
          }
        );
        
        // Clear streaming and add final message to chat
        setStreamingMessage(null);
        setTeamChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content,
          agentName: currentResponder.agent.name,
          agentAvatar: currentResponder.agent.avatarUrl,
          agentRole: currentResponder.role
        }]);
        
        // Update conversation context for next responder
        conversationContext += `\n${currentResponder.agent.name} (${currentResponder.role}): ${content}\n`;
        responseCount++;
        
        // Add mentioned agents to pending responders (if they haven't responded yet)
        for (const mentioned of mentionedAgents) {
          if (!respondedAgents.has(mentioned.agent.id)) {
            pendingResponders.push(mentioned);
          }
        }
        
        // Small delay between responses for better UX
        if (pendingResponders.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
    } catch (err) {
      console.error('Failed to send team chat:', err);
      setTeamChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.',
        agentName: 'System'
      }]);
    } finally {
      setSendingTeamChat(false);
    }
  };

  // Synthesize thread into a summary report
  const handleSynthesizeThread = async () => {
    if (teamChatMessages.length === 0) return;
    
    setSynthesizing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });
      
      const thread = teamChatMessages.map(m => 
        m.role === 'user' ? `USER: ${m.content}` : `${m.agentName} (${m.agentRole}): ${m.content}`
      ).join('\n\n');
      
      const prompt = `You are a skilled business analyst. Synthesize this team discussion into a clear, actionable summary report.

TEAM DISCUSSION:
${thread}

Create a summary with these sections:

## Executive Summary
(2-3 sentences capturing the core discussion and outcome)

## Key Decisions Made
(Bullet points of any decisions reached)

## Action Items
(Specific next steps with who is responsible, if mentioned)

## Open Questions
(Any unresolved issues that need follow-up)

## Recommendations
(Your synthesis of the best path forward based on the discussion)

Be concise but thorough. Use markdown formatting.`;

      const response = await ai.models.generateContent({
        model: 'models/gemini-3-flash-preview',
        contents: prompt,
      });
      
      const summary = response.text;
      
      // Copy to clipboard and show in a new message
      navigator.clipboard.writeText(summary);
      
      setTeamChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `**📋 Thread Summary (copied to clipboard)**\n\n${summary}`,
        agentName: 'Synthesis',
        agentRole: 'Report'
      }]);
      
    } catch (err) {
      console.error('Failed to synthesize thread:', err);
      alert('Failed to generate summary. Please try again.');
    } finally {
      setSynthesizing(false);
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
      <div className="flex pt-16 h-screen overflow-hidden">
        {/* Left Sidebar - Context & Rationale - STICKY */}
        <aside className="w-72 border-r border-slate-800 bg-slate-900/50 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto sticky top-16">
          <div className="flex-1 overflow-y-auto p-6">
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
          </div>
        </aside>

        {/* Center Panel - Tab Toggle + Content */}
        <div className="flex-1 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
          {/* Tab Toggle Header */}
          <div className="flex items-center justify-center gap-2 p-3 border-b border-slate-800 bg-slate-900/50">
            <button
              onClick={() => setCenterPanelView('orgChart')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                centerPanelView === 'orgChart'
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Org Chart
            </button>
            <button
              onClick={() => setCenterPanelView('teamChat')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                centerPanelView === 'teamChat'
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Team Chat
            </button>
          </div>

          {/* Org Chart View */}
          {centerPanelView === 'orgChart' && (
            <div className="flex-1 relative">
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
          )}

          {/* Team Chat View */}
          {centerPanelView === 'teamChat' && (
            <div className="flex-1 flex flex-col bg-[#0f172a] h-full min-h-0">
              {/* Chat Header - FIXED */}
              <div className="shrink-0 p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Team Chat</h3>
                  <p className="text-slate-500 text-xs">Chat with all agents in your org chart</p>
                </div>
                <div className="flex items-center gap-2">
                  {teamChatMessages.length > 0 && (
                    <>
                      <button
                        onClick={handleSynthesizeThread}
                        disabled={synthesizing}
                        className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-cyan-400 hover:text-white hover:bg-cyan-600/20 border border-cyan-500/50 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                        title="Generate AI summary of the thread"
                      >
                        {synthesizing ? (
                          <div className="w-3.5 h-3.5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        Synthesize
                      </button>
                      <button
                        onClick={() => {
                          const thread = teamChatMessages.map(m => 
                            m.role === 'user' ? `USER: ${m.content}` : `${m.agentName} (${m.agentRole}): ${m.content}`
                          ).join('\n\n---\n\n');
                          navigator.clipboard.writeText(thread);
                          alert('Thread copied to clipboard!');
                        }}
                        className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 rounded-lg transition-all flex items-center gap-2"
                        title="Copy thread to clipboard"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Export
                      </button>
                      <button
                        onClick={() => setTeamChatMessages([])}
                        className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 rounded-lg transition-all flex items-center gap-2"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Clear
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Agent Roster - FIXED */}
              <div className="shrink-0 p-3 border-b border-slate-800 bg-slate-900/30">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {Object.entries(assignments).map(([nodeId, assignment]) => {
                    const agent = assignment?.customAgent || assignment?.expert;
                    if (!agent) return null;
                    const node = structure.nodes.find(n => n.id === nodeId);
                    return (
                      <button 
                        key={nodeId}
                        onClick={() => setTeamChatInput(prev => prev + `@${agent.name} `)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-full shrink-0 hover:border-cyan-500/50 hover:bg-slate-700/50 transition-all cursor-pointer"
                        title={`Click to mention ${agent.name}`}
                      >
                        <img src={agent.avatarUrl} alt={agent.name} className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-white text-xs font-medium">{agent.name.split(' ')[0]}</span>
                        <span className="text-slate-400 text-[10px]">- {node?.role?.replace(/^(Chief |VP of |Director of |Head of )/, '').slice(0, 12) || 'Agent'}</span>
                      </button>
                    );
                  })}
                  {Object.values(assignments).filter(a => a?.customAgent || a?.expert).length === 0 && (
                    <p className="text-slate-500 text-xs">No agents assigned yet. Generate agents first.</p>
                  )}
                </div>
              </div>
              
              {/* Chat Messages - SCROLLABLE */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                {teamChatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                      </svg>
                    </div>
                    <h4 className="text-white font-bold mb-2">Start a Team Conversation</h4>
                    <p className="text-slate-500 text-sm max-w-md">
                      Ask questions, delegate tasks, or brainstorm with your AI team. Use @mentions to direct questions to specific agents.
                    </p>
                  </div>
                ) : (
                  teamChatMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                      {msg.role === 'assistant' && msg.agentAvatar && (
                        <img src={msg.agentAvatar} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      )}
                      <div className={`max-w-[70%] ${msg.role === 'user' ? 'bg-cyan-600/20 border-cyan-500/30' : 'bg-slate-800/50 border-slate-700'} border rounded-xl p-3`}>
                        {msg.role === 'assistant' && msg.agentName && (
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-cyan-400 text-xs font-bold">{msg.agentName}</p>
                            {msg.agentRole && (
                              <span className="text-[9px] font-mono text-slate-500 uppercase px-1.5 py-0.5 bg-slate-700/50 rounded">
                                {msg.agentRole}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="text-white text-sm whitespace-pre-wrap">{renderMarkdown(msg.content)}</div>
                      </div>
                    </div>
                  ))
                )}
                {/* Streaming message display */}
                {streamingMessage && (
                  <div className="flex gap-3">
                    <img src={streamingMessage.agentAvatar} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                    <div className="max-w-[70%] bg-slate-800/50 border border-slate-700 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-cyan-400 text-xs font-bold">{streamingMessage.agentName}</p>
                        <span className="text-[9px] font-mono text-slate-500 uppercase px-1.5 py-0.5 bg-slate-700/50 rounded">
                          {streamingMessage.agentRole}
                        </span>
                      </div>
                      <div className="text-white text-sm whitespace-pre-wrap">{streamingMessage.content ? renderMarkdown(streamingMessage.content) : <span className="text-slate-400 animate-pulse">●●●</span>}</div>
                    </div>
                  </div>
                )}
                {sendingTeamChat && !streamingMessage && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
                      <p className="text-slate-400 text-sm">Team is thinking...</p>
                    </div>
                  </div>
                )}
                {/* Auto-scroll anchor */}
                <div ref={chatEndRef} />
              </div>
              
              {/* Chat Input - FIXED AT BOTTOM */}
              <div className="shrink-0 p-4 border-t border-slate-800 bg-slate-900/50 relative">
                {/* Mention Picker Dropdown */}
                {showMentionPicker && (
                  <div className="absolute bottom-full left-4 right-4 mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-64 overflow-y-auto z-50">
                    <div className="p-2 border-b border-slate-700">
                      <p className="text-xs text-slate-400 font-mono uppercase">Select an agent to mention</p>
                    </div>
                    <div className="p-2 space-y-1">
                      {Object.entries(assignments).map(([nodeId, assignment]) => {
                        const agent = assignment?.customAgent || assignment?.expert;
                        if (!agent) return null;
                        const node = structure.nodes.find(n => n.id === nodeId);
                        return (
                          <button
                            key={nodeId}
                            onClick={() => {
                              setTeamChatInput(prev => prev + `@${agent.name} `);
                              setShowMentionPicker(false);
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
                          >
                            <img src={agent.avatarUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                            <div>
                              <p className="text-white text-sm font-medium">{agent.name}</p>
                              <p className="text-slate-500 text-xs">{node?.role || 'Team Member'}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowMentionPicker(!showMentionPicker)}
                    className={`px-3 py-3 rounded-xl border transition-all ${
                      showMentionPicker 
                        ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-400' 
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                    title="Mention an agent"
                  >
                    <span className="text-lg font-bold">@</span>
                  </button>
                  <input
                    type="text"
                    value={teamChatInput}
                    onChange={(e) => setTeamChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleTeamChatSend()}
                    placeholder="Ask your team anything..."
                    className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  />
                  <button
                    onClick={handleTeamChatSend}
                    disabled={!teamChatInput.trim() || sendingTeamChat}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white text-sm font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-500 hover:to-purple-500 transition-all"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Expert Bench - STICKY */}
        <aside className="w-80 border-l border-slate-800 bg-slate-900/50 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto sticky top-16">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest">Your Expert Bench</h3>
            <p className="text-slate-600 text-[10px] mt-1">Drag or click nodes to assign</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {(() => {
              // Filter experts to only show those belonging to this team or with no team (global)
              const teamExperts = experts.filter(e => !e.teamId || e.teamId === teamId);
              
              if (teamExperts.length === 0) {
                return (
                  <div className="text-center py-8">
                    <p className="text-slate-500 text-sm">No agents for this team yet</p>
                    <p className="text-slate-600 text-xs mt-1">Generate agents using the org chart</p>
                  </div>
                );
              }
              
              // Sort by hierarchy: CEO first, then VPs, then others
              return teamExperts
                .sort((a, b) => {
                  const roleOrder = (role?: string) => {
                    if (!role) return 999;
                    const r = role.toLowerCase();
                    if (r.includes('ceo') || r.includes('chief executive')) return 0;
                    if (r.includes('cto') || r.includes('cfo') || r.includes('coo')) return 1;
                    if (r.includes('vp') || r.includes('vice president')) return 2;
                    if (r.includes('director')) return 3;
                    if (r.includes('manager') || r.includes('lead')) return 4;
                    return 5;
                  };
                  return roleOrder(a.role) - roleOrder(b.role);
                })
                .map((expert) => {
                const isAssigned = Object.values(assignments).some(
                  (a) => a?.expert?.id === expert.id || a?.customAgent?.id === expert.id
                );
                const category = inferCategory(expert);
                const colors = CATEGORY_COLORS[category];
                return (
                  <div
                    key={expert.id}
                    onClick={() => onSelectExpert?.(expert)}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPos({ x: rect.left - 280, y: rect.top });
                      setHoveredExpert(expert);
                    }}
                    onMouseLeave={() => setHoveredExpert(null)}
                    className={`group relative flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isAssigned 
                        ? 'bg-slate-800/50 border-green-500/30 hover:border-green-500/50' 
                        : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50'
                    }`}
                  >
                    {/* Role label in top right */}
                    {expert.role && (
                      <span className="absolute top-1.5 right-2 text-[8px] font-mono text-slate-500 uppercase tracking-wider truncate max-w-[100px]">
                        {expert.role.replace(/^(Chief |VP of |Director of |Head of )/, '').slice(0, 15)}
                      </span>
                    )}
                    <img
                      src={expert.avatarUrl}
                      alt={expert.name}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-600"
                    />
                    <div className="flex-1 min-w-0 mt-2">
                      <p className="text-white text-sm font-medium truncate">{expert.name}</p>
                      <p className="text-slate-500 text-[10px] truncate uppercase font-mono">{expert.essence}</p>
                      <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${colors.bg} ${colors.text}`}>
                        {category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isAssigned && (
                        <span className="text-green-500 text-xs">✓</span>
                      )}
                      {onDeleteExpert && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete ${expert.name}?`)) {
                              onDeleteExpert(expert.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Delete agent"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
          
          <div className="p-4 border-t border-slate-800 space-y-3">
            {/* Generate All Agents Button */}
            <button
              onClick={handleGenerateAllAgents}
              disabled={generatingAllAgents || sources.length === 0}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-purple-900/30 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {generatingAllAgents ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  ✨ Generate All Agents
                </>
              )}
            </button>
            {sources.length === 0 && (
              <p className="text-amber-400 text-[10px] text-center">Add knowledge sources first</p>
            )}
            
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
                  {/* Main Agent Card - Cleaner UI */}
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
                        {/* Action buttons */}
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => setShowAgentSelector(true)}
                            className="flex-1 py-2 text-slate-400 text-xs border border-slate-600 rounded-lg hover:bg-slate-800 transition-all"
                          >
                            Change
                          </button>
                          <button
                            onClick={handleGenerateCustomAgent}
                            disabled={generatingAgent || sources.length === 0}
                            className="flex-1 py-2 text-purple-400 text-xs border border-purple-500/30 rounded-lg hover:bg-purple-500/10 transition-all disabled:opacity-50"
                          >
                            {generatingAgent ? '...' : 'Regenerate'}
                          </button>
                        </div>
                        
                        {/* Expandable selector */}
                        {showAgentSelector && (
                          <div className="mt-3 border-t border-slate-700 pt-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-slate-500 text-[10px] uppercase tracking-wider">Select Different Agent</p>
                              <button onClick={() => setShowAgentSelector(false)} className="text-slate-500 hover:text-white text-xs">✕</button>
                            </div>
                            <div className="max-h-28 overflow-y-auto space-y-1">
                              {experts.filter(e => !e.teamId || e.teamId === teamId).map((expert) => (
                                <button
                                  key={expert.id}
                                  onClick={() => { handleAssignExpert(expert); setShowAgentSelector(false); }}
                                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-cyan-500/10 transition-all text-left"
                                >
                                  <img src={expert.avatarUrl} alt={expert.name} className="w-6 h-6 rounded object-cover" />
                                  <span className="text-white text-xs truncate">{expert.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-700 rounded-xl p-4 space-y-3">
                        {/* Primary action: Generate */}
                        <button
                          onClick={handleGenerateCustomAgent}
                          disabled={generatingAgent || sources.length === 0}
                          className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-xs font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {generatingAgent ? 'Generating...' : '✨ Generate Agent for Role'}
                        </button>
                        {sources.length === 0 && (
                          <p className="text-amber-400 text-[10px] text-center">Add sources first to generate</p>
                        )}
                        
                        {/* Secondary: Select existing */}
                        {(() => {
                          const teamExperts = experts.filter(e => !e.teamId || e.teamId === teamId);
                          return teamExperts.length > 0 && (
                            <>
                              <div className="flex items-center gap-2 text-slate-600 text-[10px]">
                                <div className="flex-1 h-px bg-slate-700"></div>
                                <span>or select existing</span>
                                <div className="flex-1 h-px bg-slate-700"></div>
                              </div>
                              <button
                                onClick={() => setShowAgentSelector(!showAgentSelector)}
                                className="w-full py-2 text-slate-400 text-xs border border-slate-700 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                              >
                                Select Existing Agent
                                <svg className={`w-3 h-3 transition-transform ${showAgentSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {showAgentSelector && (
                                <div className="max-h-28 overflow-y-auto space-y-1 border border-slate-700 rounded-lg p-2">
                                  {teamExperts.map((expert) => (
                                    <button
                                      key={expert.id}
                                      onClick={() => { handleAssignExpert(expert); setShowAgentSelector(false); }}
                                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-cyan-500/10 transition-all text-left"
                                >
                                      <img src={expert.avatarUrl} alt={expert.name} className="w-6 h-6 rounded object-cover" />
                                      <span className="text-white text-xs truncate">{expert.name}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </>
                          );
                        })()}
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

                  {/* Sub-agents Section - Direct Reports from Org Hierarchy */}
                  <div>
                    <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest mb-2">
                      Direct Reports ({getSubordinateNodes(selectedNode).length})
                    </div>
                    {getSubordinateNodes(selectedNode).length > 0 ? (
                      <div className="border border-amber-500/20 rounded-xl overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
                          {getSubordinateNodes(selectedNode).map((subNode) => {
                            const subAssignment = assignments[subNode.id];
                            const subAgent = subAssignment?.customAgent || subAssignment?.expert;
                            const subHuman = subAssignment?.human;
                            return (
                              <div 
                                key={subNode.id}
                                className="flex items-center gap-3 p-3 border-b border-slate-800 last:border-b-0 hover:bg-amber-500/5 transition-all"
                              >
                                {subAgent ? (
                                  <img 
                                    src={subAgent.avatarUrl}
                                    alt={subAgent.name}
                                    className="w-8 h-8 rounded-lg object-cover border border-amber-500/30"
                                  />
                                ) : subHuman ? (
                                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 text-sm">
                                    👤
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-sm">
                                    ?
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-amber-400 text-[10px] font-mono uppercase truncate">{subNode.role}</p>
                                  <p className="text-slate-300 text-xs truncate">
                                    {subAgent?.name || subHuman?.name || 'Unfilled'}
                                  </p>
                                </div>
                                {(subAgent || subHuman) && (
                                  <span className="text-green-500 text-[10px]">✓</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-700 rounded-xl p-4 text-center">
                        <p className="text-slate-500 text-xs">No direct reports for this role</p>
                      </div>
                    )}
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

      {/* Bulk Generation Progress Modal */}
      {generatingAllAgents && bulkGenerationProgress && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
                  <span className="text-xl">🚀</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Generating Team Agents</h2>
                  <p className="text-slate-500 text-xs font-mono">
                    {bulkGenerationProgress.current}/{bulkGenerationProgress.total} roles • {cancelBulkGeneration ? 'Cancelling...' : 'Processing...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-6 py-4 border-b border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Progress</span>
                <span className="text-cyan-400 text-sm font-bold">
                  {Math.round((bulkGenerationProgress.completed.length / bulkGenerationProgress.total) * 100)}%
                </span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 to-cyan-600 transition-all duration-500 ease-out"
                  style={{ width: `${(bulkGenerationProgress.completed.length / bulkGenerationProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Current Role */}
            {bulkGenerationProgress.currentRole && (
              <div className="px-6 py-3 bg-cyan-500/10 border-b border-slate-800 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
                <span className="text-cyan-400 text-sm font-medium">
                  Generating: {bulkGenerationProgress.currentRole}
                </span>
              </div>
            )}

            {/* Completed Roles List */}
            <div className="max-h-64 overflow-y-auto p-4 space-y-2">
              {bulkGenerationProgress.completed.map((item, i) => (
                <div 
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    item.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                  }`}
                >
                  <span className={`text-lg ${item.success ? 'text-green-500' : 'text-red-500'}`}>
                    {item.success ? '✓' : '✕'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${item.success ? 'text-green-400' : 'text-red-400'}`}>
                      {item.role}
                    </p>
                    {item.error && (
                      <p className="text-red-400/70 text-[10px] truncate">{item.error}</p>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Pending roles (not yet processed) */}
              {structure.nodes
                .filter(node => {
                  const assignment = assignments[node.id];
                  return !assignment?.customAgent && !assignment?.expert && !assignment?.legend;
                })
                .filter(node => !bulkGenerationProgress.completed.some(c => c.role === node.role))
                .filter(node => node.role !== bulkGenerationProgress.currentRole)
                .map((node, i) => (
                  <div 
                    key={`pending-${i}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30"
                  >
                    <span className="text-lg text-slate-600">○</span>
                    <p className="text-slate-500 text-sm truncate">{node.role}</p>
                  </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 flex gap-3">
              <button
                onClick={handleCancelBulkGeneration}
                disabled={cancelBulkGeneration}
                className="flex-1 py-3 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelBulkGeneration ? 'Stopping...' : 'Cancel Generation'}
              </button>
            </div>

            {/* Summary when complete */}
            {bulkGenerationProgress.completed.length === bulkGenerationProgress.total && (
              <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">Generation Complete!</p>
                    <p className="text-slate-400 text-xs">
                      {bulkGenerationProgress.completed.filter(c => c.success).length} succeeded, {' '}
                      {bulkGenerationProgress.completed.filter(c => !c.success).length} failed
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setGeneratingAllAgents(false);
                      setBulkGenerationProgress(null);
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg text-sm font-bold hover:from-cyan-500 hover:to-purple-500 transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expert Hover Tooltip */}
      {hoveredExpert && (
        <div 
          className="fixed w-72 p-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[9999] pointer-events-none"
          style={{ 
            left: Math.max(8, tooltipPos.x),
            top: Math.min(tooltipPos.y, window.innerHeight - 220)
          }}
        >
          <p className="text-white font-bold text-sm">{hoveredExpert.name}</p>
          <p className="text-cyan-400 text-xs mb-3">{hoveredExpert.essence}</p>
          {hoveredExpert.expertiseMap?.deepMastery && hoveredExpert.expertiseMap.deepMastery.length > 0 && (
            <div className="mb-3">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1.5">Deep Mastery</p>
              <div className="flex flex-wrap gap-1">
                {hoveredExpert.expertiseMap.deepMastery.slice(0, 4).map((skill, i) => (
                  <span key={i} className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] rounded">{skill}</span>
                ))}
              </div>
            </div>
          )}
          {hoveredExpert.coreBeliefs && hoveredExpert.coreBeliefs.length > 0 && (
            <div>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1.5">Core Belief</p>
              <p className="text-slate-300 text-[11px] italic leading-relaxed">"{hoveredExpert.coreBeliefs[0]}"</p>
            </div>
          )}
          <p className="text-[9px] text-cyan-500 mt-3 uppercase tracking-wider">Click to view profile</p>
        </div>
      )}
    </div>
  );
};

export default TeamBuilder;
