import React from 'react';
import { LogisticsExecutionGraph } from '../../domain/logistics/LogisticsTypes';
import { planTimeline } from '../../domain/logistics/LogisticsPlannerLogic';

interface TimelineViewProps {
  graph: LogisticsExecutionGraph;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ graph }) => {
  const plan = planTimeline(graph);
  const bands = Array.from(plan.nodes.entries()).map(([id, t]) => ({
    id,
    name: graph.nodes.get(id)?.name || id,
    start: t.start,
    end: t.end,
    duration: t.duration,
    level: t.level
  }));
  const scale = 2;
  const width = Math.max(300, plan.totalDuration * scale + 200);
  return (
    <div className="w-full overflow-x-auto border border-slate-200 bg-white">
      <div className="min-w-[600px]" style={{ width }}>
        <div className="flex items-center gap-2 px-3 py-2 border-b">
          <div className="text-xs font-bold">Timeline (minutes)</div>
        </div>
        <div className="relative p-3">
          {bands.map(b => (
            <div
              key={b.id}
              className="absolute rounded bg-blue-100 border border-blue-300 text-blue-800 text-[10px] px-2 py-1"
              style={{ left: b.start * scale, top: b.level * 34, width: Math.max(24, b.duration * scale) }}
            >
              <div className="font-mono">{b.name}</div>
              <div className="opacity-70">t:{b.start}→{b.end}</div>
            </div>
          ))}
          <div className="mt-24" />
        </div>
      </div>
    </div>
  );
}

