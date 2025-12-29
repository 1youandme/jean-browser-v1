// AI Video Studio / Colab Integration Service Interface and Implementation
export interface VideoProject {
  id: string;
  userId: string;
  title: string;
  description?: string;
  storyboard: StoryboardScene[];
  status: VideoProjectStatus;
  jobId?: string;
  jobConfig: Record<string, any>;
  resultUrls: string[];
  progress: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type VideoProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';

export interface StoryboardScene {
  id: string;
  title: string;
  description: string;
  durationSeconds: number;
  prompt: string;
  style?: string;
  referenceImages: string[];
  cameraAngle?: string;
  transition?: string;
  metadata: Record<string, any>;
}

export interface CreateVideoProjectRequest {
  title: string;
  description?: string;
  storyboard: StoryboardScene[];
  jobConfig: Record<string, any>;
}

export interface UpdateVideoProjectRequest {
  title?: string;
  description?: string;
  storyboard?: StoryboardScene[];
  status?: VideoProjectStatus;
}

export interface GenerateVideoRequest {
  projectId: string;
  config?: Record<string, any>;
}

export interface VideoGenerationStatus {
  projectId: string;
  status: VideoProjectStatus;
  progress: number;
  currentStep?: string;
  estimatedRemainingMinutes?: number;
  jobId?: string;
  startedAt?: string;
  updatedAt?: string;
  error?: string;
}

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  scenes: StoryboardScene[];
  totalDuration: number;
  style: string;
}

export interface VideoGenerationQueue {
  activeJobs: number;
  queuedJobs: number;
  completedToday: number;
  averageProcessingTimeMinutes: number;
  estimatedWaitTimeMinutes: number;
  activeJobs: Array<{
    projectId: string;
    title: string;
    progress: number;
    startedAt: string;
    estimatedCompletion: string;
  }>;
}

export interface ListVideoProjectsQuery {
  userId?: string;
  status?: VideoProjectStatus;
  limit?: number;
  offset?: number;
}

export interface VideoStudioService {
  // Project management
  getVideoProjects: (query?: ListVideoProjectsQuery) => Promise<VideoProject[]>;
  getVideoProject: (id: string) => Promise<VideoProject>;
  createVideoProject: (request: CreateVideoProjectRequest) => Promise<VideoProject>;
  updateVideoProject: (id: string, request: UpdateVideoProjectRequest) => Promise<VideoProject>;
  deleteVideoProject: (id: string) => Promise<void>;
  
  // Video generation
  generateVideo: (request: GenerateVideoRequest) => Promise<{
    success: boolean;
    projectId: string;
    jobId: string;
    estimatedDurationMinutes: number;
  }>;
  getVideoGenerationStatus: (projectId: string) => Promise<VideoGenerationStatus>;
  cancelVideoGeneration: (projectId: string) => Promise<{
    success: boolean;
    message: string;
  }>;
  
  // File uploads
  uploadReferenceImage: (projectId: string, files: File[]) => Promise<{
    success: boolean;
    uploadedFiles: string[];
    projectId: string;
  }>;
  
  // Templates
  getVideoTemplates: () => Promise<VideoTemplate[]>;
  createProjectFromTemplate: (
    templateId: string,
    request: { title: string; description?: string }
  ) => Promise<VideoProject>;
  
  // Queue management
  getVideoGenerationQueue: () => Promise<VideoGenerationQueue>;
}

class VideoStudioServiceImpl implements VideoStudioService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async getVideoProjects(query?: ListVideoProjectsQuery): Promise<VideoProject[]> {
    const params = new URLSearchParams();
    if (query?.userId) params.append('user_id', query.userId);
    if (query?.status) params.append('status', query.status);
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());

    const response = await fetch(`${this.baseUrl}/api/video-studio/projects?${params}`);
    if (!response.ok) throw new Error(`Failed to fetch video projects: ${response.statusText}`);
    return response.json();
  }

  async getVideoProject(id: string): Promise<VideoProject> {
    const response = await fetch(`${this.baseUrl}/api/video-studio/projects/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch video project: ${response.statusText}`);
    return response.json();
  }

  async createVideoProject(request: CreateVideoProjectRequest): Promise<VideoProject> {
    const response = await fetch(`${this.baseUrl}/api/video-studio/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to create video project: ${response.statusText}`);
    return response.json();
  }

  async updateVideoProject(id: string, request: UpdateVideoProjectRequest): Promise<VideoProject> {
    const response = await fetch(`${this.baseUrl}/api/video-studio/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to update video project: ${response.statusText}`);
    return response.json();
  }

  async deleteVideoProject(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/video-studio/projects/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Failed to delete video project: ${response.statusText}`);
  }

  async generateVideo(request: GenerateVideoRequest): Promise<{
    success: boolean;
    projectId: string;
    jobId: string;
    estimatedDurationMinutes: number;
  }> {
    const response = await fetch(`${this.baseUrl}/api/video-studio/projects/${request.projectId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to generate video: ${response.statusText}`);
    return response.json();
  }

  async getVideoGenerationStatus(projectId: string): Promise<VideoGenerationStatus> {
    const response = await fetch(`${this.baseUrl}/api/video-studio/projects/${projectId}/status`);
    if (!response.ok) throw new Error(`Failed to get video generation status: ${response.statusText}`);
    return response.json();
  }

  async cancelVideoGeneration(projectId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/video-studio/projects/${projectId}/cancel`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error(`Failed to cancel video generation: ${response.statusText}`);
    return response.json();
  }

  async uploadReferenceImage(projectId: string, files: File[]): Promise<{
    success: boolean;
    uploadedFiles: string[];
    projectId: string;
  }> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`reference_image_${index}`, file);
    });

    const response = await fetch(`${this.baseUrl}/api/video-studio/projects/${projectId}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(`Failed to upload reference images: ${response.statusText}`);
    return response.json();
  }

  async getVideoTemplates(): Promise<VideoTemplate[]> {
    const response = await fetch(`${this.baseUrl}/api/video-studio/projects/templates`);
    if (!response.ok) throw new Error(`Failed to fetch video templates: ${response.statusText}`);
    return response.json();
  }

  async createProjectFromTemplate(
    templateId: string,
    request: { title: string; description?: string }
  ): Promise<VideoProject> {
    const response = await fetch(`${this.baseUrl}/api/video-studio/projects/templates/${templateId}/from-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to create project from template: ${response.statusText}`);
    return response.json();
  }

  async getVideoGenerationQueue(): Promise<VideoGenerationQueue> {
    const response = await fetch(`${this.baseUrl}/api/video-studio/queue`);
    if (!response.ok) throw new Error(`Failed to fetch video generation queue: ${response.statusText}`);
    return response.json();
  }
}

// Singleton instance
export const videoStudioService = new VideoStudioServiceImpl();

// React hook
export const useVideoStudioService = (): VideoStudioService => {
  return videoStudioService;
};

// Helper functions
export function createStoryboardScene(
  title: string,
  description: string,
  prompt: string,
  durationSeconds: number,
  options?: Partial<StoryboardScene>
): StoryboardScene {
  return {
    id: `scene_${Date.now()}`,
    title,
    description,
    durationSeconds,
    prompt,
    style: options?.style || 'photorealistic',
    referenceImages: options?.referenceImages || [],
    cameraAngle: options?.cameraAngle || 'medium_shot',
    transition: options?.transition || 'cut',
    metadata: options?.metadata || {},
  };
}

export function calculateVideoDuration(storyboard: StoryboardScene[]): number {
  return storyboard.reduce((total, scene) => total + scene.durationSeconds, 0);
}

export function estimateGenerationTime(durationSeconds: number, quality: 'low' | 'medium' | 'high' = 'medium'): {
  estimatedMinutes: number;
  costCredits: number;
} {
  const qualityMultipliers = {
    low: { time: 0.5, credits: 1 },
    medium: { time: 1, credits: 2 },
    high: { time: 2, credits: 5 },
  };

  const multiplier = qualityMultipliers[quality];
  const baseTimePerSecond = 0.5; // 30 seconds per minute of video

  return {
    estimatedMinutes: Math.ceil((durationSeconds * baseTimePerSecond * multiplier.time) / 60),
    costCredits: Math.ceil(durationSeconds * multiplier.credits),
  };
}

export function validateStoryboard(storyboard: StoryboardScene[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (storyboard.length === 0) {
    errors.push('Storyboard cannot be empty');
    return { valid: false, errors, warnings };
  }

  storyboard.forEach((scene, index) => {
    if (!scene.title.trim()) {
      errors.push(`Scene ${index + 1}: Title is required`);
    }

    if (!scene.description.trim()) {
      warnings.push(`Scene ${index + 1}: Description is empty`);
    }

    if (!scene.prompt.trim()) {
      errors.push(`Scene ${index + 1}: Prompt is required`);
    }

    if (scene.durationSeconds <= 0) {
      errors.push(`Scene ${index + 1}: Duration must be greater than 0`);
    }

    if (scene.durationSeconds > 60) {
      warnings.push(`Scene ${index + 1}: Duration exceeds 60 seconds, consider splitting`);
    }

    if (scene.prompt.length > 1000) {
      warnings.push(`Scene ${index + 1}: Prompt is very long, may affect generation quality`);
    }
  });

  const totalDuration = calculateVideoDuration(storyboard);
  if (totalDuration > 300) { // 5 minutes
    warnings.push('Total video duration exceeds 5 minutes, generation may take longer');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function optimizeStoryboardForGeneration(storyboard: StoryboardScene[]): StoryboardScene[] {
  return storyboard.map(scene => ({
    ...scene,
    prompt: enhancePrompt(scene.prompt, scene.style),
  }));
}

function enhancePrompt(originalPrompt: string, style?: string): string {
  let enhanced = originalPrompt;

  // Add quality and detail enhancements
  if (!enhanced.includes('high quality')) {
    enhanced += ', high quality, detailed';
  }

  if (!enhanced.includes('cinematic')) {
    enhanced += ', cinematic lighting';
  }

  // Add style-specific enhancements
  if (style) {
    switch (style) {
      case 'photorealistic':
        enhanced += ', photorealistic, 8k resolution';
        break;
      case 'anime':
        enhanced += ', anime style, vibrant colors';
        break;
      case 'documentary':
        enhanced += ', documentary style, natural lighting';
        break;
    }
  }

  return enhanced;
}

// Progress tracking helper
export function pollVideoGenerationStatus(
  projectId: string,
  onUpdate: (status: VideoGenerationStatus) => void,
  intervalMs: number = 3000,
  maxAttempts: number = 120
): Promise<VideoGenerationStatus> {
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const status = await videoStudioService.getVideoGenerationStatus(projectId);
        onUpdate(status);

        if (status.status === 'completed' || status.status === 'failed') {
          resolve(status);
          return;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          reject(new Error('Maximum polling attempts reached'));
          return;
        }

        setTimeout(poll, intervalMs);
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
}

// File validation
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are supported' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Image size must be less than 10MB' };
  }

  return { valid: true };
}