export interface CanvasPanel {
  id: string;
  kind: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasLayout {
  panels: CanvasPanel[];
}

