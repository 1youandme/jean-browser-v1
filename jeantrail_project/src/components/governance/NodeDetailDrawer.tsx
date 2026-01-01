import React from 'react';
import { X, Shield, Activity, Database, Server, Clock } from 'lucide-react';
import { NodeSpec, NodeCapability } from '../../kernel/graph/ExecutionGraph';
import { NodeStatus } from '../../kernel/graph/RuntimeTypes';

interface NodeDetailDrawerProps {
  node: NodeSpec | null;
  status?: NodeStatus;
  isOpen: boolean;
  onClose: () => void;
}

export const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({ node, status, isOpen, onClose }) => {
  if (!isOpen || !node) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-96 bg-background border-l border-border shadow-2xl transform transition-transform duration-200 ease-in-out z-20 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(status || 'pending')}`} />
          <h2 className="font-semibold text-lg truncate" title={node.name}>{node.name}</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-muted rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Capability Section */}
        <section>
          <h3 className="text-xs font-mono uppercase text-muted-foreground mb-2 flex items-center gap-2">
            <Activity className="w-3 h-3" /> Capability
          </h3>
          <div className="p-3 bg-muted/50 rounded-md border border-border">
            <div className="font-medium">{node.capability}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Model: <span className="font-mono text-foreground">{node.model}</span>
            </div>
          </div>
        </section>

        {/* Inputs / Data Flow */}
        <section>
          <h3 className="text-xs font-mono uppercase text-muted-foreground mb-2 flex items-center gap-2">
            <Database className="w-3 h-3" /> Data Inputs
          </h3>
          <div className="space-y-2">
            {Object.entries(node.inputs).map(([key, input]) => (
              <div key={key} className="text-sm p-2 rounded border border-border bg-card">
                <div className="font-medium text-xs text-blue-500">{key}</div>
                {input.sourceNodeId ? (
                  <div className="text-xs mt-1 truncate">
                    ← From Node: <span className="font-mono">{input.sourceNodeId.substring(0, 8)}...</span>
                    <br/>
                    <span className="opacity-75">Output: {input.sourceOutputName}</span>
                  </div>
                ) : (
                  <div className="text-xs mt-1 font-mono text-green-600 truncate">
                     = {JSON.stringify(input.staticValue)}
                  </div>
                )}
              </div>
            ))}
            {Object.keys(node.inputs).length === 0 && (
              <div className="text-xs text-muted-foreground italic">No inputs configured</div>
            )}
          </div>
        </section>

        {/* Governance Constraints */}
        <section>
          <h3 className="text-xs font-mono uppercase text-muted-foreground mb-2 flex items-center gap-2">
            <Shield className="w-3 h-3" /> Governance Controls
          </h3>
          <div className="space-y-2 text-sm">
            <ConstraintItem 
              label="Local Execution Only" 
              value={node.constraints.localOnly} 
              active={node.constraints.localOnly}
            />
            <ConstraintItem 
              label="Network Access" 
              value={node.constraints.networkAccess || 'none'} 
              active={node.constraints.networkAccess !== 'none'}
              warning={node.constraints.networkAccess === 'full'}
            />
            <ConstraintItem 
              label="Max Duration" 
              value={`${node.constraints.maxDurationMs || 0}ms`} 
              icon={<Clock className="w-3 h-3" />}
            />
          </div>
        </section>

        {/* Privacy & Ledger */}
        <section>
          <h3 className="text-xs font-mono uppercase text-muted-foreground mb-2 flex items-center gap-2">
            <Shield className="w-3 h-3" /> Privacy & Ledger
          </h3>
          <div className="p-3 bg-muted/50 rounded-md border border-border text-xs text-muted-foreground">
            Clipboard Ledger is local-only and tagged as <span className="font-mono">local_sensitive</span>. 
            No network, no analytics, no auto-clear. Persistence remains off unless explicitly allowed.
          </div>
        </section>

        {/* Outputs */}
        <section>
          <h3 className="text-xs font-mono uppercase text-muted-foreground mb-2 flex items-center gap-2">
            <Server className="w-3 h-3" /> Expected Outputs
          </h3>
          <div className="space-y-1">
            {node.outputs.map(out => (
              <div key={out.name} className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                <span className="font-mono">{out.name}</span>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 rounded">{out.type}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
      
      {/* Footer ID */}
      <div className="p-3 border-t border-border bg-muted/20 text-[10px] font-mono text-muted-foreground text-center select-all">
        UUID: {node.id}
      </div>
    </div>
  );
};

const ConstraintItem = ({ label, value, active = true, warning = false, icon }: any) => (
  <div className={`flex justify-between items-center p-2 rounded border ${
    warning ? 'border-orange-500/50 bg-orange-500/10' : 'border-border'
  }`}>
    <span className="flex items-center gap-2 text-muted-foreground">
      {icon} {label}
    </span>
    <span className={`font-mono ${
      active ? (warning ? 'text-orange-500' : 'text-green-500') : 'text-muted-foreground'
    }`}>
      {String(value)}
    </span>
  </div>
);

function getStatusColor(status: NodeStatus | 'pending'): string {
  switch (status) {
    case 'completed': return 'bg-green-500';
    case 'running': return 'bg-blue-500 animate-pulse';
    case 'failed': return 'bg-red-500';
    case 'skipped': return 'bg-gray-500';
    default: return 'bg-gray-300';
  }
}
