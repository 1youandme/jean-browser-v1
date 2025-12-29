export interface ExecutionNode {
  id: string;
  type: string;
  label?: string;
  data?: Record<string, unknown>;
}

export interface ExecutionEdge {
  from: string;
  to: string;
  label?: string;
}

