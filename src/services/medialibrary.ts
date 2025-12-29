// Media Library Service Interface and Implementation
export interface MediaFile {
  id: string;
  name: string;
  originalName: string;
  type: MediaType;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  metadata: MediaMetadata;
  tags: string[];
  category?: string;
  albums: string[];
  isFavorite: boolean;
  isPublic: boolean;
  uploadedAt: Date;
  modifiedAt: Date;
  uploadedBy: string;
}

export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'archive';

export interface MediaMetadata {
  title?: string;
  description?: string;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string;
  camera?: string;
  location?: {
    name: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  exif?: Record<string, any>;
  colors?: string[];
}

export interface Album {
  id: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  mediaCount: number;
  totalSize: number;
  duration?: number;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface MediaLibraryStats {
  totalFiles: number;
  totalSize: number;
  filesByType: Record<MediaType, number>;
  sizeByType: Record<MediaType, number>;
  totalDuration: number;
  favoriteCount: number;
  albumCount: number;
  tagsCount: number;
}

export interface SearchFilters {
  type?: MediaType[];
  tags?: string[];
  category?: string;
  uploadedBy?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  sizeRange?: {
    min: number;
    max: number;
  };
  durationRange?: {
    min: number;
    max: number;
  };
  isFavorite?: boolean;
  isPublic?: boolean;
}

export interface MediaLibraryService {
  // File management
  uploadFile: (file: File, metadata?: Partial<MediaMetadata>) => Promise<MediaFile>;
  uploadFiles: (files: File[], metadata?: Partial<MediaMetadata>) => Promise<MediaFile[]>;
  getFiles: (filters?: SearchFilters, page?: number, limit?: number) => Promise<{ files: MediaFile[]; total: number }>;
  getFile: (id: string) => Promise<MediaFile>;
  updateFile: (id: string, updates: Partial<MediaFile>) => Promise<MediaFile>;
  deleteFile: (id: string) => Promise<void>;
  deleteFiles: (ids: string[]) => Promise<void>;
  
  // File operations
  favoriteFile: (id: string) => Promise<void>;
  unfavoriteFile: (id: string) => Promise<void>;
  getFavoriteFiles: () => Promise<MediaFile[]>;
  downloadFile: (id: string) => Promise<Blob>;
  getFileStream: (id: string) => Promise<ReadableStream>;
  
  // Album management
  createAlbum: (name: string, description?: string) => Promise<Album>;
  getAlbums: () => Promise<Album[]>;
  getAlbum: (id: string) => Promise<Album>;
  updateAlbum: (id: string, updates: Partial<Album>) => Promise<Album>;
  deleteAlbum: (id: string) => Promise<void>;
  addFilesToAlbum: (albumId: string, fileIds: string[]) => Promise<void>;
  removeFilesFromAlbum: (albumId: string, fileIds: string[]) => Promise<void>;
  getAlbumFiles: (albumId: string) => Promise<MediaFile[]>;
  
  // Search and filtering
  searchFiles: (query: string, filters?: SearchFilters) => Promise<MediaFile[]>;
  getFilesByTag: (tag: string) => Promise<MediaFile[]>;
  getFilesByType: (type: MediaType) => Promise<MediaFile[]>;
  getRecentFiles: (limit?: number) => Promise<MediaFile[]>;
  
  // Tags management
  getAllTags: () => Promise<string[]>;
  addTag: (tag: string) => Promise<void>;
  removeTag: (tag: string) => Promise<void>;
  renameTag: (oldTag: string, newTag: string) => Promise<void>;
  
  // Sharing and permissions
  shareFile: (id: string, isPublic: boolean) => Promise<string>;
  getShareLink: (id: string) => Promise<string>;
  revokeShare: (id: string) => Promise<void>;
  
  // Analytics and stats
  getLibraryStats: () => Promise<MediaLibraryStats>;
  getFileStats: (id: string) => Promise<{ views: number; downloads: number; shares: number }>;
  
  // Processing and conversion
  generateThumbnail: (id: string) => Promise<string>;
  convertFile: (id: string, targetFormat: string) => Promise<MediaFile>;
  extractMetadata: (id: string) => Promise<MediaMetadata>;
  
  // Batch operations
  batchUpdateTags: (fileIds: string[], tags: string[]) => Promise<void>;
  batchAddToAlbum: (fileIds: string[], albumId: string) => Promise<void>;
  batchDelete: (fileIds: string[]) => Promise<void>;
  
  // Streaming
  streamVideo: (id: string, quality?: 'low' | 'medium' | 'high') => Promise<ReadableStream>;
  streamAudio: (id: string) => Promise<ReadableStream>;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class MediaLibraryServiceImpl implements MediaLibraryService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async uploadFile(file: File, metadata?: Partial<MediaMetadata>): Promise<MediaFile> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, JSON.stringify(value));
        }
      });
    }

    const response = await fetch(`${this.baseUrl}/api/media/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload file');
    return response.json();
  }

  async uploadFiles(files: File[], metadata?: Partial<MediaMetadata>): Promise<MediaFile[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, JSON.stringify(value));
        }
      });
    }

    const response = await fetch(`${this.baseUrl}/api/media/upload/batch`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload files');
    return response.json();
  }

  async getFiles(filters?: SearchFilters, page?: number, limit?: number): Promise<{ files: MediaFile[]; total: number }> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await fetch(`${this.baseUrl}/api/media/files?${params}`);
    if (!response.ok) throw new Error('Failed to get files');
    return response.json();
  }

  async getFile(id: string): Promise<MediaFile> {
    const response = await fetch(`${this.baseUrl}/api/media/files/${id}`);
    if (!response.ok) throw new Error('Failed to get file');
    return response.json();
  }

  async updateFile(id: string, updates: Partial<MediaFile>): Promise<MediaFile> {
    const response = await fetch(`${this.baseUrl}/api/media/files/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update file');
    return response.json();
  }

  async deleteFile(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/media/files/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete file');
  }

  async deleteFiles(ids: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/media/files/batch-delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) throw new Error('Failed to delete files');
  }

  async favoriteFile(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/media/files/${id}/favorite`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to favorite file');
  }

  async unfavoriteFile(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/media/files/${id}/favorite`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to unfavorite file');
  }

  async getFavoriteFiles(): Promise<MediaFile[]> {
    const response = await fetch(`${this.baseUrl}/api/media/files/favorites`);
    if (!response.ok) throw new Error('Failed to get favorite files');
    return response.json();
  }

  async downloadFile(id: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/media/files/${id}/download`);
    if (!response.ok) throw new Error('Failed to download file');
    return response.blob();
  }

  async getFileStream(id: string): Promise<ReadableStream> {
    const response = await fetch(`${this.baseUrl}/api/media/files/${id}/stream`);
    if (!response.ok) throw new Error('Failed to get file stream');
    return response.body!;
  }

  async createAlbum(name: string, description?: string): Promise<Album> {
    const response = await fetch(`${this.baseUrl}/api/media/albums`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    if (!response.ok) throw new Error('Failed to create album');
    return response.json();
  }

  async getAlbums(): Promise<Album[]> {
    const response = await fetch(`${this.baseUrl}/api/media/albums`);
    if (!response.ok) throw new Error('Failed to get albums');
    return response.json();
  }

  async getAlbum(id: string): Promise<Album> {
    const response = await fetch(`${this.baseUrl}/api/media/albums/${id}`);
    if (!response.ok) throw new Error('Failed to get album');
    return response.json();
  }

  async updateAlbum(id: string, updates: Partial<Album>): Promise<Album> {
    const response = await fetch(`${this.baseUrl}/api/media/albums/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update album');
    return response.json();
  }

  async deleteAlbum(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/media/albums/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete album');
  }

  async addFilesToAlbum(albumId: string, fileIds: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/media/albums/${albumId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds }),
    });
    if (!response.ok) throw new Error('Failed to add files to album');
  }

  async removeFilesFromAlbum(albumId: string, fileIds: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/media/albums/${albumId}/files`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds }),
    });
    if (!response.ok) throw new Error('Failed to remove files from album');
  }

  async getAlbumFiles(albumId: string): Promise<MediaFile[]> {
    const response = await fetch(`${this.baseUrl}/api/media/albums/${albumId}/files`);
    if (!response.ok) throw new Error('Failed to get album files');
    return response.json();
  }

  async searchFiles(query: string, filters?: SearchFilters): Promise<MediaFile[]> {
    const params = new URLSearchParams({ query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await fetch(`${this.baseUrl}/api/media/search?${params}`);
    if (!response.ok) throw new Error('Failed to search files');
    return response.json();
  }

  async getFilesByTag(tag: string): Promise<MediaFile[]> {
    const response = await fetch(`${this.baseUrl}/api/media/files/tag/${encodeURIComponent(tag)}`);
    if (!response.ok) throw new Error('Failed to get files by tag');
    return response.json();
  }

  async getFilesByType(type: MediaType): Promise<MediaFile[]> {
    const response = await fetch(`${this.baseUrl}/api/media/files/type/${type}`);
    if (!response.ok) throw new Error('Failed to get files by type');
    return response.json();
  }

  async getRecentFiles(limit?: number): Promise<MediaFile[]> {
    const url = limit ? `${this.baseUrl}/api/media/files/recent?limit=${limit}` : `${this.baseUrl}/api/media/files/recent`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to get recent files');
    return response.json();
  }

  async getAllTags(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/media/tags`);
    if (!response.ok) throw new Error('Failed to get all tags');
    return response.json();
  }

  async addTag(tag: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/media/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag }),
    });
    if (!response.ok) throw new Error('Failed to add tag');
  }

  async removeTag(tag: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/media/tags/${encodeURIComponent(tag)}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove tag');
  }

  async renameTag(oldTag: string, newTag: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/media/tags/${encodeURIComponent(oldTag)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newTag }),
    });
    if (!response.ok) throw new Error('Failed to rename tag');
  }

  async shareFile(id: string, isPublic: boolean): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/media/files/${id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic }),
    });
    if (!response.ok) throw new Error('Failed to share file');
    const result = await response.json();
    return result.shareUrl;
  }

  async getShareLink(id: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/media/files/${id}/share`);
    if (!response.ok) throw new Error('Failed to get share link');
    const result = await response.json();
    return result.shareUrl;
  }

  async revokeShare(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/media/files/${id}/share`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to revoke share');
  }

  async getLibraryStats(): Promise<MediaLibraryStats> {
    const response = await fetch(`${this.baseUrl}/api/media/stats`);
    if (!response.ok) throw new Error('Failed to get library stats');
    return response.json();
  }

  async getFileStats(id: string): Promise<{ views: number; downloads: number; shares: number }> {
    const response = await fetch(`${this.baseUrl}/api/media/files/${id}/stats`);
    if (!response.ok) throw new Error('Failed to get file stats');
    return response.json();
  }

  async generateThumbnail(id: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/media/files/${id}/thumbnail`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to generate thumbnail');
    const result = await response.json();
    return result.thumbnailUrl;
  }

  async convertFile(id: string, targetFormat: string): Promise<MediaFile> {
    const response = await fetch(`${this.baseUrl}/api/media/files/${id}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetFormat }),
    });
    if (!response.ok) throw new Error('Failed to convert file');
    return response.json();
  }

  async extractMetadata(id: string): Promise<MediaMetadata> {
    const response = await fetch(`${this.baseUrl}/api/media/files/${id}/metadata`);
    if (!response.ok) throw new Error('Failed to extract metadata');
    return response.json();
  }

  async batchUpdateTags(fileIds: string[], tags: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/media/files/batch-update-tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds, tags }),
    });
    if (!response.ok) throw new Error('Failed to batch update tags');
  }

  async batchAddToAlbum(fileIds: string[], albumId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/media/files/batch-add-to-album`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds, albumId }),
    });
    if (!response.ok) throw new Error('Failed to batch add to album');
  }

  async batchDelete(fileIds: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/media/files/batch-delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds }),
    });
    if (!response.ok) throw new Error('Failed to batch delete');
  }

  async streamVideo(id: string, quality?: 'low' | 'medium' | 'high'): Promise<ReadableStream> {
    const params = quality ? `?quality=${quality}` : '';
    const response = await fetch(`${this.baseUrl}/api/media/files/${id}/stream/video${params}`);
    if (!response.ok) throw new Error('Failed to stream video');
    return response.body!;
  }

  async streamAudio(id: string): Promise<ReadableStream> {
    const response = await fetch(`${this.baseUrl}/api/media/files/${id}/stream/audio`);
    if (!response.ok) throw new Error('Failed to stream audio');
    return response.body!;
  }
}

export const mediaLibraryService = new MediaLibraryServiceImpl();
export const useMediaLibraryService = () => mediaLibraryService;