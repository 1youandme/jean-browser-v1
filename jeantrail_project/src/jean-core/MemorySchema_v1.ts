import { CoreDecisionType } from './PolicyGraph';
export interface AdvisoryEntry {
  timestamp: string;
  context: string;
  decision_type: CoreDecisionType;
  advisory: string;
  advisory_id: string;
}
export interface MemoryView {
  entries: ReadonlyArray<AdvisoryEntry>;
}
export function createMemoryView(entries: AdvisoryEntry[]): MemoryView {
  return { entries: entries.slice() };
}
