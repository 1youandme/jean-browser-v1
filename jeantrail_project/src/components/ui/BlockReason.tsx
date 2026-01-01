import React, { useEffect, useRef } from 'react';
import type { ImmutablePolicyOutcome } from '@/kernel/PolicyOutcome';
import { PolicyReasonCode } from '@/kernel/PolicyOutcome';
import { AlertCircle, Shield, Lock, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function policyOutcomeToMessage(outcome: ImmutablePolicyOutcome): string {
  switch (outcome.code) {
    case PolicyReasonCode.GOVERNANCE_LOCK:
      return `Actions are paused by governance lock. [Code: ${outcome.code}]`;
    case PolicyReasonCode.EXPLICIT_CONSENT_REQUIRED:
      return `This action needs your explicit approval. [Code: ${outcome.code}]`;
    case PolicyReasonCode.PROVIDER_NOT_FOUND:
      return `No suitable app is available for this request. [Code: ${outcome.code}]`;
    case PolicyReasonCode.INVALID_ISOLATION:
      return `Current isolation mode does not allow this action. [Code: ${outcome.code}]`;
    case PolicyReasonCode.MISSING_PERMISSION:
      return `A required permission is missing for this action. [Code: ${outcome.code}]`;
    case PolicyReasonCode.OK:
    default:
      return `Action approved. [Code: ${outcome.code}]`;
  }
}

function iconFor(code: PolicyReasonCode) {
  switch (code) {
    case PolicyReasonCode.GOVERNANCE_LOCK:
      return <Lock className="w-4 h-4" />;
    case PolicyReasonCode.EXPLICIT_CONSENT_REQUIRED:
      return <AlertCircle className="w-4 h-4" />;
    case PolicyReasonCode.INVALID_ISOLATION:
      return <Shield className="w-4 h-4" />;
    case PolicyReasonCode.PROVIDER_NOT_FOUND:
      return <Search className="w-4 h-4" />;
    case PolicyReasonCode.MISSING_PERMISSION:
      return <Shield className="w-4 h-4" />;
    case PolicyReasonCode.OK:
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
}

export interface BlockReasonProps {
  outcome: ImmutablePolicyOutcome;
  className?: string;
}

export const BlockReason: React.FC<BlockReasonProps> = ({ outcome, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, [outcome.code, outcome.reason]);
  const message = policyOutcomeToMessage(outcome);
  const isBlocked = outcome.kind === 'DENY' || outcome.kind === 'HALT';
  return (
    <div
      ref={ref}
      role={isBlocked ? 'alert' : 'status'}
      aria-live="polite"
      tabIndex={0}
      className={cn(
        'flex items-center gap-2 text-sm rounded-md px-3 py-2',
        isBlocked ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200',
        className
      )}
    >
      {iconFor(outcome.code)}
      <span>{message}</span>
    </div>
  );
};
