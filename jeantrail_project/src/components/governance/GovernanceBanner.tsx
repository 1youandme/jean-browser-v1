import React from 'react';
import { ShieldAlert, AlertTriangle, Lock } from 'lucide-react';
import { GovernanceState } from '../../domain/governance/types';

interface GovernanceBannerProps {
  state: GovernanceState;
  reason?: string;
}

export const GovernanceBanner: React.FC<GovernanceBannerProps> = ({ state, reason }) => {
  if (state === 'IDLE' || state === 'COMPLETED' || state === 'APPROVED') return null;

  const getBannerConfig = () => {
    switch (state) {
      case 'HALTED':
        return {
          bg: 'bg-red-900',
          border: 'border-red-700',
          icon: <ShieldAlert className="h-6 w-6 text-red-200" />,
          title: 'SYSTEM HALTED',
          desc: 'Global Kill-Switch Activated. All execution workers are physically disconnected.'
        };
      case 'DENIED':
        return {
          bg: 'bg-orange-900',
          border: 'border-orange-700',
          icon: <Lock className="h-6 w-6 text-orange-200" />,
          title: 'EXECUTION DENIED',
          desc: 'The proposed pipeline violated governance policy.'
        };
      case 'REVIEW_PENDING':
        return {
          bg: 'bg-blue-900',
          border: 'border-blue-700',
          icon: <AlertTriangle className="h-6 w-6 text-blue-200" />,
          title: 'Awaiting Approval',
          desc: 'Explicit human consent required to proceed.'
        };
      case 'PAUSED':
        return {
          bg: 'bg-yellow-900',
          border: 'border-yellow-700',
          icon: <Lock className="h-6 w-6 text-yellow-200" />,
          title: 'Execution Paused',
          desc: 'System paused by operator. State is frozen.'
        };
      case 'EXECUTING':
        return {
          bg: 'bg-green-900',
          border: 'border-green-700',
          icon: <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse" />,
          title: 'System Active',
          desc: 'Pipeline is executing with limited permissions.'
        };
      default:
        return null;
    }
  };

  const config = getBannerConfig();
  if (!config) return null;

  return (
    <div className={`w-full p-4 border-b ${config.bg} ${config.border} text-white shadow-lg`}>
      <div className="container mx-auto flex items-center gap-4">
        <div className="p-2 bg-black/20 rounded-full">
          {config.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg tracking-wide">{config.title}</h3>
          <p className="text-sm opacity-90">{reason || config.desc}</p>
        </div>
        {state === 'HALTED' && (
          <div className="px-3 py-1 bg-red-600 rounded text-xs font-mono uppercase tracking-widest border border-red-400">
            Hardware Lock
          </div>
        )}
      </div>
    </div>
  );
};
