import { DataScope } from '../../privacy/DataScope';

export enum SearchActionType {
  image_search = 'image_search',
  voice_search = 'voice_search',
  spell_check = 'spell_check'
}

export enum ChatActionType {
  voice_input = 'voice_input',
  screen_context = 'screen_context',
  clarify_intent = 'clarify_intent',
  summarize_context = 'summarize_context',
  switch_workspace = 'switch_workspace'
}

export type InteractionActionCategory = 'search' | 'chat';

export interface InteractionActionSuggestion {
  id: string;
  category: InteractionActionCategory;
  action: SearchActionType | ChatActionType;
  confidence: number;
  reason: string;
  scope: DataScope;
  nonBlocking: true;
  dismissible: true;
  optional: true;
  visible: boolean;
}

export interface InteractionContext {
  privacyScope?: DataScope;
  sessionConfidence?: number;
  activeWorkspaceId?: string;
  screenAvailable?: boolean;
  voiceAvailable?: boolean;
  intentHints?: string[];
}
