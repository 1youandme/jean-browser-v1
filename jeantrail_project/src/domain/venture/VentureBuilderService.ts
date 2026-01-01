import type { GovernanceTag } from '../../types';

export type VBId = string;

export interface VentureIdeaInput {
  title: string;
  summary: string;
  problemStatement: string;
  targetAudience: string;
  uniqueValueProposition: string;
}

export interface MarketInput {
  segment: string;
  sizeEstimate?: number;
  region?: string;
  competitors?: string[];
  differentiation?: string;
}

export interface CostInput {
  fixedCosts: Array<{ name: string; amount: number }>;
  variableCosts: Array<{ name: string; amountPerUnit: number }>;
  oneTimeCosts?: Array<{ name: string; amount: number }>;
}

export interface RiskInput {
  risks: Array<{ name: string; likelihood: 'low' | 'medium' | 'high'; impact: 'low' | 'medium' | 'high'; mitigation?: string }>;
}

export interface ConstraintsInput {
  budgetLimit?: number;
  timelineMonths?: number;
  legalOrCompliance?: string[];
  teamAvailability?: string;
}

export interface FeasibilityInputs {
  idea: VentureIdeaInput;
  market: MarketInput;
  costs: CostInput;
  risks: RiskInput;
  constraints: ConstraintsInput;
  successCriteria?: string[];
  assumptions?: string[];
}

export interface FeasibilityFinding {
  id: VBId;
  category: 'market' | 'cost' | 'risk' | 'operations';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  evidence?: string;
}

export interface FeasibilityReport {
  id: VBId;
  createdAt: string;
  nonBinding: true;
  summary: string;
  findings: FeasibilityFinding[];
  score?: number; // 0-100 indicative only
  governance: {
    tags: GovernanceTag[];
    notes: string;
  };
}

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

export interface VentureTask {
  id: VBId;
  title: string;
  description?: string;
  status: TaskStatus;
  dependencies?: VBId[];
  userOnly: true; // governance: execution is manual by user
  governance: {
    tags: GovernanceTag[];
    notes?: string;
  };
}

export interface ConversationEntry {
  id: VBId;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface VentureProject {
  id: VBId;
  name: string;
  createdAt: string;
  updatedAt: string;
  inputs?: FeasibilityInputs;
  conversation: ConversationEntry[];
  tasks: VentureTask[];
  reports: FeasibilityReport[];
  governance: {
    tags: GovernanceTag[];
    constraints: Array<'local_only' | 'no_cloud_sync' | 'no_payments' | 'no_external_api'>;
  };
  progress: {
    percent: number; // user-maintained
    lastUpdated: string;
  };
}

export interface VentureBuilderService {
  createProject(name: string): VentureProject;
  listProjects(): VentureProject[];
  getProject(id: VBId): VentureProject | null;
  deleteProject(id: VBId): void;

  recordConversation(projectId: VBId, entry: Omit<ConversationEntry, 'id' | 'timestamp'>): ConversationEntry;
  setInputs(projectId: VBId, inputs: FeasibilityInputs): void;

  requiredQuestions(): string[];
  missingRequired(projectId: VBId): string[];

  analyzeFeasibility(projectId: VBId): FeasibilityReport; // non-binding, local-only
  decomposeTasks(projectId: VBId): VentureTask[]; // advisory only
  updateTaskStatus(projectId: VBId, taskId: VBId, status: TaskStatus, note?: string): VentureTask;
  setProgress(projectId: VBId, percent: number): void;
}

const STORAGE_KEY = 'venturebuilder_v1_store';

interface StoreShape {
  projects: VentureProject[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string = 'vb'): VBId {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

class LocalStore {
  load(): StoreShape {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { projects: [] };
      return JSON.parse(raw);
    } catch {
      return { projects: [] };
    }
  }
  save(state: StoreShape) {
    // local-only persistence
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

const store = new LocalStore();

const MUST_ASK: string[] = [
  'What exact problem are you solving and for whom?',
  'What is the smallest viable version of your solution?',
  'What budget and time constraints do you have?',
  'What success metrics will you use to decide to continue or stop?',
  'What assumptions are you making that could be wrong?',
  'What legal/compliance constraints apply in your region/sector?',
  'What alternative options exist if this approach fails?',
];

export class VentureBuilder implements VentureBuilderService {
  createProject(name: string): VentureProject {
    const s = store.load();
    const project: VentureProject = {
      id: newId('project'),
      name,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      conversation: [],
      tasks: [],
      reports: [],
      governance: {
        tags: ['local', 'review_only', 'no_execution'],
        constraints: ['local_only', 'no_cloud_sync', 'no_payments', 'no_external_api'],
      },
      progress: {
        percent: 0,
        lastUpdated: nowIso(),
      },
    };
    s.projects.push(project);
    store.save(s);
    return project;
  }

  listProjects(): VentureProject[] {
    return store.load().projects;
  }

  getProject(id: VBId): VentureProject | null {
    const s = store.load();
    return s.projects.find(p => p.id === id) || null;
  }

  deleteProject(id: VBId): void {
    const s = store.load();
    s.projects = s.projects.filter(p => p.id !== id);
    store.save(s);
  }

  recordConversation(projectId: VBId, entry: Omit<ConversationEntry, 'id' | 'timestamp'>): ConversationEntry {
    const s = store.load();
    const project = s.projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');
    const e: ConversationEntry = { id: newId('msg'), timestamp: nowIso(), ...entry };
    project.conversation.push(e);
    project.updatedAt = nowIso();
    store.save(s);
    return e;
  }

  setInputs(projectId: VBId, inputs: FeasibilityInputs): void {
    const s = store.load();
    const project = s.projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');
    project.inputs = inputs;
    project.updatedAt = nowIso();
    store.save(s);
  }

  requiredQuestions(): string[] {
    return MUST_ASK.slice();
  }

  missingRequired(projectId: VBId): string[] {
    const project = this.getProject(projectId);
    if (!project || !project.inputs) return MUST_ASK.slice();
    const { idea, constraints, successCriteria, assumptions } = project.inputs;
    const answered = new Set<string>();
    if (idea?.problemStatement) answered.add(MUST_ASK[0]);
    if (idea?.summary) answered.add(MUST_ASK[1]);
    if (constraints?.budgetLimit !== undefined && constraints?.timelineMonths !== undefined) answered.add(MUST_ASK[2]);
    if (successCriteria && successCriteria.length > 0) answered.add(MUST_ASK[3]);
    if (assumptions && assumptions.length > 0) answered.add(MUST_ASK[4]);
    if (constraints?.legalOrCompliance && constraints.legalOrCompliance.length > 0) answered.add(MUST_ASK[5]);
    answered.add(MUST_ASK[6]); // always prompt alternatives; cannot be auto-inferred
    return MUST_ASK.filter(q => !answered.has(q));
  }

  analyzeFeasibility(projectId: VBId): FeasibilityReport {
    const s = store.load();
    const project = s.projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');
    const missing = this.missingRequired(projectId);
    if (missing.length > 0) {
      throw new Error(`Missing required questions before analysis: ${missing.join('; ')}`);
    }
    const inputs = project.inputs!;
    const findings: FeasibilityFinding[] = [];
    // Market size signal
    if (!inputs.market.sizeEstimate || inputs.market.sizeEstimate < 1000) {
      findings.push({
        id: newId('finding'),
        category: 'market',
        message: 'Market size is not well-defined or may be too small.',
        severity: 'warning',
        evidence: 'inputs.market.sizeEstimate',
      });
    }
    // Cost vs budget
    const totalFixed = inputs.costs.fixedCosts.reduce((acc, c) => acc + c.amount, 0);
    const totalOneTime = (inputs.costs.oneTimeCosts || []).reduce((acc, c) => acc + c.amount, 0);
    const estInit = totalFixed + totalOneTime;
    if (inputs.constraints.budgetLimit !== undefined && estInit > inputs.constraints.budgetLimit) {
      findings.push({
        id: newId('finding'),
        category: 'cost',
        message: 'Estimated initial costs exceed stated budget limit.',
        severity: 'critical',
        evidence: `budgetLimit=${inputs.constraints.budgetLimit}, estInit=${estInit}`,
      });
    }
    // Risk scan
    inputs.risks.risks.forEach(r => {
      if (r.likelihood === 'high' && r.impact === 'high') {
        findings.push({
          id: newId('finding'),
          category: 'risk',
          message: `High-likelihood, high-impact risk detected: ${r.name}`,
          severity: 'critical',
          evidence: r.mitigation || 'no-mitigation-provided',
        });
      }
    });
    const report: FeasibilityReport = {
      id: newId('report'),
      createdAt: nowIso(),
      nonBinding: true,
      summary: 'Indicative feasibility assessment. No execution or funding actions performed.',
      findings,
      score: Math.max(0, Math.min(100, 100 - findings.filter(f => f.severity !== 'info').length * 15)),
      governance: {
        tags: ['review_only', 'no_execution', 'local'],
        notes: 'Analysis is advisory and local-only. No payments, no external APIs, no automation.',
      },
    };
    project.reports.push(report);
    project.updatedAt = nowIso();
    store.save(s);
    return report;
  }

  decomposeTasks(projectId: VBId): VentureTask[] {
    const s = store.load();
    const project = s.projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');
    const baseTasks: VentureTask[] = [
      {
        id: newId('task'),
        title: 'Define MVP scope',
        description: 'Write down the smallest version that delivers value.',
        status: 'todo',
        userOnly: true,
        governance: { tags: ['review_only', 'no_execution', 'local'] },
      },
      {
        id: newId('task'),
        title: 'Validate with 3 potential users',
        description: 'Conduct short interviews; record notes locally.',
        status: 'todo',
        userOnly: true,
        governance: { tags: ['review_only', 'no_execution', 'local'] },
      },
      {
        id: newId('task'),
        title: 'Budget spreadsheet',
        description: 'Create a local spreadsheet of fixed/variable costs.',
        status: 'todo',
        userOnly: true,
        governance: { tags: ['review_only', 'no_execution', 'local'] },
      },
    ];
    project.tasks.push(...baseTasks);
    project.updatedAt = nowIso();
    store.save(s);
    return baseTasks;
  }

  updateTaskStatus(projectId: VBId, taskId: VBId, status: TaskStatus, note?: string): VentureTask {
    const s = store.load();
    const project = s.projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');
    const task = project.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    task.status = status;
    if (note) {
      task.governance.notes = (task.governance.notes ? task.governance.notes + ' | ' : '') + note;
    }
    project.updatedAt = nowIso();
    store.save(s);
    return task;
  }

  setProgress(projectId: VBId, percent: number): void {
    const s = store.load();
    const project = s.projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');
    project.progress.percent = Math.max(0, Math.min(100, percent));
    project.progress.lastUpdated = nowIso();
    project.updatedAt = nowIso();
    store.save(s);
  }
}

export const ventureBuilderService: VentureBuilderService = new VentureBuilder();

// --- UI Screens Specification (Structure only, no external deps) ---
export interface VentureBuilderUISpec {
  screens: {
    Chat: {
      purpose: 'collect_inputs_conversationally';
      data: {
        conversation: ConversationEntry[];
        requiredQuestions: string[];
        missingQuestions: string[];
      };
      governance: {
        tags: GovernanceTag[];
      };
    };
    ProjectBoard: {
      purpose: 'manual_task_management';
      data: {
        tasks: VentureTask[];
        progressPercent: number;
      };
      governance: {
        tags: GovernanceTag[];
      };
    };
    FeasibilitySummary: {
      purpose: 'non_binding_analysis_summary';
      data: {
        latestReport?: FeasibilityReport;
        inputs?: FeasibilityInputs;
      };
      governance: {
        tags: GovernanceTag[];
      };
    };
  };
}
