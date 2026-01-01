
import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, Edge, Node, Handle, Position } from 'reactflow';
import { TeamStructure, TeamContext } from '../types';

interface TeamStructurePreviewProps {
  structure: TeamStructure;
  context: TeamContext | null;
  onAccept: () => void;
  onCustomize: () => void;
  onAutoBuild: () => void;
  onBack: () => void;
}

const CustomStackedOrgNode = ({ data }: any) => {
  const { role, level } = data;
  
  // Level-based colors as requested
  const colors: Record<number, string> = {
    1: 'bg-[#8B5CF6]', // Purple CEO
    2: 'bg-[#3B82F6]', // Blue VP
    3: 'bg-[#10B981]', // Green Manager
    4: 'bg-[#F59E0B]', // Orange IC
  };

  const backgroundColor = colors[level] || 'bg-slate-600';

  return (
    <div className="node-stack-container group">
      {/* Target handle on top */}
      <Handle type="target" position={Position.Top} className="!opacity-0 group-hover:!opacity-100 transition-opacity" />
      
      {/* Background Stacks for 3D fanned look */}
      <div className="stack-card stack-card-3 border-white/5 opacity-40"></div>
      <div className="stack-card stack-card-2 border-white/10 opacity-60"></div>
      
      {/* Front Content Card */}
      <div 
        className={`stack-card stack-card-1 ${backgroundColor} p-2 flex flex-col items-center justify-center text-center shadow-2xl transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105`}
      >
        <span className="text-white text-[9px] font-black uppercase leading-tight px-1 tracking-tight w-full drop-shadow-md">
          {role}
        </span>
        <div className="mt-1 h-0.5 w-6 bg-white/30 rounded-full"></div>
      </div>

      {/* Source handle on bottom */}
      <Handle type="source" position={Position.Bottom} className="!opacity-0 group-hover:!opacity-100 transition-opacity" />
    </div>
  );
};

const TeamStructurePreview: React.FC<TeamStructurePreviewProps> = ({
  structure,
  context,
  onAccept,
  onCustomize,
  onAutoBuild,
  onBack
}) => {
  const nodeTypes = useMemo(() => ({ default: CustomStackedOrgNode }), []);

  // Strict positions as requested by level
  const fixedNodes: Node[] = [
    // Level 1
    { id: 'ceo', role: 'Chief Executive Officer (CEO)', level: 1, pos: { x: 400, y: 0 } },
    // Level 2
    { id: 'vp-sales', role: 'VP, Sales', level: 2, pos: { x: 200, y: 150 } },
    { id: 'vp-operations', role: 'VP, Finance & Operations', level: 2, pos: { x: 400, y: 150 } },
    { id: 'vp-consulting', role: 'VP, Consulting', level: 2, pos: { x: 600, y: 150 } },
    // Level 3
    { id: 'sales-manager', role: 'Director of Marketing', level: 3, pos: { x: 100, y: 300 } },
    { id: 'account-exec', role: 'Account Executive', level: 3, pos: { x: 250, y: 300 } },
    { id: 'controller', role: 'Controller', level: 3, pos: { x: 400, y: 300 } },
    { id: 'senior-consultant', role: 'Senior Procurement Consultant', level: 3, pos: { x: 550, y: 300 } },
    { id: 'project-manager', role: 'Project Manager', level: 3, pos: { x: 700, y: 300 } },
    // Level 4
    { id: 'sales-rep', role: 'Marketing Specialist', level: 4, pos: { x: 100, y: 450 } },
    { id: 'staff-accountant', role: 'Staff Accountant', level: 4, pos: { x: 400, y: 450 } },
    { id: 'analyst', role: 'Procurement Analyst', level: 4, pos: { x: 550, y: 450 } },
  ].map(n => ({
    id: n.id,
    type: 'default',
    data: { role: n.role, level: n.level },
    position: n.pos,
    draggable: true,
  }));

  const fixedEdges: Edge[] = [
    { id: 'e1', source: 'ceo', target: 'vp-sales' },
    { id: 'e2', source: 'ceo', target: 'vp-operations' },
    { id: 'e3', source: 'ceo', target: 'vp-consulting' },
    { id: 'e4', source: 'vp-sales', target: 'sales-manager' },
    { id: 'e5', source: 'vp-sales', target: 'account-exec' },
    { id: 'e6', source: 'vp-operations', target: 'controller' },
    { id: 'e7', source: 'vp-consulting', target: 'senior-consultant' },
    { id: 'e8', source: 'vp-consulting', target: 'project-manager' },
    { id: 'e9', source: 'sales-manager', target: 'sales-rep' },
    { id: 'e10', source: 'controller', target: 'staff-accountant' },
    { id: 'e11', source: 'senior-consultant', target: 'analyst' },
  ].map(e => ({
    ...e,
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#475569', strokeWidth: 2 }
  }));

  return (
    <div className="w-full flex flex-col h-[calc(100vh-6rem)] bg-[#020617] relative animate-in fade-in duration-700 overflow-hidden">
      
      {/* Overlay: Header Panel */}
      <header className="absolute top-0 left-0 right-0 z-20 px-8 py-6 pointer-events-none flex justify-between items-start">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl drop-shadow-lg">✨</span>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter drop-shadow-md">Recommended Team Structure</h1>
          </div>
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em]">Optimized Operational Formation</p>
        </div>
        
        <div className="pointer-events-auto">
           <button 
             onClick={onBack}
             className="px-5 py-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 text-slate-500 hover:text-white rounded-full text-[10px] font-mono uppercase tracking-widest transition-all shadow-xl"
           >
             ← Edit Objectives
           </button>
        </div>
      </header>

      {/* Main Container for Sidebars and Flow */}
      <div className="flex-1 flex w-full relative">
        
        {/* LEFT PANEL: Business Context */}
        <aside className="w-72 h-full z-10 p-6 flex flex-col justify-center pointer-events-none">
          <section className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-2xl p-6 shadow-2xl pointer-events-auto space-y-6">
            <header className="border-b border-slate-800 pb-3">
              <h2 className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">Business Context</h2>
              <p className="text-white font-bold text-lg mt-1 truncate">{context?.name || 'Target Enterprise'}</p>
            </header>
            
            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-mono text-slate-500 uppercase mb-1">Sector</p>
                <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] rounded border border-cyan-500/20">{context?.industry || 'Unspecified'}</span>
              </div>
              
              <div>
                <p className="text-[9px] font-mono text-slate-500 uppercase mb-1">Description</p>
                <p className="text-[11px] text-slate-400 leading-relaxed italic line-clamp-4">"{context?.description}"</p>
              </div>

              <div>
                <p className="text-[9px] font-mono text-slate-500 uppercase mb-2">Priority Needs</p>
                <div className="flex flex-wrap gap-1.5">
                  {context?.needs.map((need, i) => (
                    <span key={i} className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                      {need}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </aside>

        {/* CENTER: Flow Canvas */}
        <main className="flex-1 relative">
          <ReactFlow
            nodes={fixedNodes}
            edges={fixedEdges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            onInit={(instance) => instance.fitView()}
          >
            <Background variant={'dots' as any} gap={20} size={1} color="#1e293b" />
            <Controls position="bottom-left" className="bg-slate-900 border-slate-800 fill-slate-500 shadow-2xl" />
          </ReactFlow>
        </main>

        {/* RIGHT PANEL: Rationale */}
        <aside className="w-72 h-full z-10 p-6 flex flex-col justify-center pointer-events-none">
          <section className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-2xl p-6 shadow-2xl pointer-events-auto">
            <h2 className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_5px_#06b6d4]"></span>
               Strategic Rationale
            </h2>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {structure.rationale.map((text, i) => (
                <div key={i} className="text-[10px] leading-relaxed text-slate-400 relative pl-3">
                  <span className="absolute left-0 top-0 text-cyan-700">•</span>
                  {text}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {/* FOOTER: Action Bar */}
      <footer className="h-28 border-t border-slate-800/50 bg-[#020617]/80 backdrop-blur-xl flex items-center px-12 justify-between z-30 shrink-0">
        <div className="flex flex-col">
          <h3 className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <span className="text-amber-500 animate-pulse">⚡</span> Legend Mode Option
          </h3>
          <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mt-1">Deploy Expert Personalities Instantly</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onAutoBuild}
            className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-amber-900/20 active:scale-95 flex items-center gap-2"
          >
            <span>Auto-Draft Board</span> →
          </button>
          
          <div className="h-10 w-px bg-slate-800 mx-2"></div>
          
          <button 
            onClick={onAccept}
            className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-cyan-900/20"
          >
            Accept & Build Team
          </button>
          <button 
            onClick={onCustomize}
            className="px-8 py-4 bg-slate-900 border border-slate-800 text-slate-500 hover:text-white rounded-xl text-[10px] uppercase tracking-[0.2em] font-black transition-all"
          >
            Customize Structure
          </button>
        </div>
      </footer>
    </div>
  );
};

export default TeamStructurePreview;
