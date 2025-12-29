// Job Board Service Interface and Implementation
export interface Job {
  id: string;
  title: string;
  description: string;
  company: {
    id: string;
    name: string;
    logo?: string;
    description: string;
    size: string;
    industry: string;
    location: {
      city: string;
      state: string;
      country: string;
      remote: boolean;
    };
  };
  location: {
    city: string;
    state: string;
    country: string;
    remote: boolean;
  };
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
  experience: 'entry' | 'junior' | 'mid' | 'senior' | 'executive';
  salary: {
    min?: number;
    max?: number;
    currency: string;
    period: 'hourly' | 'monthly' | 'yearly';
  };
  skills: string[];
  benefits: string[];
  requirements: string[];
  postedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  applicationCount: number;
}

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  coverLetter: string;
  resumeUrl?: string;
  status: 'pending' | 'viewed' | 'shortlisted' | 'rejected' | 'accepted';
  appliedAt: Date;
  updatedAt: Date;
}

export interface JobSearchFilters {
  query?: string;
  location?: string;
  type?: string;
  experience?: string;
  salaryMin?: number;
  salaryMax?: number;
  remote?: boolean;
  skills?: string[];
  company?: string;
}

export interface JobBoardService {
  // Job management
  searchJobs: (filters: JobSearchFilters) => Promise<Job[]>;
  getJob: (id: string) => Promise<Job>;
  getFeaturedJobs: () => Promise<Job[]>;
  getRecommendedJobs: () => Promise<Job[]>;
  getJobsByCompany: (companyId: string) => Promise<Job[]>;
  getSavedJobs: () => Promise<Job[]>;
  saveJob: (jobId: string) => Promise<void>;
  unsaveJob: (jobId: string) => Promise<void>;
  
  // Application management
  applyToJob: (jobId: string, coverLetter: string, resumeUrl?: string) => Promise<JobApplication>;
  getApplications: () => Promise<JobApplication[]>;
  getApplication: (id: string) => Promise<JobApplication>;
  withdrawApplication: (applicationId: string) => Promise<void>;
  updateApplication: (applicationId: string, updates: Partial<JobApplication>) => Promise<void>;
  
  // Profile management
  getProfile: () => Promise<JobSeekerProfile>;
  updateProfile: (profile: Partial<JobSeekerProfile>) => Promise<void>;
  uploadResume: (file: File) => Promise<string>;
  
  // Notifications
  getNotifications: () => Promise<JobNotification[]>;
  markNotificationRead: (notificationId: string) => Promise<void>;
}

export interface JobSeekerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title: string;
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  resumeUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  preferredLocations: string[];
  preferredJobTypes: string[];
  salaryExpectation: {
    min?: number;
    max?: number;
    currency: string;
    period: 'hourly' | 'monthly' | 'yearly';
  };
  isAvailable: boolean;
  updatedAt: Date;
}

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  location: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  gpa?: number;
}

export interface JobNotification {
  id: string;
  type: 'application_viewed' | 'application_shortlisted' | 'job_recommended' | 'application_response';
  title: string;
  message: string;
  jobId?: string;
  applicationId?: string;
  isRead: boolean;
  createdAt: Date;
}

class JobBoardServiceImpl implements JobBoardService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async searchJobs(filters: JobSearchFilters): Promise<Job[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      }
    });

    const response = await fetch(`${this.baseUrl}/api/jobs/search?${params}`);
    if (!response.ok) throw new Error('Failed to search jobs');
    return response.json();
  }

  async getJob(id: string): Promise<Job> {
    const response = await fetch(`${this.baseUrl}/api/jobs/${id}`);
    if (!response.ok) throw new Error('Failed to get job');
    return response.json();
  }

  async getFeaturedJobs(): Promise<Job[]> {
    const response = await fetch(`${this.baseUrl}/api/jobs/featured`);
    if (!response.ok) throw new Error('Failed to get featured jobs');
    return response.json();
  }

  async getRecommendedJobs(): Promise<Job[]> {
    const response = await fetch(`${this.baseUrl}/api/jobs/recommended`);
    if (!response.ok) throw new Error('Failed to get recommended jobs');
    return response.json();
  }

  async getJobsByCompany(companyId: string): Promise<Job[]> {
    const response = await fetch(`${this.baseUrl}/api/jobs?company=${companyId}`);
    if (!response.ok) throw new Error('Failed to get jobs by company');
    return response.json();
  }

  async getSavedJobs(): Promise<Job[]> {
    const response = await fetch(`${this.baseUrl}/api/jobs/saved`);
    if (!response.ok) throw new Error('Failed to get saved jobs');
    return response.json();
  }

  async saveJob(jobId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/jobs/${jobId}/save`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to save job');
  }

  async unsaveJob(jobId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/jobs/${jobId}/save`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to unsave job');
  }

  async applyToJob(jobId: string, coverLetter: string, resumeUrl?: string): Promise<JobApplication> {
    const response = await fetch(`${this.baseUrl}/api/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coverLetter, resumeUrl }),
    });
    if (!response.ok) throw new Error('Failed to apply to job');
    return response.json();
  }

  async getApplications(): Promise<JobApplication[]> {
    const response = await fetch(`${this.baseUrl}/api/applications`);
    if (!response.ok) throw new Error('Failed to get applications');
    return response.json();
  }

  async getApplication(id: string): Promise<JobApplication> {
    const response = await fetch(`${this.baseUrl}/api/applications/${id}`);
    if (!response.ok) throw new Error('Failed to get application');
    return response.json();
  }

  async withdrawApplication(applicationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/applications/${applicationId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to withdraw application');
  }

  async updateApplication(applicationId: string, updates: Partial<JobApplication>): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/applications/${applicationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update application');
  }

  async getProfile(): Promise<JobSeekerProfile> {
    const response = await fetch(`${this.baseUrl}/api/profile`);
    if (!response.ok) throw new Error('Failed to get profile');
    return response.json();
  }

  async updateProfile(profile: Partial<JobSeekerProfile>): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!response.ok) throw new Error('Failed to update profile');
  }

  async uploadResume(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await fetch(`${this.baseUrl}/api/profile/resume`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload resume');
    const result = await response.json();
    return result.url;
  }

  async getNotifications(): Promise<JobNotification[]> {
    const response = await fetch(`${this.baseUrl}/api/notifications`);
    if (!response.ok) throw new Error('Failed to get notifications');
    return response.json();
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/notifications/${notificationId}/read`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
  }
}

export const jobBoardService = new JobBoardServiceImpl();
export const useJobBoardService = () => jobBoardService;