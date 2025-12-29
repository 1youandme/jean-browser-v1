export type ModelCapability = 'text' | 'code' | 'image' | 'video' | 'audio' | 'data' | '3d';
export interface ModelProfile {
  id: string;
  name: string;
  capabilities: ModelCapability[];
  quality?: 'low' | 'medium' | 'high';
}

