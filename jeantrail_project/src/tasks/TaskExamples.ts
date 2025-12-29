import { TaskDefinition } from './TaskTypes';

export const EducationalTasks: TaskDefinition[] = [
  {
    taskId: 'edu_public_preview',
    category: 'educational',
    description: 'Explore a public data preview',
    mode: 'assisted',
    completionCriteria: [{ type: 'preview', target: 'geo_public_data' }],
    rewardPoints: 10,
    explanationText: 'Learn how previews work without executing tools.'
  },
  {
    taskId: 'edu_symbolic_agent',
    category: 'educational',
    description: 'Create a symbolic agent',
    mode: 'symbolic',
    completionCriteria: [{ type: 'view', target: 'agent_builder' }],
    rewardPoints: 15,
    explanationText: 'Understand agent definitions without enabling execution.'
  },
  {
    taskId: 'edu_review_explainability',
    category: 'educational',
    description: 'Review an execution explanation',
    mode: 'symbolic',
    completionCriteria: [{ type: 'explain', target: 'kernel_introspection' }],
    rewardPoints: 10,
    explanationText: 'See how Jean explains decisions without running actions.'
  }
];

export const DiscoveryTasks: TaskDefinition[] = [
  {
    taskId: 'disc_visit_store',
    category: 'discovery',
    description: 'Visit the Capability Store (read-only)',
    mode: 'symbolic',
    completionCriteria: [{ type: 'view', target: 'capability_store' }],
    rewardPoints: 5,
    explanationText: 'Discover capabilities in a safe, read-only mode.'
  },
  {
    taskId: 'disc_preview_geo',
    category: 'discovery',
    description: 'Preview a geo data capability',
    mode: 'assisted',
    completionCriteria: [{ type: 'preview', target: 'geo_public_data' }],
    rewardPoints: 8,
    explanationText: 'Experience a governed preview with no execution.'
  },
  {
    taskId: 'disc_compare_previews',
    category: 'discovery',
    description: 'Compare two preview results',
    mode: 'assisted',
    completionCriteria: [{ type: 'compare', target: 'preview_compare' }],
    rewardPoints: 12,
    explanationText: 'Safely compare outputs without invoking tools.'
  }
];
