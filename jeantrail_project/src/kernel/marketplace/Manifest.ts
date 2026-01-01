import { NodeCapability } from '../graph/ExecutionGraph';
import type { PermissionName } from '../Intent';

export type ModelBackend = 'local' | 'api' | 'cloud' | 'hybrid';

export interface MarketplaceModel {
  id: string;
  name: string;
  provider: string;
  version: string;
  backend: ModelBackend;
  capabilities: readonly NodeCapability[];
  requiredPermissions: PermissionName[];
  isDefault: false;
}

export const MARKETPLACE_MANIFEST: ReadonlyArray<MarketplaceModel> = Object.freeze([
  Object.freeze({
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    version: '1.0.0',
    backend: 'local',
    capabilities: [NodeCapability.REASONING, NodeCapability.PLANNING],
    requiredPermissions: [],
    isDefault: false
  }),
  Object.freeze({
    id: 'stable-video-diffusion',
    name: 'Stable Video Diffusion',
    provider: 'Stability',
    version: '2.1.0',
    backend: 'local',
    capabilities: [NodeCapability.VIDEO_GEN],
    requiredPermissions: [],
    isDefault: false
  }),
  Object.freeze({
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    version: '2024-12',
    backend: 'api',
    capabilities: [NodeCapability.REASONING, NodeCapability.CODE_GEN, NodeCapability.PLANNING],
    requiredPermissions: [],
    isDefault: false
  })
]);
