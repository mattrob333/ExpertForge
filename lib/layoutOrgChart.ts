import dagre from 'dagre-esm';
import { Node, Edge, Position } from 'reactflow';

// Match the new DraftNode dimensions (w-48 = 192px, h-16 = 64px + stacked offset ~26px)
const nodeWidth = 210;
const nodeHeight = 90;

type Direction = 'TB' | 'LR';

export interface LayoutOptions {
  direction?: Direction;
  nodeSep?: number;
  rankSep?: number;
}

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const { direction = 'TB', nodeSep = 60, rankSep = 100 } = options;

  const g = new dagre.graphlib.Graph();

  g.setGraph({
    rankdir: direction,
    nodesep: nodeSep,
    ranksep: rankSep,
    marginx: 50,
    marginy: 50,
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to Dagre graph
  nodes.forEach((node) => {
    g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Add edges to Dagre graph
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Run the layout algorithm
  dagre.layout(g);

  // Extract computed positions
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPos = g.node(node.id);

    return {
      ...node,
      targetPosition: direction === 'TB' ? Position.Top : Position.Left,
      sourcePosition: direction === 'TB' ? Position.Bottom : Position.Right,
      position: {
        x: nodeWithPos.x - nodeWidth / 2,
        y: nodeWithPos.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// Determine level based on position in hierarchy
export function inferNodeLevel(nodeId: string, edges: Edge[]): number {
  // Find how many levels up to root (no incoming edges)
  let level = 1;
  let currentId = nodeId;
  const visited = new Set<string>();

  while (true) {
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const parentEdge = edges.find((e) => e.target === currentId);
    if (!parentEdge) break;

    level++;
    currentId = parentEdge.source;
  }

  return level;
}
