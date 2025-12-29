import { detectIntent } from '../intent/IntentDetector';
import { decide } from '../decision/DecisionGate';
import { isActionAllowed } from '../action/ActionEligibility';
import { executeWithAutonomy } from '../autonomy/BoundedExecutor';
import { KernelInput, KernelOutput } from './KernelTypes';

export function runKernel(input: KernelInput): KernelOutput {
  const intent = detectIntent(input.signals as any);
  const decision = decide({
    intent: String(intent),
    thoughtsCount: input.thoughtsCount,
    avgConfidence: input.avgConfidence,
    presenceState: input.signals.presenceState
  });
  const eligibility = isActionAllowed(input.action, decision, input.signals.presenceState);
  const executionResult = executeWithAutonomy(
    input.action,
    decision,
    eligibility,
    input.autonomyMode,
    input.executionCount,
    input.executionLimit
  );
  return { intent, decision, eligibility, executionResult };
}

