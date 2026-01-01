import type { IsolationLevel } from './KernelState';
import type { Intent } from './Intent';
import type { PolicyOutcomeKind } from './PolicyOutcome';
import { PolicyReasonCode } from './PolicyOutcome';
import { INTENT_DEFINITIONS } from './Intent';

const badIso: IsolationLevel = 'strict';
const badIntent: Intent = 'NOT_AN_INTENT' as Intent;
const badOutcome: PolicyOutcomeKind = 'DENY';
const badCode: PolicyReasonCode = 'FOO' as PolicyReasonCode;
const badAllowedIsolation: IsolationLevel[] = ['strict'];
const badIntentDef = INTENT_DEFINITIONS['INVALID' as Intent];
