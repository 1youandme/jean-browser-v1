import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Lock, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useKernelGovernance } from '@/hooks/useKernelGovernance';
import type { GovernanceState } from '@/domain/governance/types';

function iconForState(state: GovernanceState) {
  switch (state) {
    case 'HALTED': return <Lock className="w-3 h-3" />;
    case 'DENIED': return <Lock className="w-3 h-3" />;
    case 'PAUSED': return <Shield className="w-3 h-3" />;
    case 'REVIEW_PENDING': return <AlertCircle className="w-3 h-3" />;
    case 'APPROVED': return <CheckCircle className="w-3 h-3" />;
    case 'EXECUTING': return <CheckCircle className="w-3 h-3" />;
    case 'COMPLETED': return <CheckCircle className="w-3 h-3" />;
    case 'IDLE': return <Shield className="w-3 h-3" />;
    default: return <Shield className="w-3 h-3" />;
  }
}

function mapGovernanceStateToBadge(state: GovernanceState): { label: string; color: React.ComponentProps<typeof Badge>['variant'] } {
  if (state === 'HALTED') return { label: 'Halted', color: 'destructive' };
  if (state === 'DENIED') return { label: 'Denied', color: 'destructive' };
  if (state === 'PAUSED') return { label: 'Paused', color: 'warning' };
  if (state === 'REVIEW_PENDING') return { label: 'Review', color: 'info' };
  if (state === 'APPROVED') return { label: 'Approved', color: 'success' };
  if (state === 'EXECUTING') return { label: 'Executing', color: 'success' };
  if (state === 'COMPLETED') return { label: 'Completed', color: 'success' };
  if (state === 'IDLE') return { label: 'Idle', color: 'default' };
  return { label: 'Unknown', color: 'default' };
}

export const PolicyBadge: React.FC = () => {
  const { state } = useKernelGovernance();
  const badge = mapGovernanceStateToBadge(state as GovernanceState);
  return (
    <Badge variant={badge.color} className="flex items-center gap-1 select-none">
      {iconForState(state as GovernanceState)}
      {badge.label}
    </Badge>
  );
};
