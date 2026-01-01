import React, { useState } from 'react';
import { ExecutionGraph } from '../../kernel/graph/ExecutionGraph';
import { NodeStatus } from '../../kernel/graph/RuntimeTypes';
import { GovernanceState } from '../../domain/governance/types';
import { GraphCanvas } from './GraphCanvas';
import { NodeDetailDrawer } from './NodeDetailDrawer';
import { GovernanceBanner } from './GovernanceBanner';

interface ExecutionGraphViewerProps {
  graph: ExecutionGraph | null;
  governanceState: GovernanceState;
  governanceReason?: string;
  nodeStatuses?: Map<string, NodeStatus>;
  className?: string;
}

export const ExecutionGraphViewer: React.FC<ExecutionGraphViewerProps> = ({
  graph,
  governanceState,
  governanceReason,
  nodeStatuses,
  className = ""
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = graph && selectedNodeId ? graph.nodes.get(selectedNodeId) || null : null;
  const selectedNodeStatus = selectedNodeId && nodeStatuses ? nodeStatuses.get(selectedNodeId) : undefined;

  return (
    <div className={`flex flex-col h-full w-full bg-slate-100 border border-slate-200 overflow-hidden relative ${className}`}>
      
      {/* 1. Governance Banner Overlay */}
      <div className="z-30 w-full relative">
        <GovernanceBanner state={governanceState} reason={governanceReason} />
      </div>

      {/* 2. Main Canvas Area */}
      <div className="flex-1 relative z-10">
        {graph ? (
          <GraphCanvas 
            graph={graph}
            nodeStatuses={nodeStatuses}
            selectedNodeId={selectedNodeId}
            onNodeSelect={setSelectedNodeId}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* 3. Detail Drawer (Overlay) */}
      <NodeDetailDrawer 
        node={selectedNode}
        status={selectedNodeStatus}
        isOpen={!!selectedNode}
        onClose={() => setSelectedNodeId(null)}
      />

      {/* 4. Status Bar */}
      <div className="bg-white border-t border-slate-200 p-2 text-xs flex justify-between items-center text-slate-500 z-20">
        <div>
          Graph ID: <span className="font-mono">{graph?.id || 'N/A'}</span>
        </div>
        <div className="flex gap-4">
          <span>Nodes: {graph?.nodes.size || 0}</span>
          <span>Edges: {graph?.edges.length || 0}</span>
          <span className="flex items-center gap-1">
             State: <span className={`font-bold ${getStateColor(governanceState)}`}>{governanceState}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-full text-slate-400">
    <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-lg mb-4 flex items-center justify-center">
      <span className="text-2xl">∅</span>
    </div>
    <p>No Execution Graph Loaded</p>
  </div>
);

function getStateColor(state: GovernanceState): string {
  switch (state) {
    case 'HALTED': return 'text-red-600';
    case 'DENIED': return 'text-orange-600';
    case 'APPROVED': return 'text-green-600';
    case 'EXECUTING': return 'text-blue-600';
    default: return 'text-slate-600';
  }
}
