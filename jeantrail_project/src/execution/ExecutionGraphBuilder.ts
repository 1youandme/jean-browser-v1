import { ExecutionNode, ExecutionEdge } from './ExecutionGraphTypes';
import { KernelOutput } from '../kernel/KernelTypes';

export function buildExecutionGraph(kernelOutput: KernelOutput): { nodes: ExecutionNode[]; edges: ExecutionEdge[] } {
  const nodes: ExecutionNode[] = [
    { id: 'intent', type: 'intent', label: String(kernelOutput.intent), data: { intent: kernelOutput.intent } },
    { id: 'decision', type: 'decision', label: String(kernelOutput.decision), data: { decision: kernelOutput.decision } },
    { id: 'eligibility', type: 'eligibility', label: String(kernelOutput.eligibility), data: { eligibility: kernelOutput.eligibility } },
    { id: 'executor', type: 'executor', label: String(kernelOutput.executionResult), data: { result: kernelOutput.executionResult } }
  ];
  const edges: ExecutionEdge[] = [
    { from: 'intent', to: 'decision', label: 'evaluate' },
    { from: 'decision', to: 'eligibility', label: 'check' },
    { from: 'eligibility', to: 'executor', label: 'execute' }
  ];
  return { nodes, edges };
}

