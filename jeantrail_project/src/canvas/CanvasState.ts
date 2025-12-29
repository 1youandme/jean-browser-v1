import { CanvasLayout, CanvasPanel } from './CanvasTypes';

export function createCanvasState(): CanvasLayout {
  return { panels: [] };
}

export function addPanel(layout: CanvasLayout, panel: CanvasPanel): CanvasLayout {
  const exists = layout.panels.some(p => p.id === panel.id);
  const panels = exists ? layout.panels.map(p => (p.id === panel.id ? panel : p)) : [...layout.panels, panel];
  return { panels };
}

