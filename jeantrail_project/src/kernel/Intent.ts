/**
 * Intent
 *
 * Governance-first contract for Kernel intents.
 * Types only. No runtime logic in the contract.
 *
 * Each intent is a closed union member with:
 * - defined purpose
 * - required permissions
 * - allowed isolation levels
 */
import { IsolationLevel } from './KernelState';

export type Intent =
  | 'EXPLAIN_VERSE'
  | 'LOAD_TAFSIR'
  | 'READ_VERSE'
  | 'SEARCH_QURAN'
  | 'PLAY_RECITATION'
  | 'EXPORT_AUDIT'
  | 'SUGGEST_CRITERIA'
  | 'SUGGEST_ENTITIES'
  | 'FILL_COMPARISON_CELLS'
  | 'EXPORT_COMPARISON_JSON';

export type PermissionName =
  | 'corpus.read'
  | 'tafsir.read'
  | 'audio.play'
  | 'audit.read'
  | 'audit.export'
  | 'search.query'
  | 'explain.generate'
  | 'table.edit'
  | 'table.export';

/**
 * IntentDefinition
 *
 * Static definition for an intent catalog item:
 * - purpose: human-readable description
 * - requiredPermissions: closed set of permission names
 * - allowedIsolation: closed set of isolation levels
 */
export interface IntentDefinition {
  purpose: string;
  requiredPermissions: PermissionName[];
  allowedIsolation: IsolationLevel[];
}

export const INTENT_DEFINITIONS: Record<Intent, IntentDefinition> = {
  EXPLAIN_VERSE: {
    purpose: 'Generate assistive, cited summary using offline model and classical tafsir.',
    requiredPermissions: ['corpus.read', 'tafsir.read', 'explain.generate'],
    allowedIsolation: ['strict', 'shared_read']
  },
  LOAD_TAFSIR: {
    purpose: 'Load read-only tafsir excerpts for the selected verse.',
    requiredPermissions: ['tafsir.read', 'corpus.read'],
    allowedIsolation: ['strict', 'shared_read']
  },
  READ_VERSE: {
    purpose: 'Display Quran Arabic text and selected translations.',
    requiredPermissions: ['corpus.read'],
    allowedIsolation: ['strict', 'shared_read']
  },
  SEARCH_QURAN: {
    purpose: 'Local search across Arabic and translations.',
    requiredPermissions: ['search.query', 'corpus.read'],
    allowedIsolation: ['strict', 'shared_read']
  },
  PLAY_RECITATION: {
    purpose: 'Play local audio recitation for the verse.',
    requiredPermissions: ['audio.play'],
    allowedIsolation: ['strict', 'shared_read']
  },
  EXPORT_AUDIT: {
    purpose: 'Export local decision and audit history to a file.',
    requiredPermissions: ['audit.read', 'audit.export'],
    allowedIsolation: ['strict', 'shared_read', 'shared_write']
  },
  SUGGEST_CRITERIA: {
    purpose: 'Suggest comparison criteria from local content.',
    requiredPermissions: ['explain.generate'],
    allowedIsolation: ['strict', 'shared_read']
  },
  SUGGEST_ENTITIES: {
    purpose: 'Suggest entities/items to compare from local content.',
    requiredPermissions: ['explain.generate'],
    allowedIsolation: ['strict', 'shared_read']
  },
  FILL_COMPARISON_CELLS: {
    purpose: 'Fill comparison table cells with local, cited values.',
    requiredPermissions: ['explain.generate', 'table.edit'],
    allowedIsolation: ['strict', 'shared_read']
  },
  EXPORT_COMPARISON_JSON: {
    purpose: 'Export the comparison table to local JSON.',
    requiredPermissions: ['table.export'],
    allowedIsolation: ['strict', 'shared_read', 'shared_write']
  }
};

export function isIntent(value: string): value is Intent {
  return (value as Intent) in INTENT_DEFINITIONS;
}
