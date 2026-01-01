import { LogisticsExecutionGraph } from './LogisticsTypes';
import { GovernanceTag } from '../../types';

export type NodeTimeline = { start: number; end: number; duration: number; level: number };
export type TimelinePlan = { nodes: Map<string, NodeTimeline>; totalDuration: number; concurrencyByMinute: Map<number, number> };

export type RiskFlag = { nodeId?: string; type: 'delay' | 'overload'; level: 'info' | 'warning' | 'critical'; message: string };

export function planTimeline(graph: LogisticsExecutionGraph): TimelinePlan {
  const nodes = graph.nodes;
  const edges = graph.edges;
  const inDegree = new Map<string, number>();
  nodes.forEach((_, id) => inDegree.set(id, 0));
  edges.forEach(e => inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1));
  const levels = new Map<string, number>();
  const queue: string[] = [];
  nodes.forEach((_, id) => {
    if ((inDegree.get(id) || 0) === 0) queue.push(id);
  });
  const adj = new Map<string, string[]>();
  nodes.forEach((_, id) => adj.set(id, []));
  edges.forEach(e => adj.get(e.from)?.push(e.to));
  while (queue.length) {
    const id = queue.shift() as string;
    const incoming = edges.filter(x => x.to === id);
    let lvl = 0;
    incoming.forEach(x => {
      const pl = levels.get(x.from) || 0;
      if (pl + 1 > lvl) lvl = pl + 1;
    });
    levels.set(id, lvl);
    (adj.get(id) || []).forEach(n => queue.push(n));
  }
  const timeline = new Map<string, NodeTimeline>();
  const getDur = (id: string): number => {
    const n = nodes.get(id);
    return n ? n.estimatedDurationMinutes : 0;
  };
  const order = Array.from(nodes.keys());
  order.forEach(id => {
    const preds = edges.filter(e => e.to === id).map(e => e.from);
    const start = preds.length === 0 ? 0 : Math.max(...preds.map(p => (timeline.get(p)?.end || 0)));
    const duration = getDur(id);
    const end = start + duration;
    const level = levels.get(id) || 0;
    timeline.set(id, { start, end, duration, level });
  });
  const totalDuration = Math.max(0, ...Array.from(timeline.values()).map(t => t.end));
  const concurrencyByMinute = new Map<number, number>();
  for (let m = 0; m <= totalDuration; m++) {
    let c = 0;
    timeline.forEach(t => {
      if (m >= t.start && m < t.end) c++;
    });
    concurrencyByMinute.set(m, c);
  }
  return { nodes: timeline, totalDuration, concurrencyByMinute };
}

export function evaluateRisks(plan: TimelinePlan, concurrencyLimit: number = 3, delayThresholdMinutes: number = 240): RiskFlag[] {
  const risks: RiskFlag[] = [];
  plan.nodes.forEach((t, id) => {
    if (t.duration > delayThresholdMinutes) {
      risks.push({ nodeId: id, type: 'delay', level: 'warning', message: `Duration ${t.duration}m exceeds threshold ${delayThresholdMinutes}m` });
    }
  });
  let maxC = 0;
  plan.concurrencyByMinute.forEach(c => {
    if (c > maxC) maxC = c;
  });
  if (maxC > concurrencyLimit) {
    risks.push({ type: 'overload', level: 'critical', message: `Concurrency ${maxC} exceeds limit ${concurrencyLimit}` });
  }
  return risks;
}

export function governanceTags(): GovernanceTag[] {
  return ['visualization_only', 'review_only', 'no_execution', 'local'];
}

