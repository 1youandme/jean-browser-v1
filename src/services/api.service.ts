import { authService } from './auth.service';

interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

class ApiService {
  private readonly baseUrl = '/api';
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Get auth token from store or localStorage
  private getAuthToken(): string | null {
    // Try to get from localStorage first
    const token = localStorage.getItem('auth-token');
    if (token) return token;

    // Try to get from Zustand store (if accessible)
    // This would need to be implemented based on your store setup
    return null;
  }

  // Set up request headers
  private getHeaders(): Record<string, string> {
    const token = this.getAuthToken();
    return {
      ...this.defaultHeaders,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Handle API errors
  private async handleError(response: Response): Promise<ApiError> {
    let error: ApiError;
    
    try {
      const errorData = await response.json();
      error = {
        message: errorData.message || 'An error occurred',
        status: response.status,
        code: errorData.code,
        details: errorData.details,
      };
    } catch {
      error = {
        message: response.statusText || 'An error occurred',
        status: response.status,
      };
    }

    // Handle authentication errors
    if (response.status === 401) {
      const token = this.getAuthToken();
      if (token && authService.isTokenExpired(token)) {
        // Token expired, try to refresh
        try {
          const refreshToken = localStorage.getItem('refresh-token');
          if (refreshToken) {
            const { token: newToken } = await authService.refreshToken(refreshToken);
            localStorage.setItem('auth-token', newToken);
            // Don't throw here, let the calling code retry the request
          }
        } catch {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('auth-token');
          localStorage.removeItem('refresh-token');
          window.location.href = '/login';
        }
      }
    }

    throw error;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        await this.handleError(response);
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw {
          message: error.message,
          status: 0,
        };
      }
      throw error;
    }
  }

  // HTTP methods
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
    
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // File upload
  async upload<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getAuthToken();

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw {
          message: error.message,
          status: 0,
        };
      }
      throw error;
    }
  }

  // File download
  async download(endpoint: string, filename?: string): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getAuthToken();

    try {
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      if (error instanceof Error) {
        throw {
          message: error.message,
          status: 0,
        };
      }
      throw error;
    }
  }

  // Streaming request for AI responses
  async *stream<T>(endpoint: string, data?: any): AsyncGenerator<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getAuthToken();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              yield parsed;
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw {
          message: error.message,
          status: 0,
        };
      }
      throw error;
    }
  }

  // WebSocket connection
  createWebSocket(endpoint: string): WebSocket {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}${this.baseUrl}${endpoint}`;
    const token = this.getAuthToken();
    
    const wsUrl = token ? `${url}?token=${token}` : url;
    return new WebSocket(wsUrl);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.get('/health');
  }

  // Set base URL (useful for different environments)
  setBaseUrl(url: string): void {
    // This would need to be implemented to update the base URL
    // For now, we assume the base URL is always '/api'
  }

  // Set default headers
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  // Clear auth tokens (for logout)
  clearAuth(): void {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('refresh-token');
  }
}

export const apiService = new ApiService();

// Export typed API methods for specific endpoints
export const authAPI = {
  login: (credentials: any) => apiService.post('/auth/login', credentials),
  register: (userData: any) => apiService.post('/auth/register', userData),
  logout: () => apiService.post('/auth/logout'),
  refresh: (refreshToken: string) => apiService.post('/auth/refresh', { refreshToken }),
  me: () => apiService.get('/auth/me'),
};

export const projectsAPI = {
  getAll: () => apiService.get('/projects'),
  getById: (id: string) => apiService.get(`/projects/${id}`),
  create: (data: any) => apiService.post('/projects', data),
  update: (id: string, data: any) => apiService.put(`/projects/${id}`, data),
  delete: (id: string) => apiService.delete(`/projects/${id}`),
};

export const aiAPI = {
  services: () => apiService.get('/ai/services'),
  process: (data: any) => apiService.post('/ai/process', data),
  generateImage: (data: any) => apiService.post('/ai/generate-image', data),
  transcribe: (file: File) => apiService.upload('/ai/transcribe', file),
  synthesize: (data: any) => apiService.post('/ai/synthesize', data),
};

export const dashboardAPI = {
  services: () => apiService.get('/dashboard/services'),
  metrics: () => apiService.get('/dashboard/metrics'),
  tasks: () => apiService.get('/dashboard/tasks'),
  toggleService: (name: string) => apiService.post(`/dashboard/services/${name}/toggle`),
  restartService: (name: string) => apiService.post(`/dashboard/services/${name}/restart`),
  cancelTask: (id: string) => apiService.post(`/dashboard/tasks/${id}/cancel`),
};