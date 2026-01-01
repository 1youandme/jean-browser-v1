import React, { useMemo } from 'react';
import { LogisticsExecutionGraph } from '../../domain/logistics/LogisticsTypes';

interface DependencyGraphViewProps {
  graph: LogisticsExecutionGraph;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
}

export const DependencyGraphView: React.FC<DependencyGraphViewProps> = ({ graph, selectedId, onSelect }) => {
  const layout = useMemo(() => {
    const inDegree = new Map<string, number>();
    graph.nodes.forEach((_, id) => inDegree.set(id, 0));
    graph.edges.forEach(e => inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1));
    const levelMap = new Map<string, number>();
    const nodesByLevel = new Map<number, string[]>();
    graph.nodes.forEach((_, id) => {
      const incoming = graph.edges.filter(x => x.to === id);
      const lvl = incoming.length === 0 ? 0 : Math.max(...incoming.map(x => (levelMap.get(x.from) || 0))) + 1;
      levelMap.set(id, lvl);
      if (!nodesByLevel.has(lvl)) nodesByLevel.set(lvl, []);
      nodesByLevel.get(lvl)?.push(id);
    });
    const coords: Record<string, { x: number; y: number }> = {};
    const keys = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);
    keys.forEach(l => {
      const ids = nodesByLevel.get(l) || [];
      ids.forEach((id, i) => {
        coords[id] = { x: l * 200, y: i * 120 };
      });
    });
    return { coords };
  }, [graph]);
  const getPos = (id: string) => layout.coords[id] || { x: 0, y: 0 };
  return (
    <div className="relative w-full h-[360px] bg-slate-50 border border-slate-200 overflow-hidden">
      <svg className="absolute top-0 left-0" width="100%" height="100%">
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
          </marker>
        </defs>
        {graph.edges.map((e, i) => {
          const s = getPos(e.from);
          const t = getPos(e.to);
          const cp1x = s.x + (t.x - s.x) / 2;
          const cp2x = t.x - (t.x - s.x) / 2;
          return (
            <path
              key={`${e.from}-${e.to}-${i}`}
              d={`M ${s.x+160} ${s.y+40} C ${cp1x} ${s.y+40}, ${cp2x} ${t.y+40}, ${t.x} ${t.y+40}`}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth={2}
              markerEnd="url(#arrow)"
            />
          );
        })}
      </svg>
      {Array.from(graph.nodes.entries()).map(([id, node]) => {
        const p = getPos(id);
        const selected = selectedId === id;
        return (
          <div
            key={id}
            className={`absolute p-3 w-40 h-20 rounded border shadow-sm bg-white cursor-pointer ${selected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-200'}`}
            style={{ left: p.x, top: p.y }}
            onClick={() => onSelect && onSelect(id)}
          >
            <div className="text-[11px] font-bold truncate">{node.name}</div>
            <div className="text-[10px] text-slate-500 truncate">{node.provider?.name || node.type}</div>
            <div className="mt-1 text-[10px]">
              <span className="px-1 rounded bg-slate-100 text-slate-700">dur {node.estimatedDurationMinutes}m</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

