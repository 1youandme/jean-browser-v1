import React, { useMemo, useState } from 'react';
import { LogisticsExecutionGraph } from '../../domain/logistics/LogisticsTypes';
import { planTimeline, evaluateRisks, governanceTags } from '../../domain/logistics/LogisticsPlannerLogic';
import { TimelineView } from './TimelineView';
import { DependencyGraphView } from './DependencyGraphView';

interface ReadOnlyLogisticsPlannerProps {
  graph: LogisticsExecutionGraph;
  onStatusChange?: (nodeId: string, status: 'planning' | 'active' | 'completed' | 'halted') => void;
}

export const ReadOnlyLogisticsPlanner: React.FC<ReadOnlyLogisticsPlannerProps> = ({ graph, onStatusChange }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const plan = useMemo(() => planTimeline(graph), [graph]);
  const risks = useMemo(() => evaluateRisks(plan, 3, 240), [plan]);
  const tags = useMemo(() => governanceTags(), []);
  const node = selectedId ? graph.nodes.get(selectedId) || null : null;

  return (
    <div className="flex flex-col gap-3 w-full h-full bg-slate-100 p-3 border border-slate-200">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold">Logistics Planner (Read-Only)</div>
        <div className="flex gap-2">
          {tags.map(t => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">{t}</span>
          ))}
        </div>
      </div>
      <TimelineView graph={graph} />
      <DependencyGraphView graph={graph} selectedId={selectedId} onSelect={setSelectedId} />
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded p-3">
          <div className="text-xs font-bold mb-2">Risks</div>
          <div className="space-y-1">
            {risks.length === 0 && (<div className="text-[11px] text-slate-500">No risks detected</div>)}
            {risks.map((r, i) => (
              <div key={i} className={`text-[11px] px-2 py-1 rounded border ${r.level === 'critical' ? 'border-red-400 bg-red-50 text-red-700' : r.level === 'warning' ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-slate-300 bg-slate-50 text-slate-700'}`}>
                <span className="font-mono">{r.type}</span> {r.nodeId ? <span className="opacity-70">[{r.nodeId.substring(0,8)}]</span> : null} — {r.message}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3">
          <div className="text-xs font-bold mb-2">Selected Node</div>
          {!node && (<div className="text-[11px] text-slate-500">None</div>)}
          {node && (
            <div className="space-y-2 text-[11px]">
              <div className="font-bold">{node.name}</div>
              <div className="text-slate-500">{node.provider?.name || node.type}</div>
              <div className="flex gap-2">
                <span className="px-1 rounded bg-slate-100 text-slate-700">dur {node.estimatedDurationMinutes}m</span>
                {(node.governanceTags || []).map(t => <span key={t} className="px-1 rounded bg-slate-100 text-slate-700">{t}</span>)}
              </div>
              {onStatusChange && (
                <div className="flex gap-1">
                  {(['planning','active','completed','halted'] as const).map(s => (
                    <button key={s} className="px-2 py-1 border rounded bg-white hover:bg-slate-50" onClick={() => onStatusChange(node.id, s)}>{s}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded p-3">
          <div className="text-xs font-bold mb-2">Stats</div>
          <div className="text-[11px]">Total duration: {plan.totalDuration}m</div>
        </div>
      </div>
    </div>
  );
}

