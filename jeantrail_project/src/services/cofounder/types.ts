import { GovernanceTag } from '../../types';

/**
 * 1. CONVERSATION & INTAKE MODELS
 */

export interface VentureIdea {
  title: string;
  description: string;
  targetMarket: string;
  geography: string; // "Global", "US-Only", "Local-City"
  budgetCap: {
    amount: number;
    currency: string;
    period: 'one_time' | 'monthly';
  };
}

export interface CoFounderSession {
  id: string;
  userId: string;
  ventureId?: string;
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    intent?: 'provide_idea' | 'refine_budget' | 'approve_task' | 'general_chat';
  }[];
  status: 'active' | 'archived';
}

/**
 * 2. CORE BUSINESS MODELS
 */

export type VentureStatus = 
  | 'ideation' 
  | 'feasibility_analysis' 
  | 'planning' 
  | 'execution' 
  | 'paused' 
  | 'launched';

export interface BusinessVenture {
  id: string;
  ownerId: string;
  details: VentureIdea;
  status: VentureStatus;
  
  // Artifacts
  feasibilityReport?: FeasibilityReport;
  roadmap?: ProjectRoadmap;
  
  createdAt: string;
  updatedAt: string;
}

export interface FeasibilityReport {
  score: number; // 0-100
  analysisDate: string;
  marketSizeEstimate: string;
  competitors: string[];
  risks: {
    severity: 'low' | 'medium' | 'high';
    description: string;
    mitigation: string;
  }[];
  recommendation: 'proceed' | 'pivot' | 'abandon';
  governanceNotes: string; // e.g., "High regulatory risk in selected geography"
}

/**
 * 3. TASK MANAGEMENT & GOVERNANCE
 */

export type TaskType = 
  | 'research'        // Read-only
  | 'planning'        // Read-only
  | 'administrative'  // e.g., filing docs (Requires Action)
  | 'financial'       // e.g., paying fees (Requires Action)
  | 'communication';  // e.g., emailing leads (Requires Action)

export type TaskStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'approved' 
  | 'in_progress' 
  | 'completed' 
  | 'failed';

export interface CoFounderTask {
  id: string;
  ventureId: string;
  title: string;
  description: string;
  type: TaskType;
  
  // Governance
  requiresApproval: boolean;
  approvalStatus: TaskStatus;
  approvedBy?: string; // User ID
  approvedAt?: string;
  
  // Execution
  assignedAgent: 'Jean Analyst' | 'Jean Planner' | 'Jean Admin';
  outputArtifacts?: string[]; // Links to docs, emails, etc.
  
  deadline?: string;
  governanceTags: GovernanceTag[];
}

export interface ProjectRoadmap {
  phases: {
    name: string;
    tasks: CoFounderTask[];
  }[];
}

/**
 * 4. GOVERNANCE CONTROLS
 */
export interface GovernanceGate {
  check(task: CoFounderTask, userRole: string): { allowed: boolean; reason?: string };
}
