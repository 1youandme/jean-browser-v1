import { 
  BusinessVenture, 
  VentureIdea, 
  FeasibilityReport, 
  ProjectRoadmap, 
  CoFounderTask, 
  VentureStatus 
} from './types';

/**
 * The AI Co-Founder Service.
 * Acts as the orchestrator for building a business, but NEVER executes without permission.
 */
export class CoFounderService {
  private ventures: Map<string, BusinessVenture> = new Map();

  /**
   * 1. INTAKE: Create a new venture from conversation
   */
  createVenture(ownerId: string, idea: VentureIdea): BusinessVenture {
    const venture: BusinessVenture = {
      id: `venture-${Date.now()}`,
      ownerId,
      details: idea,
      status: 'ideation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.ventures.set(venture.id, venture);
    return venture;
  }

  /**
   * 2. ANALYST: Run Feasibility Study (Automated)
   */
  async runFeasibilityStudy(ventureId: string): Promise<FeasibilityReport> {
    const venture = this.ventures.get(ventureId);
    if (!venture) throw new Error('Venture not found');

    // Simulate AI Analysis
    const report: FeasibilityReport = {
      score: 85,
      analysisDate: new Date().toISOString(),
      marketSizeEstimate: '$50M Total Addressable Market',
      competitors: ['Incumbent Corp', 'Startup X'],
      risks: [
        { severity: 'medium', description: 'High customer acquisition cost', mitigation: 'Focus on organic content' },
        { severity: 'low', description: 'Technical complexity', mitigation: 'Use off-the-shelf components' }
      ],
      recommendation: 'proceed',
      governanceNotes: 'No significant regulatory blockers found.'
    };

    venture.feasibilityReport = report;
    venture.status = 'feasibility_analysis';
    this.ventures.set(venture.id, venture);
    
    return report;
  }

  /**
   * 3. PLANNER: Decompose into Roadmap (Task Decomposition)
   */
  async generateRoadmap(ventureId: string): Promise<ProjectRoadmap> {
    const venture = this.ventures.get(ventureId);
    if (!venture) throw new Error('Venture not found');

    if (venture.status === 'ideation') {
      throw new Error('Run feasibility study first');
    }

    const roadmap: ProjectRoadmap = {
      phases: [
        {
          name: 'Phase 1: Validation',
          tasks: [
            this.createTask(ventureId, 'Market Research', 'Deep dive into competitor pricing', 'research', false),
            this.createTask(ventureId, 'Landing Page Copy', 'Draft value proposition', 'planning', false),
          ]
        },
        {
          name: 'Phase 2: Setup',
          tasks: [
            this.createTask(ventureId, 'Register Domain', 'Buy domain name', 'financial', true), // REQUIRES APPROVAL
            this.createTask(ventureId, 'Email Beta List', 'Send announcement', 'communication', true) // REQUIRES APPROVAL
          ]
        }
      ]
    };

    venture.roadmap = roadmap;
    venture.status = 'planning';
    this.ventures.set(venture.id, venture);
    
    return roadmap;
  }

  /**
   * 4. GOVERNANCE: Approve a Task for Execution
   */
  approveTask(ventureId: string, taskId: string, userId: string): CoFounderTask {
    const venture = this.ventures.get(ventureId);
    if (!venture) throw new Error('Venture not found');
    if (venture.ownerId !== userId) throw new Error('Unauthorized');

    let foundTask: CoFounderTask | undefined;
    
    // Find task in roadmap
    venture.roadmap?.phases.forEach(phase => {
      const t = phase.tasks.find(t => t.id === taskId);
      if (t) foundTask = t;
    });

    if (!foundTask) throw new Error('Task not found');

    if (foundTask.approvalStatus !== 'draft' && foundTask.approvalStatus !== 'pending_approval') {
        throw new Error('Task already processed');
    }

    foundTask.approvalStatus = 'approved';
    foundTask.approvedBy = userId;
    foundTask.approvedAt = new Date().toISOString();
    
    // In a real system, this would trigger the Agent Runtime to execute
    this.simulateExecution(foundTask);

    return foundTask;
  }

  /**
   * 5. PROJECT MANAGER: Track Status
   */
  getVentureStatus(ventureId: string): BusinessVenture {
     const venture = this.ventures.get(ventureId);
     if (!venture) throw new Error('Venture not found');
     return venture;
  }

  private createTask(vid: string, title: string, desc: string, type: any, requiresApproval: boolean): CoFounderTask {
    return {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      ventureId: vid,
      title,
      description: desc,
      type,
      requiresApproval,
      approvalStatus: requiresApproval ? 'pending_approval' : 'in_progress', // Safe tasks auto-start
      assignedAgent: type === 'research' ? 'Jean Analyst' : 'Jean Admin',
      governanceTags: requiresApproval ? ['sensitive', 'opt_in'] : []
    };
  }

  private simulateExecution(task: CoFounderTask) {
      console.log(`[AGENT EXECUTION] Starting task: ${task.title}`);
      // Mock async completion
      setTimeout(() => {
          task.approvalStatus = 'completed';
          console.log(`[AGENT EXECUTION] Completed task: ${task.title}`);
      }, 100);
  }
}
