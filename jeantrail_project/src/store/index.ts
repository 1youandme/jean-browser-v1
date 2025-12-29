import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User, LoginData, RegisterData, Project, CreateProjectData, AIService, AIRequest, AIResponse, Notification } from '@/types';

// User Authentication Store
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,

        login: async (email: string, password: string) => {
          set({ isLoading: true });
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });
            
            if (response.ok) {
              const { user, token } = await response.json();
              set({ user, token, isAuthenticated: true, isLoading: false });
            } else {
              throw new Error('Login failed');
            }
          } catch (error) {
            set({ isLoading: false });
            throw error;
          }
        },

        logout: () => {
          set({ user: null, token: null, isAuthenticated: false });
        },

        register: async (userData: RegisterData) => {
          set({ isLoading: true });
          try {
            const response = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(userData),
            });
            
            if (response.ok) {
              const { user, token } = await response.json();
              set({ user, token, isAuthenticated: true, isLoading: false });
            } else {
              throw new Error('Registration failed');
            }
          } catch (error) {
            set({ isLoading: false });
            throw error;
          }
        },

        refreshToken: async () => {
          const { token } = get();
          if (!token) return;
          
          try {
            const response = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
            });
            
            if (response.ok) {
              const { token: newToken } = await response.json();
              set({ token: newToken });
            } else {
              get().logout();
            }
          } catch (error) {
            get().logout();
          }
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ 
          user: state.user, 
          token: state.token, 
          isAuthenticated: state.isAuthenticated 
        }),
      }
    ),
    { name: 'auth-store' }
  )
);

// UI State Store
interface UIState {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'ar';
  sidebarOpen: boolean;
  activeTab: string;
  notifications: Notification[];
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setLanguage: (language: 'en' | 'ar') => void;
  setActiveTab: (tab: string) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'dark',
        language: 'en',
        sidebarOpen: true,
        activeTab: 'home',
        notifications: [],

        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setTheme: (theme) => set({ theme }),
        setLanguage: (language) => set({ language }),
        setActiveTab: (activeTab) => set({ activeTab }),
        addNotification: (notification) => 
          set((state) => ({ notifications: [...state.notifications, notification] })),
        removeNotification: (id) => 
          set((state) => ({ 
            notifications: state.notifications.filter(n => n.id !== id) 
          })),
      }),
      {
        name: 'ui-storage',
        partialize: (state) => ({ 
          theme: state.theme, 
          language: state.language,
          sidebarOpen: state.sidebarOpen 
        }),
      }
    ),
    { name: 'ui-store' }
  )
);

// Projects Store
interface ProjectsState {
  projects: Project[];
  activeProject: Project | null;
  isLoading: boolean;
  createProject: (project: CreateProjectData) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setActiveProject: (project: Project | null) => void;
  loadProjects: () => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>()(
  devtools(
    (set, get) => ({
      projects: [],
      activeProject: null,
      isLoading: false,

      createProject: async (projectData: CreateProjectData) => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData),
          });
          
          if (response.ok) {
            const newProject = await response.json();
            set((state) => ({ 
              projects: [...state.projects, newProject],
              isLoading: false 
            }));
          } else {
            throw new Error('Failed to create project');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      updateProject: async (id: string, updates: Partial<Project>) => {
        try {
          const response = await fetch(`/api/projects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          
          if (response.ok) {
            const updatedProject = await response.json();
            set((state) => ({
              projects: state.projects.map(p => p.id === id ? updatedProject : p),
              activeProject: state.activeProject?.id === id ? updatedProject : state.activeProject
            }));
          } else {
            throw new Error('Failed to update project');
          }
        } catch (error) {
          throw error;
        }
      },

      deleteProject: async (id: string) => {
        try {
          const response = await fetch(`/api/projects/${id}`, {
            method: 'DELETE',
          });
          
          if (response.ok) {
            set((state) => ({
              projects: state.projects.filter(p => p.id !== id),
              activeProject: state.activeProject?.id === id ? null : state.activeProject
            }));
          } else {
            throw new Error('Failed to delete project');
          }
        } catch (error) {
          throw error;
        }
      },

      setActiveProject: (project: Project | null) => set({ activeProject: project }),

      loadProjects: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/projects');
          if (response.ok) {
            const projects = await response.json();
            set({ projects, isLoading: false });
          } else {
            throw new Error('Failed to load projects');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
    }),
    { name: 'projects-store' }
  )
);

// AI Services Store
interface AIServicesState {
  services: AIService[];
  activeService: AIService | null;
  isProcessing: boolean;
  lastResponse: AIResponse | null;
  loadServices: () => Promise<void>;
  setActiveService: (service: AIService | null) => void;
  processRequest: (request: AIRequest) => Promise<AIResponse>;
}

export const useAIServicesStore = create<AIServicesState>()(
  devtools(
    (set, get) => ({
      services: [],
      activeService: null,
      isProcessing: false,
      lastResponse: null,

      loadServices: async () => {
        try {
          const response = await fetch('/api/ai/services');
          if (response.ok) {
            const services = await response.json();
            set({ services });
          }
        } catch (error) {
          console.error('Failed to load AI services:', error);
        }
      },

      setActiveService: (service: AIService | null) => set({ activeService: service }),

      processRequest: async (request: AIRequest) => {
        set({ isProcessing: true });
        try {
          const response = await fetch('/api/ai/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
          });
          
          if (response.ok) {
            const result = await response.json();
            set({ lastResponse: result, isProcessing: false });
            return result;
          } else {
            throw new Error('AI request failed');
          }
        } catch (error) {
          set({ isProcessing: false });
          throw error;
        }
      },
    }),
    { name: 'ai-services-store' }
  )
);