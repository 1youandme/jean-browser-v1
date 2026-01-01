import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ExecutionGraph, NodeSpec, GraphEdge } from '../../kernel/graph/ExecutionGraph';
import { NodeStatus } from '../../kernel/graph/RuntimeTypes';

interface GraphCanvasProps {
  graph: ExecutionGraph;
  nodeStatuses?: Map<string, NodeStatus>;
  onNodeSelect: (nodeId: string | null) => void;
  selectedNodeId: string | null;
}

interface LayoutNode extends NodeSpec {
  x: number;
  y: number;
  width: number;
  height: number;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const X_GAP = 100;
const Y_GAP = 60;

export const GraphCanvas: React.FC<GraphCanvasProps> = ({ 
  graph, 
  nodeStatuses = new Map(), 
  onNodeSelect,
  selectedNodeId 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 50, y: 50, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  // --- Layout Calculation ---
  const layout = useMemo(() => {
    // 1. Calculate In-Degrees and Adjacency
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();
    
    graph.nodes.forEach((_, id) => {
      inDegree.set(id, 0);
      adj.set(id, []);
    });

    graph.edges.forEach(edge => {
      inDegree.set(edge.toNode, (inDegree.get(edge.toNode) || 0) + 1);
      adj.get(edge.fromNode)?.push(edge.toNode);
    });

    // 2. Assign Levels (Longest Path Layering)
    const levels = new Map<string, number>();
    const queue: string[] = [];
    
    // Start with source nodes
    graph.nodes.forEach((_, id) => {
      if ((inDegree.get(id) || 0) === 0) {
        levels.set(id, 0);
        queue.push(id);
      }
    });

    // Simple BFS for levels (assuming DAG)
    // Note: For proper "longest path" in DAG, we'd do topological sort first, 
    // but BFS is "good enough" for a simple visualizer to prevent overlap.
    // To handle dependencies better, we push children to max(parent_level) + 1.
    // Let's do a simple recursive depth calculation.
    
    const getNodeLevel = (id: string, visited = new Set<string>()): number => {
      if (visited.has(id)) return 0; // Cycle protection
      visited.add(id);
      
      const incomingEdges = graph.edges.filter(e => e.toNode === id);
      if (incomingEdges.length === 0) return 0;
      
      let maxParentLevel = -1;
      for (const edge of incomingEdges) {
        maxParentLevel = Math.max(maxParentLevel, getNodeLevel(edge.fromNode, new Set(visited)));
      }
      return maxParentLevel + 1;
    };

    const nodeLevels = new Map<string, number>();
    const nodesByLevel = new Map<number, string[]>();

    graph.nodes.forEach((_, id) => {
      const lvl = getNodeLevel(id);
      nodeLevels.set(id, lvl);
      if (!nodesByLevel.has(lvl)) nodesByLevel.set(lvl, []);
      nodesByLevel.get(lvl)?.push(id);
    });

    // 3. Assign Coordinates
    const layoutNodes: LayoutNode[] = [];
    const levelKeys = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);
    
    levelKeys.forEach(level => {
      const nodesInLevel = nodesByLevel.get(level) || [];
      nodesInLevel.forEach((nodeId, index) => {
        const node = graph.nodes.get(nodeId);
        if (node) {
          layoutNodes.push({
            ...node,
            x: level * (NODE_WIDTH + X_GAP),
            y: index * (NODE_HEIGHT + Y_GAP),
            width: NODE_WIDTH,
            height: NODE_HEIGHT
          });
        }
      });
    });

    return layoutNodes;
  }, [graph]);

  // --- Event Handlers ---
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const scaleChange = e.deltaY * -0.001;
      setTransform(t => ({ ...t, scale: Math.min(Math.max(0.1, t.scale + scaleChange), 4) }));
    } else {
      setTransform(t => ({ ...t, x: t.x - e.deltaX, y: t.y - e.deltaY }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
        setIsDragging(true);
        setLastMouse({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
      setLastMouse({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Helper to find node position
  const getNodePos = (id: string) => layout.find(n => n.id === id) || { x: 0, y: 0, width: 0, height: 0 };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-slate-50 relative cursor-grab active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="absolute origin-top-left transition-transform duration-75 ease-linear"
        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
      >
        {/* SVG Layer for Edges */}
        <svg className="absolute top-0 left-0 overflow-visible pointer-events-none" style={{ width: 1, height: 1 }}>
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
            </marker>
          </defs>
          {graph.edges.map((edge, i) => {
            const source = getNodePos(edge.fromNode);
            const target = getNodePos(edge.toNode);
            
            // Calculate anchor points (Right of Source -> Left of Target)
            const sx = source.x + source.width;
            const sy = source.y + source.height / 2;
            const tx = target.x;
            const ty = target.y + target.height / 2;

            // Bezier Control Points
            const cp1x = sx + (tx - sx) / 2;
            const cp2x = tx - (tx - sx) / 2;

            return (
              <g key={`${edge.fromNode}-${edge.toNode}-${i}`}>
                <path
                  d={`M ${sx} ${sy} C ${cp1x} ${sy}, ${cp2x} ${ty}, ${tx} ${ty}`}
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
              </g>
            );
          })}
        </svg>

        {/* HTML Layer for Nodes */}
        {layout.map(node => {
          const status = nodeStatuses?.get(node.id) || 'pending';
          const isSelected = selectedNodeId === node.id;
          
          return (
            <div
              key={node.id}
              onClick={(e) => {
                e.stopPropagation();
                onNodeSelect(node.id);
              }}
              className={`absolute flex flex-col p-3 rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer select-none
                ${isSelected ? 'ring-2 ring-blue-500 border-blue-500 bg-white z-10' : 'border-slate-200 bg-white/90'}
              `}
              style={{
                left: node.x,
                top: node.y,
                width: node.width,
                height: node.height,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700 truncate w-24">{node.name}</span>
                <StatusBadge status={status} />
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate">
                {node.capability}
              </div>
              <div className="mt-auto flex gap-1">
                 {node.constraints.localOnly && <Badge label="Local" color="bg-green-100 text-green-700" />}
                 {node.constraints.networkAccess !== 'none' && <Badge label="Net" color="bg-orange-100 text-orange-700" />}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button 
          className="p-2 bg-white rounded shadow hover:bg-gray-50 text-sm font-bold"
          onClick={() => setTransform(t => ({ ...t, scale: t.scale + 0.1 }))}
        >
          +
        </button>
        <button 
          className="p-2 bg-white rounded shadow hover:bg-gray-50 text-sm font-bold"
          onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.1, t.scale - 0.1) }))}
        >
          -
        </button>
        <button 
          className="p-2 bg-white rounded shadow hover:bg-gray-50 text-sm"
          onClick={() => setTransform({ x: 50, y: 50, scale: 1 })}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: NodeStatus | 'pending' }) => {
  const colors = {
    pending: 'bg-slate-100 text-slate-600',
    running: 'bg-blue-100 text-blue-700 animate-pulse',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    skipped: 'bg-gray-100 text-gray-500'
  };
  return (
    <div className={`w-2 h-2 rounded-full ${colors[status] || colors.pending}`} />
  );
};

const Badge = ({ label, color }: { label: string, color: string }) => (
  <span className={`text-[9px] px-1 rounded ${color}`}>{label}</span>
);
