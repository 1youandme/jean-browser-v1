import { ModelProfile, ModelCapability } from './ModelTypes';

export interface ModelRegistry {
  items: ModelProfile[];
}

export function registerModel(state: ModelRegistry, model: ModelProfile): ModelRegistry {
  const exists = state.items.some(m => m.id === model.id);
  const items = exists ? state.items.map(m => (m.id === model.id ? model : m)) : [...state.items, model];
  return { items };
}

function normalizeQuality(q?: 'low' | 'medium' | 'high'): number {
  if (q === 'high') return 3;
  if (q === 'low') return 1;
  return 2;
}

function capabilityFromTask(taskType: string): ModelCapability | null {
  const t = taskType.toLowerCase();
  if (t.includes('code')) return 'code';
  if (t.includes('image') || t.includes('design')) return 'image';
  if (t.includes('video')) return 'video';
  if (t.includes('audio')) return 'audio';
  if (t.includes('data')) return 'data';
  if (t.includes('3d')) return '3d';
  if (t.includes('doc') || t.includes('text') || t.includes('write')) return 'text';
  return null;
}

export function selectModelByTask(state: ModelRegistry, taskType: string): ModelProfile | null {
  const cap = capabilityFromTask(taskType);
  if (!cap) return null;
  const candidates = state.items.filter(m => m.capabilities.includes(cap));
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => normalizeQuality(b.quality) - normalizeQuality(a.quality))[0] || null;
}

