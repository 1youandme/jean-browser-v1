import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(date: string | Date, locale = 'en-US'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined;
  return (...args: Parameters<T>) => {
    if (timeout !== undefined) globalThis.clearTimeout(timeout);
    timeout = globalThis.setTimeout(() => func(...args), wait) as unknown as number;
  };
}

export function generateId(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function truncate(str: string, length: number, ending = '...'): string {
  if (str.length <= length) return str;
  return str.substring(0, length - ending.length) + ending;
}

export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function isValidUrl(url: string): boolean {
  return /^[a-z]+:\/\//i.test(url);
}

export type DecisionTriggerSource =
  | 'user_action'
  | 'voice'
  | 'canvas'
  | 'agent_request'
  | 'mode_switch'
  | 'workspace_event'
  | 'voice_command'
  | 'canvas_interaction'
  | 'workspace_switch';
export type DecisionIntent = 'informational' | 'creative' | 'analytical' | 'operational' | 'execution';
export type RiskLevel = 'low' | 'medium' | 'high' | 'unknown';
export type PermissionScope = 'read' | 'suggest' | 'execute';
export interface TriggerInput { source: DecisionTriggerSource; payload?: Record<string, any>; }
export interface TriggerData { id: string; source: DecisionTriggerSource; intent: DecisionIntent; timestamp: number; payload?: Record<string, any>; }
export interface AssembledContext {
  activeWorkspace?: string;
  activeMode?: 'local' | 'proxy' | 'web' | 'mobile';
  activeTabId?: string;
  canvasState?: Record<string, any> | null;
  userIntent?: DecisionIntent;
  permissionScope: PermissionScope;
  riskLevel: RiskLevel;
  complete: boolean;
  reason?: string;
}
export interface DecisionModel {
  confidence: number;
  risk: number;
  impactScope: 'self' | 'workspace' | 'project' | 'system';
  reversible: boolean;
  priority: 'low' | 'medium' | 'high';
  urgency: 'now' | 'soon' | 'later';
  alternatives?: string[];
}
export interface AuthorityGateResult {
  next: 'allow' | 'suggest' | 'confirm' | 'clarify';
  reason: string;
}
export interface SovereigntyResult {
  requiresApproval: boolean;
  canCancel: boolean;
  canModify: boolean;
  canRevoke: boolean;
  userOverride: boolean;
}
export interface ExecutionRules {
  oneExecutionPerMode: boolean;
  visible: boolean;
  interruptible: boolean;
  singleInstance: boolean;
  timeBound: boolean;
}
export interface ExecutionPlan {
  permitted: boolean;
  rules: ExecutionRules;
  reason: string;
}
export interface Explanation {
  happened: string;
  why: string;
  alternatives: string[];
  permission: PermissionScope;
}
export interface ClosureResult {
  persisted: boolean;
  cleared: boolean;
}

export function classifyTriggerIntent(input: TriggerInput): DecisionIntent {
  if (input.source === 'mode_switch' || input.source === 'workspace_event' || input.source === 'workspace_switch') return 'operational';
  const t = (input.payload?.type || '').toString().toLowerCase();
  if (t.includes('search') || t.includes('info')) return 'informational';
  if (t.includes('create') || t.includes('draw') || t.includes('design')) return 'creative';
  if (t.includes('analy') || t.includes('compute')) return 'analytical';
  if (t.includes('exec') || t.includes('run')) return 'execution';
  return 'operational';
}

export function defineTrigger(input: TriggerInput): TriggerData {
  return { id: generateId(12), source: input.source, intent: classifyTriggerIntent(input), timestamp: Date.now(), payload: input.payload };
}

export function assembleContext(trigger: TriggerData, state: Partial<AssembledContext>): AssembledContext {
  const permissionScope = state.permissionScope || 'suggest';
  const riskLevel: RiskLevel = state.riskLevel || 'unknown';
  const complete = !!state.activeMode && !!state.activeTabId && permissionScope !== undefined && riskLevel !== undefined;
  return {
    activeWorkspace: state.activeWorkspace,
    activeMode: state.activeMode,
    activeTabId: state.activeTabId,
    canvasState: state.canvasState || null,
    userIntent: trigger.intent,
    permissionScope,
    riskLevel,
    complete,
    reason: complete ? '' : 'incomplete_context'
  };
}

export function modelDecision(ctx: AssembledContext, trigger: TriggerData): DecisionModel {
  const baseConfidence = ctx.complete ? 0.8 : 0.2;
  const intentAdjust = trigger.intent === 'informational' ? 0.1 : trigger.intent === 'creative' ? 0.05 : trigger.intent === 'analytical' ? 0.15 : trigger.intent === 'operational' ? 0.0 : 0.2;
  const confidence = Math.max(0, Math.min(1, baseConfidence + intentAdjust));
  const risk = ctx.riskLevel === 'low' ? 0.2 : ctx.riskLevel === 'medium' ? 0.5 : ctx.riskLevel === 'high' ? 0.8 : 0.6;
  const impactScope: DecisionModel['impactScope'] = ctx.activeWorkspace ? 'workspace' : 'self';
  const reversible = ctx.permissionScope !== 'execute' ? true : risk < 0.7;
  const priority: DecisionModel['priority'] = risk >= 0.8 ? 'high' : risk >= 0.5 ? 'medium' : 'low';
  const urgency: DecisionModel['urgency'] = trigger.source === 'mode_switch' ? 'now' : 'soon';
  const alternatives = trigger.source === 'mode_switch' ? ['reuse_existing_mode_instance'] : ['modify_parameters', 'defer'];
  return { confidence, risk, impactScope, reversible, priority, urgency, alternatives };
}

export function authorityGate(ctx: AssembledContext, model: DecisionModel): AuthorityGateResult {
  if (!ctx.complete) return { next: 'clarify', reason: 'incomplete_context' };
  if (ctx.riskLevel === 'low' && model.confidence >= 0.8 && ctx.permissionScope === 'execute') return { next: 'allow', reason: 'low_risk_high_conf_execute' };
  if (ctx.riskLevel === 'medium' || model.confidence >= 0.5) return { next: 'suggest', reason: 'medium_risk_or_confidence' };
  if (ctx.riskLevel === 'high' || ctx.permissionScope !== 'execute') return { next: 'confirm', reason: 'high_risk_or_no_permission' };
  return { next: 'clarify', reason: 'unknown' };
}

export function userSovereignty(gate: AuthorityGateResult): SovereigntyResult {
  const requiresApproval = gate.next === 'confirm' || gate.next === 'suggest';
  return { requiresApproval, canCancel: true, canModify: true, canRevoke: true, userOverride: true };
}

export function controlledExecution(gate: AuthorityGateResult, ctx: AssembledContext): ExecutionPlan {
  const rules: ExecutionRules = { oneExecutionPerMode: true, visible: true, interruptible: true, singleInstance: true, timeBound: true };
  if (gate.next === 'allow' && ctx.permissionScope === 'execute') return { permitted: true, rules, reason: 'allowed_by_matrix' };
  return { permitted: false, rules, reason: 'requires_user_approval_or_clarification' };
}

export function explainReflect(trigger: TriggerData, ctx: AssembledContext, model: DecisionModel, gate: AuthorityGateResult, executed: boolean): Explanation {
  const happened = executed ? 'executed' : 'not_executed';
  const why = gate.reason;
  const alternatives = gate.next === 'clarify' ? ['clarify_context'] : gate.next === 'suggest' ? ['request_approval', 'modify_action'] : gate.next === 'confirm' ? ['explicit_confirmation'] : (model.alternatives || []);
  return { happened, why, alternatives, permission: ctx.permissionScope };
}

export function sessionClosure(): ClosureResult {
  return { persisted: false, cleared: true };
}

export interface LifecycleOutcome {
  trigger: TriggerData;
  context: AssembledContext;
  model: DecisionModel;
  gate: AuthorityGateResult;
  sovereignty: SovereigntyResult;
  plan: ExecutionPlan;
  explanation: Explanation;
  closure: ClosureResult;
  canExecute: boolean;
}

export function governDecision(input: TriggerInput, state: Partial<AssembledContext>): LifecycleOutcome {
  const trigger = defineTrigger(input);
  const context = assembleContext(trigger, state);
  const model = modelDecision(context, trigger);
  const gate = authorityGate(context, model);
  const sovereignty = userSovereignty(gate);
  const plan = controlledExecution(gate, context);
  const explanation = explainReflect(trigger, context, model, gate, plan.permitted);
  const closure = sessionClosure();
  return {
    trigger,
    context,
    model,
    gate,
    sovereignty,
    plan,
    explanation,
    closure,
    canExecute: plan.permitted
  };
}

export type AgentTargetScope = 'UI' | 'Canvas' | 'Workspace' | 'Tab' | 'System';
export type AgentMode = 'web' | 'proxy' | 'local' | 'mobile';
export type Reversibility = 'reversible' | 'irreversible' | 'unknown';
export interface AgentDecisionRequest {
  agentId: string;
  agentRole: string;
  intentDescription: string;
  targetScope: AgentTargetScope;
  workspace: string;
  mode: AgentMode;
  requestedPermission: PermissionScope;
  estimatedRisk: RiskLevel;
  reversibility: Reversibility;
}
export interface AgentIntentValidationResult { valid: boolean; reasons: string[] }

function permissionRank(p: PermissionScope): number {
  return p === 'read' ? 0 : p === 'suggest' ? 1 : 2;
}

function allowedPermissionForRole(role: string): PermissionScope {
  const r = role.toLowerCase();
  if (r.includes('observer') || r.includes('viewer')) return 'read';
  if (r.includes('assistant') || r.includes('suggest')) return 'suggest';
  if (r.includes('operator') || r.includes('executor')) return 'execute';
  return 'read';
}

function isIntentClear(text: string): boolean {
  const t = (text || '').trim();
  if (t.length < 10) return false;
  const verbs = ['open', 'create', 'analyze', 'modify', 'execute', 'navigate', 'switch'];
  return verbs.some(v => t.toLowerCase().includes(v));
}

export function validateAgentIntent(req: AgentDecisionRequest): AgentIntentValidationResult {
  const reasons: string[] = [];
  if (!req.agentId) reasons.push('missing_agentId');
  if (!req.agentRole) reasons.push('missing_agentRole');
  if (!req.intentDescription) reasons.push('missing_intentDescription');
  if (!req.workspace) reasons.push('missing_workspace');
  if (!req.mode) reasons.push('missing_mode');
  if (!req.targetScope) reasons.push('missing_targetScope');
  if (!req.requestedPermission) reasons.push('missing_requestedPermission');
  if (!req.estimatedRisk) reasons.push('missing_estimatedRisk');
  if (!req.reversibility) reasons.push('missing_reversibility');
  if (!isIntentClear(req.intentDescription)) reasons.push('vague_intent');
  const allowed = allowedPermissionForRole(req.agentRole);
  if (permissionRank(req.requestedPermission) > permissionRank(allowed)) reasons.push('exceeds_agent_authority');
  const valid = reasons.length === 0;
  return { valid, reasons };
}

export function agentIntentToTrigger(req: AgentDecisionRequest): TriggerInput {
  return { source: 'agent_request', payload: { agentId: req.agentId, agentRole: req.agentRole, intentDescription: req.intentDescription, targetScope: req.targetScope, workspace: req.workspace } };
}

export function assembleAgentContext(req: AgentDecisionRequest, extras: { activeTabId?: string; canvasState?: Record<string, any> }): Partial<AssembledContext> {
  return {
    activeWorkspace: req.workspace,
    activeMode: req.mode,
    activeTabId: extras.activeTabId,
    canvasState: extras.canvasState || null,
    permissionScope: req.requestedPermission,
    riskLevel: req.estimatedRisk
  } as Partial<AssembledContext>;
}

export interface AgentIntentForwardResult { validation: AgentIntentValidationResult; outcome?: LifecycleOutcome; error?: string }

export function forwardAgentIntent(req: AgentDecisionRequest, extras: { activeTabId?: string; canvasState?: Record<string, any> }): AgentIntentForwardResult {
  const validation = validateAgentIntent(req);
  if (!validation.valid) return { validation, error: 'invalid_intent' };
  const input = agentIntentToTrigger(req);
  const state = assembleAgentContext(req, extras);
  const outcome = governDecision(input, state);
  return { validation, outcome };
}

export type RoutingChannel = 'UI_EXECUTION' | 'UI_EXPLANATION' | 'UI_CONSENT' | 'CONTEXT_CLARIFICATION' | 'BLOCKED';
export interface DecisionRoute {
  channel: RoutingChannel;
  visible: boolean;
  interruptible: boolean;
  requiresApproval: boolean;
  message: string;
  requestFields?: string[];
}

export function routeLifecycleOutcome(outcome: LifecycleOutcome): DecisionRoute {
  const next = outcome.gate.next;
  const visible = true;
  const interruptible = true;
  if (next === 'allow' && outcome.plan.permitted) {
    return { channel: 'UI_EXECUTION', visible, interruptible, requiresApproval: false, message: outcome.explanation.why };
  }
  if (next === 'suggest') {
    return { channel: 'UI_EXPLANATION', visible, interruptible, requiresApproval: true, message: outcome.explanation.why };
  }
  if (next === 'confirm') {
    return { channel: 'UI_CONSENT', visible, interruptible, requiresApproval: true, message: outcome.explanation.why };
  }
  if (next === 'clarify') {
    const missing = outcome.context.complete ? [] : [outcome.context.reason || 'context_missing'];
    return { channel: 'CONTEXT_CLARIFICATION', visible, interruptible, requiresApproval: false, message: outcome.explanation.why, requestFields: missing };
  }
  return { channel: 'BLOCKED', visible, interruptible, requiresApproval: false, message: 'invalid_routing' };
}

export type CanvasObjectType = 'image_region' | 'video_segment' | 'layer' | 'shape' | 'text_block' | 'diagram' | 'simulation_entity';
export type CanvasOrigin = 'tool' | 'agent' | 'user';
export interface CanvasObject {
  objectId: string;
  objectType: CanvasObjectType;
  origin: CanvasOrigin;
  ownerId: string;
  ownerRole?: string;
  permissionScope: PermissionScope;
  reversibility: Reversibility;
  riskLevel: RiskLevel;
}
export type CanvasAction =
  | 'create'
  | 'modify'
  | 'resize'
  | 'rotate'
  | 'move'
  | 'delete'
  | 'isolate'
  | 'share'
  | 'export';
export interface CanvasValidationResult { valid: boolean; reasons: string[] }
export interface CanvasAuthorityResult { allowed: boolean; reasons: string[] }

function requiredPermissionForAction(a: CanvasAction): PermissionScope {
  if (a === 'create' || a === 'delete' || a === 'export' || a === 'share') return 'execute';
  if (a === 'modify' || a === 'resize' || a === 'rotate' || a === 'move' || a === 'isolate') return 'suggest';
  return 'read';
}

function actionRisk(a: CanvasAction): RiskLevel {
  if (a === 'delete' || a === 'export' || a === 'share') return 'high';
  if (a === 'modify' || a === 'resize' || a === 'rotate' || a === 'move' || a === 'create') return 'medium';
  return 'low';
}

export function validateCanvasObject(obj: CanvasObject): CanvasValidationResult {
  const reasons: string[] = [];
  if (!obj.objectId) reasons.push('missing_objectId');
  if (!obj.objectType) reasons.push('missing_objectType');
  if (!obj.origin) reasons.push('missing_origin');
  if (!obj.ownerId) reasons.push('missing_ownerId');
  if (!obj.permissionScope) reasons.push('missing_permissionScope');
  if (!obj.reversibility) reasons.push('missing_reversibility');
  if (!obj.riskLevel) reasons.push('missing_riskLevel');
  const valid = reasons.length === 0;
  return { valid, reasons };
}

export function checkCanvasAuthority(obj: CanvasObject, action: CanvasAction, requested: PermissionScope): CanvasAuthorityResult {
  const reasons: string[] = [];
  if (!validateCanvasObject(obj).valid) reasons.push('invalid_object');
  const reqMin = requiredPermissionForAction(action);
  if (permissionRank(requested) < permissionRank(reqMin)) reasons.push('insufficient_requested_permission');
  if (permissionRank(obj.permissionScope) < permissionRank(reqMin)) reasons.push('object_permission_insufficient');
  const allowed = reasons.length === 0;
  return { allowed, reasons };
}

export interface SelectorSafetyInput { ephemeralId?: string; hasCoordinates?: boolean; persistId?: string }
export function validateSelectorSafety(sel: SelectorSafetyInput): CanvasValidationResult {
  const reasons: string[] = [];
  if (sel.persistId) reasons.push('persistent_selector_not_allowed');
  const valid = reasons.length === 0;
  return { valid, reasons };
}

export interface CanvasForwardExtras { activeWorkspace: string; mode: AgentMode; activeTabId?: string; canvasState?: Record<string, any> }
export interface CanvasForwardResult { validation: CanvasValidationResult; authority: CanvasAuthorityResult; outcome?: LifecycleOutcome; error?: string }

export function forwardCanvasAction(obj: CanvasObject, action: CanvasAction, requested: PermissionScope, extras: CanvasForwardExtras): CanvasForwardResult {
  const validation = validateCanvasObject(obj);
  if (!validation.valid) return { validation, authority: { allowed: false, reasons: ['invalid_object'] }, error: 'blocked' };
  const authority = checkCanvasAuthority(obj, action, requested);
  if (!authority.allowed) {
    const needsClarify = authority.reasons.includes('invalid_object');
    return { validation, authority, error: needsClarify ? 'clarify' : 'blocked' };
  }
  const trigger = defineTrigger({ source: 'canvas', payload: { objectId: obj.objectId, objectType: obj.objectType, action } });
  const risk = obj.riskLevel === 'high' ? 'high' : actionRisk(action);
  const state: Partial<AssembledContext> = {
    activeWorkspace: extras.activeWorkspace,
    activeMode: extras.mode,
    activeTabId: extras.activeTabId,
    canvasState: extras.canvasState || null,
    permissionScope: requested,
    riskLevel: risk
  };
  const outcome = governDecision(trigger, state);
  return { validation, authority, outcome };
}

export function forwardCanvasBatch(objects: CanvasObject[], action: CanvasAction, requested: PermissionScope, extras: CanvasForwardExtras): Array<CanvasForwardResult> {
  return objects.map(obj => forwardCanvasAction(obj, action, requested, extras));
}

export type ShareScope = 'single' | 'group';
export function forwardCanvasExport(obj: CanvasObject, scope: ShareScope, extras: CanvasForwardExtras): CanvasForwardResult {
  return forwardCanvasAction(obj, scope === 'single' ? 'export' : 'share', 'execute', extras);
}

export interface CanvasControlReport {
  ownerId: string;
  ownerRole?: string;
  permissionScope: PermissionScope;
  reversibility: Reversibility;
  riskLevel: RiskLevel;
}

export function whoControls(obj: CanvasObject): CanvasControlReport {
  return {
    ownerId: obj.ownerId,
    ownerRole: obj.ownerRole,
    permissionScope: obj.permissionScope,
    reversibility: obj.reversibility,
    riskLevel: obj.riskLevel
  };
}

export type SovereigntyState = 'inform' | 'suggest' | 'confirm' | 'execute' | 'block' | 'emergency_stop';
export interface SovereigntyContract {
  state: SovereigntyState;
  visible: boolean;
  interruptible: boolean;
  attributable: boolean;
  requiresApproval: boolean;
  message: string;
  permission: PermissionScope;
  alternatives: string[];
  undoPossible: boolean;
}

export function deriveSovereigntyState(outcome: LifecycleOutcome): SovereigntyState {
  const next = outcome.gate.next;
  if (next === 'allow' && outcome.plan.permitted) return 'execute';
  if (next === 'suggest') return 'suggest';
  if (next === 'confirm') return 'confirm';
  if (next === 'clarify') return 'inform';
  return 'block';
}

export function validateSovereigntyExplanation(outcome: LifecycleOutcome): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const what = outcome.explanation.happened;
  const why = outcome.explanation.why;
  const permission = outcome.explanation.permission;
  const alternatives = outcome.explanation.alternatives || [];
  if (!what) reasons.push('missing_what');
  if (!why) reasons.push('missing_why');
  if (!permission) reasons.push('missing_permission');
  if (!Array.isArray(alternatives)) reasons.push('missing_alternatives');
  const valid = reasons.length === 0;
  return { valid, reasons };
}

export function buildSovereigntyContract(outcome: LifecycleOutcome, attributableUserAction: boolean): SovereigntyContract {
  const state = deriveSovereigntyState(outcome);
  const explanationCheck = validateSovereigntyExplanation(outcome);
  const visible = true;
  const interruptible = true;
  const requiresApproval = state === 'suggest' || state === 'confirm' || outcome.sovereignty.requiresApproval;
  const undoPossible = outcome.model.reversible;
  const message = outcome.explanation.why;
  const permission = outcome.explanation.permission;
  const alternatives = outcome.explanation.alternatives || [];
  if (!explanationCheck.valid) return { state: 'block', visible, interruptible, attributable: false, requiresApproval: false, message: 'invalid_explanation', permission, alternatives, undoPossible: false };
  if (!attributableUserAction && state === 'execute') return { state: 'block', visible, interruptible, attributable: false, requiresApproval: false, message: 'non_attributable', permission, alternatives, undoPossible };
  return { state, visible, interruptible, attributable: attributableUserAction, requiresApproval, message, permission, alternatives, undoPossible };
}

export interface RevocationResult { revoked: boolean; reason?: string }
export function revokePermission(): RevocationResult {
  return { revoked: true, reason: 'user_revocation' };
}

export function emergencyStop(): SovereigntyState {
  return 'emergency_stop';
}

export type CapabilityCategory = 'search' | 'create' | 'analyze' | 'simulate' | 'manage' | 'assist' | 'monitor';
export type CapabilityReversibility = 'reversible' | 'irreversible' | 'conditional';
export interface CapabilityContract {
  capabilityId: string;
  capabilityCategory: CapabilityCategory;
  capabilityDescription: string;
  supportedWorkspaces: string[];
  supportedCanvases: string[];
  defaultRiskLevel: RiskLevel;
  reversibility: CapabilityReversibility;
  requiredPermissionScope: PermissionScope;
  explanationTemplate: { what: string; why: string; permission: string; not_do: string };
  governanceNotes: string;
}
export type CapabilityCluster = 'Knowledge & Research' | 'Creative & Media' | 'Business & Operations' | 'Technical & Systems' | 'Public Sector & Compliance';
export interface CapabilityRegistry { capabilities: CapabilityContract[]; clusters: Record<CapabilityCluster, string[]> }

export const CAPABILITY_REGISTRY: CapabilityRegistry = {
  capabilities: [
    {
      capabilityId: 'cap.search.web',
      capabilityCategory: 'search',
      capabilityDescription: 'Search public web content and surface results for review.',
      supportedWorkspaces: ['Research', 'Education', 'Business'],
      supportedCanvases: ['text', 'dataset', 'timeline'],
      defaultRiskLevel: 'low',
      reversibility: 'reversible',
      requiredPermissionScope: 'read',
      explanationTemplate: { what: 'Search web sources', why: 'Discover information', permission: 'read', not_do: 'No auto-browsing or scraping without approval' },
      governanceNotes: 'Respect robots and legal constraints; no automated scraping without consent.'
    },
    {
      capabilityId: 'cap.search.enterprise',
      capabilityCategory: 'search',
      capabilityDescription: 'Search enterprise knowledge bases with scoped access.',
      supportedWorkspaces: ['Business', 'Research'],
      supportedCanvases: ['text', 'dataset'],
      defaultRiskLevel: 'medium',
      reversibility: 'reversible',
      requiredPermissionScope: 'read',
      explanationTemplate: { what: 'Search enterprise sources', why: 'Find internal knowledge', permission: 'read', not_do: 'No privilege escalation or data export' },
      governanceNotes: 'Requires authenticated contexts; compliance with org access controls.'
    },
    {
      capabilityId: 'cap.analyze.document',
      capabilityCategory: 'analyze',
      capabilityDescription: 'Analyze documents for structure, key points, and risks.',
      supportedWorkspaces: ['Research', 'Education', 'Business'],
      supportedCanvases: ['text', 'diagram'],
      defaultRiskLevel: 'medium',
      reversibility: 'reversible',
      requiredPermissionScope: 'suggest',
      explanationTemplate: { what: 'Analyze document content', why: 'Summarize and extract signals', permission: 'suggest', not_do: 'No edits or sharing without approval' },
      governanceNotes: 'Analysis suggestions only; execution requires separate approval.'
    },
    {
      capabilityId: 'cap.monitor.sources',
      capabilityCategory: 'monitor',
      capabilityDescription: 'Monitor selected sources for updates and alerts.',
      supportedWorkspaces: ['Research', 'Business', 'Public'],
      supportedCanvases: ['timeline', 'dataset', 'text'],
      defaultRiskLevel: 'medium',
      reversibility: 'reversible',
      requiredPermissionScope: 'suggest',
      explanationTemplate: { what: 'Monitor sources', why: 'Stay informed on changes', permission: 'suggest', not_do: 'No auto-action on alerts' },
      governanceNotes: 'No background actions; user approval required for follow-ups.'
    },
    {
      capabilityId: 'cap.assist.citation',
      capabilityCategory: 'assist',
      capabilityDescription: 'Assist with citation formatting and source attribution.',
      supportedWorkspaces: ['Education', 'Research'],
      supportedCanvases: ['text'],
      defaultRiskLevel: 'low',
      reversibility: 'reversible',
      requiredPermissionScope: 'suggest',
      explanationTemplate: { what: 'Build citations', why: 'Ensure proper attribution', permission: 'suggest', not_do: 'No submission or publication actions' },
      governanceNotes: 'Align with academic standards; verify sources before use.'
    },
    {
      capabilityId: 'cap.create.image',
      capabilityCategory: 'create',
      capabilityDescription: 'Create images given constraints and user guidance.',
      supportedWorkspaces: ['Media', 'Education'],
      supportedCanvases: ['image'],
      defaultRiskLevel: 'medium',
      reversibility: 'conditional',
      requiredPermissionScope: 'suggest',
      explanationTemplate: { what: 'Generate image drafts', why: 'Support creative workflows', permission: 'suggest', not_do: 'No publishing or export without approval' },
      governanceNotes: 'Respect content policies; avoid sensitive domains without consent.'
    },
    {
      capabilityId: 'cap.create.diagram',
      capabilityCategory: 'create',
      capabilityDescription: 'Create structured diagrams from specifications.',
      supportedWorkspaces: ['Architecture', 'Education', 'Research'],
      supportedCanvases: ['diagram'],
      defaultRiskLevel: 'low',
      reversibility: 'reversible',
      requiredPermissionScope: 'suggest',
      explanationTemplate: { what: 'Draft diagrams', why: 'Visualize structures', permission: 'suggest', not_do: 'No system changes or deployments' },
      governanceNotes: 'Output remains proposals until approved.'
    },
    {
      capabilityId: 'cap.manage.assets',
      capabilityCategory: 'manage',
      capabilityDescription: 'Organize, tag, and version media assets.',
      supportedWorkspaces: ['Media', 'Business'],
      supportedCanvases: ['image', 'text', 'diagram'],
      defaultRiskLevel: 'medium',
      reversibility: 'conditional',
      requiredPermissionScope: 'execute',
      explanationTemplate: { what: 'Manage asset library', why: 'Maintain organization', permission: 'execute', not_do: 'No external sharing without approval' },
      governanceNotes: 'Writes require approval; destructive operations gated with confirmation.'
    },
    {
      capabilityId: 'cap.assist.editing',
      capabilityCategory: 'assist',
      capabilityDescription: 'Assist with editorial suggestions and layout hints.',
      supportedWorkspaces: ['Media', 'Education'],
      supportedCanvases: ['text', 'image'],
      defaultRiskLevel: 'low',
      reversibility: 'reversible',
      requiredPermissionScope: 'suggest',
      explanationTemplate: { what: 'Suggest edits', why: 'Improve clarity', permission: 'suggest', not_do: 'No automatic changes' },
      governanceNotes: 'Suggestions only; changes require explicit consent.'
    },
    {
      capabilityId: 'cap.manage.projects',
      capabilityCategory: 'manage',
      capabilityDescription: 'Create and maintain project structures and metadata.',
      supportedWorkspaces: ['Business', 'Architecture'],
      supportedCanvases: ['timeline', 'text', 'diagram'],
      defaultRiskLevel: 'medium',
      reversibility: 'conditional',
      requiredPermissionScope: 'execute',
      explanationTemplate: { what: 'Manage projects', why: 'Coordinate work', permission: 'execute', not_do: 'No task assignment without approval' },
      governanceNotes: 'Execution steps are user-driven and visible.'
    },
    {
      capabilityId: 'cap.analyze.market',
      capabilityCategory: 'analyze',
      capabilityDescription: 'Analyze market signals and summarize trends.',
      supportedWorkspaces: ['Business'],
      supportedCanvases: ['dataset', 'timeline'],
      defaultRiskLevel: 'medium',
      reversibility: 'reversible',
      requiredPermissionScope: 'suggest',
      explanationTemplate: { what: 'Market analysis', why: 'Inform decisions', permission: 'suggest', not_do: 'No trades or commitments' },
      governanceNotes: 'Not financial advice; execution requires separate approvals.'
    },
    {
      capabilityId: 'cap.simulate.workflow',
      capabilityCategory: 'simulate',
      capabilityDescription: 'Simulate workflows and identify bottlenecks.',
      supportedWorkspaces: ['Business', 'Architecture'],
      supportedCanvases: ['simulation', 'diagram'],
      defaultRiskLevel: 'low',
      reversibility: 'reversible',
      requiredPermissionScope: 'read',
      explanationTemplate: { what: 'Run simulations', why: 'Test process changes', permission: 'read', not_do: 'No real changes applied' },
      governanceNotes: 'Simulation only; actions require governance.'
    },
    {
      capabilityId: 'cap.manage.policies',
      capabilityCategory: 'manage',
      capabilityDescription: 'Propose and track organizational policies.',
      supportedWorkspaces: ['Business', 'Public'],
      supportedCanvases: ['text', 'timeline'],
      defaultRiskLevel: 'high',
      reversibility: 'conditional',
      requiredPermissionScope: 'execute',
      explanationTemplate: { what: 'Policy management', why: 'Ensure compliance', permission: 'execute', not_do: 'No enforcement without explicit approval' },
      governanceNotes: 'High scrutiny; requires explicit confirmations.'
    },
    {
      capabilityId: 'cap.search.code',
      capabilityCategory: 'search',
      capabilityDescription: 'Search code repositories and patterns.',
      supportedWorkspaces: ['Engineering'],
      supportedCanvases: ['code', 'text'],
      defaultRiskLevel: 'low',
      reversibility: 'reversible',
      requiredPermissionScope: 'read',
      explanationTemplate: { what: 'Search code', why: 'Locate references', permission: 'read', not_do: 'No changes or commits' },
      governanceNotes: 'Read-only unless explicitly elevated.'
    },
    {
      capabilityId: 'cap.analyze.logs',
      capabilityCategory: 'analyze',
      capabilityDescription: 'Analyze system logs and detect anomalies.',
      supportedWorkspaces: ['Engineering', 'Security'],
      supportedCanvases: ['dataset', 'text'],
      defaultRiskLevel: 'medium',
      reversibility: 'reversible',
      requiredPermissionScope: 'suggest',
      explanationTemplate: { what: 'Log analysis', why: 'Surface incidents', permission: 'suggest', not_do: 'No remediation without approval' },
      governanceNotes: 'Security-sensitive; follow incident workflows.'
    },
    {
      capabilityId: 'cap.manage.env',
      capabilityCategory: 'manage',
      capabilityDescription: 'Manage environment configurations and settings proposals.',
      supportedWorkspaces: ['Engineering'],
      supportedCanvases: ['text', 'diagram'],
      defaultRiskLevel: 'high',
      reversibility: 'conditional',
      requiredPermissionScope: 'execute',
      explanationTemplate: { what: 'Config management proposals', why: 'Improve reliability', permission: 'execute', not_do: 'No direct writes without approval' },
      governanceNotes: 'Execution requires explicit confirmation and visibility.'
    },
    {
      capabilityId: 'cap.simulate.network',
      capabilityCategory: 'simulate',
      capabilityDescription: 'Simulate network topologies and performance scenarios.',
      supportedWorkspaces: ['Engineering', 'Education'],
      supportedCanvases: ['simulation', 'diagram'],
      defaultRiskLevel: 'low',
      reversibility: 'reversible',
      requiredPermissionScope: 'read',
      explanationTemplate: { what: 'Network simulation', why: 'Validate designs', permission: 'read', not_do: 'No production changes' },
      governanceNotes: 'Educational and design support only.'
    },
    {
      capabilityId: 'cap.monitor.compliance',
      capabilityCategory: 'monitor',
      capabilityDescription: 'Monitor compliance signals and policy adherence.',
      supportedWorkspaces: ['Public', 'Government', 'Business'],
      supportedCanvases: ['dataset', 'timeline'],
      defaultRiskLevel: 'high',
      reversibility: 'reversible',
      requiredPermissionScope: 'suggest',
      explanationTemplate: { what: 'Compliance monitoring', why: 'Detect violations', permission: 'suggest', not_do: 'No enforcement actions' },
      governanceNotes: 'Definition only; enforcement is out of scope and gated.'
    },
    {
      capabilityId: 'cap.manage.records',
      capabilityCategory: 'manage',
      capabilityDescription: 'Propose changes to public or organizational records.',
      supportedWorkspaces: ['Public', 'Government', 'Business'],
      supportedCanvases: ['text', 'timeline'],
      defaultRiskLevel: 'high',
      reversibility: 'conditional',
      requiredPermissionScope: 'execute',
      explanationTemplate: { what: 'Records management proposals', why: 'Maintain accuracy', permission: 'execute', not_do: 'No changes without explicit consent' },
      governanceNotes: 'Requires strict approvals and audit trails.'
    },
    {
      capabilityId: 'cap.analyze.regulatory',
      capabilityCategory: 'analyze',
      capabilityDescription: 'Analyze regulatory texts and map obligations.',
      supportedWorkspaces: ['Government', 'Business', 'Public'],
      supportedCanvases: ['text', 'diagram'],
      defaultRiskLevel: 'medium',
      reversibility: 'reversible',
      requiredPermissionScope: 'suggest',
      explanationTemplate: { what: 'Regulatory analysis', why: 'Understand obligations', permission: 'suggest', not_do: 'No enforcement decisions' },
      governanceNotes: 'Advisory only; consult legal counsel.'
    }
  ],
  clusters: {
    'Knowledge & Research': ['cap.search.web', 'cap.search.enterprise', 'cap.analyze.document', 'cap.monitor.sources', 'cap.assist.citation'],
    'Creative & Media': ['cap.create.image', 'cap.create.diagram', 'cap.manage.assets', 'cap.assist.editing'],
    'Business & Operations': ['cap.manage.projects', 'cap.analyze.market', 'cap.simulate.workflow', 'cap.manage.policies'],
    'Technical & Systems': ['cap.search.code', 'cap.analyze.logs', 'cap.manage.env', 'cap.simulate.network'],
    'Public Sector & Compliance': ['cap.monitor.compliance', 'cap.manage.records', 'cap.analyze.regulatory']
  }
};

export function listCapabilities(): CapabilityContract[] {
  return CAPABILITY_REGISTRY.capabilities;
}

export function getCapabilityById(id: string): CapabilityContract | undefined {
  return CAPABILITY_REGISTRY.capabilities.find(c => c.capabilityId === id);
}

export function listCapabilitiesByCategory(cat: CapabilityCategory): CapabilityContract[] {
  return CAPABILITY_REGISTRY.capabilities.filter(c => c.capabilityCategory === cat);
}

export function listCapabilitiesByCluster(cluster: CapabilityCluster): CapabilityContract[] {
  const ids = CAPABILITY_REGISTRY.clusters[cluster] || [];
  return CAPABILITY_REGISTRY.capabilities.filter(c => ids.includes(c.capabilityId));
}

export function isCapabilitySafeEarlyExposure(c: CapabilityContract): boolean {
  const safeRisk = c.defaultRiskLevel === 'low';
  const safePerm = c.requiredPermissionScope === 'read' || c.requiredPermissionScope === 'suggest';
  const reversible = c.reversibility === 'reversible';
  return safeRisk && safePerm && reversible;
}

export function listSafeCapabilities(): CapabilityContract[] {
  return CAPABILITY_REGISTRY.capabilities.filter(isCapabilitySafeEarlyExposure);
}

export function listGatedCapabilities(): CapabilityContract[] {
  return CAPABILITY_REGISTRY.capabilities.filter(c => !isCapabilitySafeEarlyExposure(c));
}

export type PolicyType = 'content' | 'behavior' | 'monetization' | 'privacy' | 'advertising';
export type PolicyScope = 'global' | 'workspace' | 'capability';
export type EnforcementLevel = 'block' | 'warn' | 'limit' | 'allow';
export interface PolicyTriggers {
  keywords?: string[];
  patterns?: string[];
  capabilityIds?: string[];
  contexts?: string[];
}
export interface PolicyContract {
  policyId: string;
  policyType: PolicyType;
  scope: PolicyScope;
  enforcementLevel: EnforcementLevel;
  triggers: PolicyTriggers;
  auditRequired: boolean;
  userMessage?: string;
  limits?: string[];
  notes?: string;
}
export interface PolicyEvaluationResult {
  outcome: 'allow' | 'allow_with_limits' | 'require_confirmation' | 'block';
  reasons: string[];
  matchedPolicies: string[];
  explanation: string;
  limits?: string[];
}

export const POLICY_REGISTRY: PolicyContract[] = [
  {
    policyId: 'policy.content.pornography',
    policyType: 'content',
    scope: 'global',
    enforcementLevel: 'block',
    triggers: { keywords: ['porn', 'xxx', 'adult', 'explicit', 'nsfw', 'sex', 'sexual', 'xhamster', 'xvideos', 'pornhub', 'camgirl', 'cam boy', 'escort', 'brothel'] },
    auditRequired: true,
    userMessage: 'Sexually explicit content is blocked across all capabilities.',
    notes: 'Blocks sexually explicit content across all capabilities.'
  },
  {
    policyId: 'policy.content.pornography.fetish',
    policyType: 'content',
    scope: 'global',
    enforcementLevel: 'block',
    triggers: { keywords: ['fetish', 'bdsm', 'kink', 'foot fetish', 'discipline', 'dominatrix', 'bondage'] },
    auditRequired: true,
    userMessage: 'Fetish and BDSM content is blocked across all capabilities.',
    notes: 'Blocks fetish-oriented explicit content.'
  },
  {
    policyId: 'policy.content.pornography.adult_services',
    policyType: 'content',
    scope: 'global',
    enforcementLevel: 'block',
    triggers: { keywords: ['escort', 'brothel', 'sex work', 'cam service', 'adult services'] },
    auditRequired: true,
    userMessage: 'Adult services-related content is blocked across all capabilities.',
    notes: 'Blocks adult services including escort and cam services.'
  },
  {
    policyId: 'policy.behavior.gambling',
    policyType: 'behavior',
    scope: 'global',
    enforcementLevel: 'warn',
    triggers: { keywords: ['gamble', 'bet', 'casino', 'wager', 'roulette', 'poker', 'blackjack', 'bookmaker'] },
    auditRequired: true,
    userMessage: 'Gambling references require confirmation and are limited to educational or fictional contexts.',
    notes: 'Requires explicit confirmation for gambling-related intents.'
  },
  {
    policyId: 'policy.behavior.gambling.real_money',
    policyType: 'behavior',
    scope: 'global',
    enforcementLevel: 'block',
    triggers: { keywords: ['real money', 'stake', 'deposit', 'cashout', 'sports betting', 'lottery ticket'] },
    auditRequired: true,
    userMessage: 'Real-money gambling is blocked. Educational or fictional references only.',
    notes: 'Blocks any real-money gambling activity.'
  },
  {
    policyId: 'policy.behavior.gambling.simulation',
    policyType: 'behavior',
    scope: 'global',
    enforcementLevel: 'warn',
    triggers: { keywords: ['simulation', 'simulated gambling', 'virtual casino', 'practice betting'] },
    auditRequired: true,
    userMessage: 'Gambling simulations require explicit confirmation and are restricted to non-monetary contexts.',
    notes: 'Requires explicit confirmation for gambling simulations.'
  },
  {
    policyId: 'policy.behavior.scam_fraud',
    policyType: 'behavior',
    scope: 'global',
    enforcementLevel: 'block',
    triggers: { keywords: ['scam', 'fraud', 'phishing', 'fake'], contexts: ['Public', 'Business'] },
    auditRequired: true,
    notes: 'Blocks fraudulent or deceptive activities.'
  },
  {
    policyId: 'policy.monetization.deceptive',
    policyType: 'monetization',
    scope: 'global',
    enforcementLevel: 'limit',
    triggers: { keywords: ['paywall', 'upsell', 'bait'], contexts: ['Public', 'Business'] },
    auditRequired: true,
    notes: 'Limits deceptive monetization; requires clear disclosure.'
  },
  {
    policyId: 'policy.advertising.safety',
    policyType: 'advertising',
    scope: 'global',
    enforcementLevel: 'limit',
    triggers: { capabilityIds: ['cap.monitor.sources'], contexts: ['Public', 'Business'] },
    auditRequired: false,
    notes: 'Advertising must be labeled, non-tracking, and closeable.'
  },
  {
    policyId: 'policy.privacy.protection',
    policyType: 'privacy',
    scope: 'global',
    enforcementLevel: 'limit',
    triggers: { keywords: ['share data', 'export contacts', 'upload dataset'], contexts: ['Business', 'Public'] },
    auditRequired: true,
    notes: 'Limits data sharing; requires consent and scope confirmation.'
  }
];

POLICY_REGISTRY.push(
  {
    policyId: 'policy.privacy.no_background_collection',
    policyType: 'privacy',
    scope: 'global',
    enforcementLevel: 'block',
    triggers: { keywords: ['background collect', 'background tracking', 'collect in background', 'auto collection', 'silent data collection'] },
    auditRequired: true,
    userMessage: 'Background data collection is blocked by default.',
    notes: 'Blocks any non-user-initiated data collection.'
  },
  {
    policyId: 'policy.privacy.no_cross_session_tracking',
    policyType: 'privacy',
    scope: 'global',
    enforcementLevel: 'block',
    triggers: { keywords: ['cross-session', 'track sessions', 'session tracking', 'remember user across sessions', 'persistent id'] },
    auditRequired: true,
    userMessage: 'Cross-session tracking is blocked.',
    notes: 'Prevents correlating activity across sessions.'
  },
  {
    policyId: 'policy.advertising.no_personalization_default',
    policyType: 'advertising',
    scope: 'global',
    enforcementLevel: 'limit',
    triggers: { keywords: ['personalized ads', 'targeted ads', 'ad personalization', 'interest-based ads'] },
    auditRequired: true,
    userMessage: 'Ad personalization is off by default and requires explicit opt-in.',
    notes: 'Disables personalized targeting unless explicitly enabled.'
  },
  {
    policyId: 'policy.privacy.export_share_consent',
    policyType: 'privacy',
    scope: 'global',
    enforcementLevel: 'warn',
    triggers: { keywords: ['export', 'share', 'upload', 'sync', 'publish'] },
    auditRequired: true,
    userMessage: 'Export/share requires explicit consent with clear scope.',
    notes: 'Gates outbound data actions behind consent.'
  },
  {
    policyId: 'policy.privacy.scope_confirmation',
    policyType: 'privacy',
    scope: 'global',
    enforcementLevel: 'limit',
    triggers: { keywords: ['export', 'share', 'upload', 'sync', 'publish'] },
    auditRequired: true,
    userMessage: 'Sensitive data operations require scope confirmation and explicit consent.',
    notes: 'Requires user-visible scope confirmation.'
  },
  {
    policyId: 'policy.privacy.immediate_revocation',
    policyType: 'privacy',
    scope: 'global',
    enforcementLevel: 'limit',
    triggers: { keywords: ['revoke', 'stop sharing', 'remove access', 'withdraw consent'] },
    auditRequired: true,
    userMessage: 'Users may revoke immediately; actions must stop.',
    notes: 'Ensures immediate revocation ability.'
  },
  {
    policyId: 'policy.privacy.mode.beta',
    policyType: 'privacy',
    scope: 'global',
    enforcementLevel: 'limit',
    triggers: { contexts: ['beta'] },
    auditRequired: true,
    userMessage: 'Beta Privacy Mode: no background collection, no cross-session tracking, ad personalization off, consent required for export/share.',
    notes: 'Beta privacy defaults.'
  },
  {
    policyId: 'policy.privacy.mode.production',
    policyType: 'privacy',
    scope: 'global',
    enforcementLevel: 'limit',
    triggers: { contexts: ['production'] },
    auditRequired: true,
    userMessage: 'Production Privacy Mode: strict defaults with consent gating and audit references.',
    notes: 'Production privacy defaults.'
  }
);

POLICY_REGISTRY.push(
  {
    policyId: 'policy.advertising.no_tracking_ads',
    policyType: 'advertising',
    scope: 'global',
    enforcementLevel: 'limit',
    triggers: { keywords: ['ads', 'advertising', 'sponsored'], contexts: ['Public', 'Business'] },
    auditRequired: true,
    userMessage: 'Advertising is allowed only without tracking and must be contextual.',
    limits: ['no_tracking', 'contextual_only', 'label_advertising', 'closeable', 'opt_out'],
    notes: 'Disallows tracking; requires contextual ads with trust controls.'
  },
  {
    policyId: 'policy.advertising.no_behavior_profiling',
    policyType: 'advertising',
    scope: 'global',
    enforcementLevel: 'limit',
    triggers: { keywords: ['profile', 'behavior profiling', 'user profiling'] },
    auditRequired: true,
    userMessage: 'Behavior profiling for advertising is disallowed.',
    limits: ['no_behavior_profiling'],
    notes: 'Prevents using behavior profiling for ads.'
  },
  {
    policyId: 'policy.advertising.no_third_party_scripts',
    policyType: 'advertising',
    scope: 'global',
    enforcementLevel: 'limit',
    triggers: { keywords: ['third-party scripts', 'tag manager', 'ad script'] },
    auditRequired: true,
    userMessage: 'Third-party ad scripts are not allowed.',
    limits: ['no_third_party_scripts'],
    notes: 'Blocks insertion of third-party ad scripts.'
  },
  {
    policyId: 'policy.advertising.contextual_only',
    policyType: 'advertising',
    scope: 'global',
    enforcementLevel: 'limit',
    triggers: { keywords: ['contextual ads', 'static ads', 'sponsored'], capabilityIds: ['cap.monitor.sources'] },
    auditRequired: true,
    userMessage: 'Only contextual and static ads are allowed with clear labeling.',
    limits: ['contextual_only', 'label_advertising', 'closeable', 'opt_out'],
    notes: 'Permits static/contextual ads only with trust controls.'
  }
);

function textMatches(text: string, list?: string[]): boolean {
  if (!list || list.length === 0) return false;
  const t = (text || '').toLowerCase();
  return list.some(k => t.includes(k.toLowerCase()));
}

function contextMatches(ctx: { workspace?: string; canvasType?: string }, list?: string[]): boolean {
  if (!list || list.length === 0) return false;
  const w = (ctx.workspace || '').toLowerCase();
  const c = (ctx.canvasType || '').toLowerCase();
  return list.some(x => w.includes(x.toLowerCase()) || c.includes(x.toLowerCase()));
}

export function evaluatePolicies(userIntentText: string, capabilityId: string, ctx: { workspace?: string; mode?: string; canvasType?: string }): PolicyEvaluationResult {
  const matched: PolicyContract[] = POLICY_REGISTRY.filter(p => {
    const byKeyword = textMatches(userIntentText, p.triggers.keywords);
    const byCapability = (p.triggers.capabilityIds || []).includes(capabilityId);
    const byContext = contextMatches({ workspace: ctx.workspace, canvasType: ctx.canvasType }, p.triggers.contexts);
    return byKeyword || byCapability || byContext;
  });
  if (matched.length === 0) return { outcome: 'allow', reasons: [], matchedPolicies: [], explanation: 'No policy matched', limits: [] };
  const levels = matched.map(m => m.enforcementLevel);
  const highest = levels.includes('block') ? 'block' : levels.includes('warn') ? 'warn' : levels.includes('limit') ? 'limit' : 'allow';
  const matchedIds = matched.map(m => m.policyId);
  const reasons = matched.map(m => m.notes || m.policyId);
  const primary = (matched.find(m => m.enforcementLevel === 'block') || matched.find(m => m.enforcementLevel === 'warn') || matched.find(m => m.enforcementLevel === 'limit') || matched[0]);
  const explanation = primary?.userMessage || (highest === 'block' ? 'Policy: blocked by content/behavior safety' : highest === 'warn' ? 'Policy: requires explicit confirmation' : highest === 'limit' ? 'Policy: allowed with limits' : 'Policy: allowed');
  const collectedLimits = Array.from(new Set(matched.flatMap(m => m.limits || [])));
  if (highest === 'block') return { outcome: 'block', reasons, matchedPolicies: matchedIds, explanation, limits: [] };
  if (highest === 'warn') return { outcome: 'require_confirmation', reasons, matchedPolicies: matchedIds, explanation, limits: [] };
  if (highest === 'limit') return { outcome: 'allow_with_limits', reasons, matchedPolicies: matchedIds, explanation, limits: (collectedLimits.length ? collectedLimits : ['label_advertising', 'no_tracking', 'scope_confirmation']) };
  return { outcome: 'allow', reasons, matchedPolicies: matchedIds, explanation: 'Policy: allowed', limits: [] };
}

export interface PolicyAwareGovernResult { policy: PolicyEvaluationResult; lifecycle?: LifecycleOutcome }
export function policyAwareGovernDecision(userIntentText: string, capabilityId: string, input: TriggerInput, state: Partial<AssembledContext>): PolicyAwareGovernResult {
  const cap = getCapabilityById(capabilityId);
  const workspace = (state.activeWorkspace || (cap?.supportedWorkspaces?.[0] || '')).toString();
  const policy = evaluatePolicies(userIntentText, capabilityId, { workspace, mode: state.activeMode, canvasType: (state.canvasState as any)?.type });
  if (policy.outcome === 'block') return { policy };
  const adjusted: Partial<AssembledContext> = { ...state };
  if (policy.outcome === 'require_confirmation') {
    adjusted.permissionScope = (state.permissionScope === 'execute') ? 'suggest' : (state.permissionScope || 'suggest');
    adjusted.riskLevel = 'high';
  } else if (policy.outcome === 'allow_with_limits') {
    adjusted.riskLevel = state.riskLevel || 'medium';
  }
  const lifecycle = governDecision(input, adjusted);
  return { policy, lifecycle };
}

export interface PolicyDecision {
  decision: 'allow' | 'allow_with_limits' | 'require_confirmation' | 'block';
  reason: string;
  userMessage: string;
  auditLogRef: string;
}

export function buildPolicyDecision(result: PolicyEvaluationResult): PolicyDecision {
  const reason = (result.reasons[0] || result.explanation || 'policy_evaluated');
  const userMessage = result.explanation;
  const auditLogRef = generateId(16);
  return { decision: result.outcome, reason, userMessage, auditLogRef };
}

export type ConsentStep = 'request' | 'explain_scope' | 'confirm' | 'execute' | 'revoke';
export interface ConsentFlow { steps: ConsentStep[]; requiresScope: boolean; revocable: boolean; audit: boolean }
export const PRIVACY_CONSENT_FLOW: ConsentFlow = { steps: ['request', 'explain_scope', 'confirm', 'execute', 'revoke'], requiresScope: true, revocable: true, audit: true };

export type PrivacyMode = 'beta' | 'production';
export const PRIVACY_MODE_POLICIES: Record<PrivacyMode, string[]> = {
  beta: [
    'policy.privacy.no_background_collection',
    'policy.privacy.no_cross_session_tracking',
    'policy.advertising.no_personalization_default',
    'policy.privacy.export_share_consent',
    'policy.privacy.scope_confirmation',
    'policy.privacy.immediate_revocation',
    'policy.privacy.mode.beta'
  ],
  production: [
    'policy.privacy.no_background_collection',
    'policy.privacy.no_cross_session_tracking',
    'policy.advertising.no_personalization_default',
    'policy.privacy.export_share_consent',
    'policy.privacy.scope_confirmation',
    'policy.privacy.immediate_revocation',
    'policy.privacy.mode.production'
  ]
};

export function listPrivacyPoliciesForMode(mode: PrivacyMode): PolicyContract[] {
  const ids = PRIVACY_MODE_POLICIES[mode] || [];
  return POLICY_REGISTRY.filter(p => ids.includes(p.policyId));
}

export type AdType = 'static' | 'contextual' | 'sponsored_capability_hint';
export interface AdRequest { type: AdType; headline?: string; body?: string }
export function evaluateAdPolicies(req: AdRequest, ctx: { workspace?: string; mode?: string; canvasType?: string }): PolicyEvaluationResult {
  const text = [(req.type || ''), (req.headline || ''), (req.body || '')].join(' ').toLowerCase();
  return evaluatePolicies(text, 'cap.monitor.sources', { workspace: ctx.workspace, mode: ctx.mode, canvasType: ctx.canvasType });
}

export interface MonetizationArchitecture { allowedTypes: string[]; constraints: string[]; trust: string[] }
export const MONETIZATION_ARCHITECTURE: MonetizationArchitecture = {
  allowedTypes: ['static', 'contextual', 'sponsored_capability_hint'],
  constraints: ['no_tracking', 'no_behavior_profiling', 'no_third_party_scripts', 'contextual_only'],
  trust: ['label_advertising', 'closeable', 'opt_out']
};

export interface BetaRevenueStrategy { maxAdsPerHour: number; maxHintsPerSession: number; sponsorshipsPerWorkspace: number; allowedTypes: string[] }
export const BETA_REVENUE_STRATEGY: BetaRevenueStrategy = {
  maxAdsPerHour: 2,
  maxHintsPerSession: 3,
  sponsorshipsPerWorkspace: 1,
  allowedTypes: ['static', 'contextual', 'sponsored_capability_hint']
};
