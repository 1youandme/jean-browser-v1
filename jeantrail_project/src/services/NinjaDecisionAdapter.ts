export type NinjaDecisionType = 'route' | 'policy' | 'explanation' | 'block' | 'consent';

export interface NinjaDecisionQuery {
  context: string;
  decision_type: NinjaDecisionType;
  payload?: Record<string, unknown>;
}

export interface NinjaAdvisoryResponse {
  timestamp: string;
  context: string;
  decision_type: NinjaDecisionType;
  advisory: string;
  advisory_id: string;
}

function synthesizeAdvisory(query: NinjaDecisionQuery): NinjaAdvisoryResponse {
  const now = new Date().toISOString();
  const id = Math.random().toString(36).slice(2);
  let advisory = 'observe';
  if (query.decision_type === 'route') advisory = 'ui_explanation';
  else if (query.decision_type === 'policy') advisory = 'respect_freeze';
  else if (query.decision_type === 'explanation') advisory = 'explain_context';
  else if (query.decision_type === 'block') advisory = 'block_and_explain';
  else if (query.decision_type === 'consent') advisory = 'seek_consent_nonbinding';
  return {
    timestamp: now,
    context: query.context,
    decision_type: query.decision_type,
    advisory,
    advisory_id: id
  };
}

async function writeLogNode(entry: NinjaAdvisoryResponse) {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const baseDir = path.join(process.cwd(), 'logs', 'ninja-advisory');
  fs.mkdirSync(baseDir, { recursive: true });
  const file = path.join(baseDir, `${new Date().toISOString().slice(0, 10)}.jsonl`);
  fs.appendFileSync(file, JSON.stringify(entry) + '\n');
}

export async function sendAdvisory(query: NinjaDecisionQuery): Promise<NinjaAdvisoryResponse> {
  const response = synthesizeAdvisory(query);
  if (typeof window === 'undefined') {
    try {
      await writeLogNode(response);
    } catch {}
  }
  return response;
}
