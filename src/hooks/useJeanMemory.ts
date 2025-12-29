import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export interface MemoryFolder {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_folder_id?: string;
  folder_path: string[];
  is_system_folder: boolean;
  sort_order: number;
  memory_count: number;
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  user_id: string;
  folder_id?: string;
  title?: string;
  memory_type: 'note' | 'conversation' | 'file' | 'link' | 'task' | 'preference' | 'context';
  content: Record<string, any>;
  text_content?: string;
  context_tags: string[];
  metadata: Record<string, any>;
  
  // File attachments
  file_path?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  
  // Access control
  is_private: boolean;
  is_encrypted: boolean;
  is_favorite: boolean;
  is_pinned: boolean;
  is_archived: boolean;
  
  // Relationships
  parent_memory_id?: string;
  linked_memory_ids: string[];
  
  // Search and relevance
  relevance_score?: number;
  access_count: number;
  last_accessed?: string;
  
  // Session tracking
  session_id?: string;
  
  created_at: string;
  updated_at: string;
}

export interface MemorySearchRequest {
  user_id: string;
  query?: string;
  folder_id?: string;
  memory_types?: string[];
  tags?: string[];
  is_favorite?: boolean;
  is_pinned?: boolean;
  date_from?: string;
  date_to?: string;
  session_id?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'relevance' | 'created_at' | 'last_accessed' | 'title';
  sort_order?: 'asc' | 'desc';
}

export interface MemoryCreateRequest {
  user_id: string;
  folder_id?: string;
  title?: string;
  memory_type: string;
  content: Record<string, any>;
  context_tags: string[];
  metadata?: Record<string, any>;
  file_path?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  is_private?: boolean;
  is_encrypted?: boolean;
  session_id?: string;
  parent_memory_id?: string;
}

export interface MemoryUpdateRequest {
  id: string;
  user_id: string;
  folder_id?: string;
  title?: string;
  content?: Record<string, any>;
  context_tags?: string[];
  metadata?: Record<string, any>;
  is_private?: boolean;
  is_encrypted?: boolean;
  is_favorite?: boolean;
  is_pinned?: boolean;
  is_archived?: boolean;
}

export interface MemoryLink {
  id: string;
  user_id: string;
  source_memory_id: string;
  target_memory_id: string;
  link_type: string;
  strength: number;
  bidirectional: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MemoryTag {
  id: string;
  user_id: string;
  name: string;
  color?: string;
  usage_count: number;
  created_at: string;
}

export interface JeanMemoryState {
  folders: MemoryFolder[];
  memories: Memory[];
  currentFolder: MemoryFolder | null;
  selectedMemories: string[];
  searchResults: Memory[];
  isLoading: boolean;
  error?: string;
  
  // UI state
  viewMode: 'grid' | 'list';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filterTags: string[];
  filterTypes: string[];
  
  // Search state
  searchQuery: string;
  isSearching: boolean;
  
  // Editing state
  editingMemory: Memory | null;
  isCreatingFolder: boolean;
  creatingNewMemory: boolean;
}

export interface JeanMemoryActions {
  // Folder operations
  loadFolders: () => Promise<void>;
  createFolder: (name: string, description?: string, parentId?: string, color?: string, icon?: string) => Promise<MemoryFolder>;
  updateFolder: (id: string, updates: Partial<MemoryFolder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  setCurrentFolder: (folder: MemoryFolder | null) => void;
  
  // Memory operations
  loadMemories: (folderId?: string, options?: MemorySearchRequest) => Promise<void>;
  createMemory: (memory: MemoryCreateRequest) => Promise<Memory>;
  updateMemory: (memory: MemoryUpdateRequest) => Promise<Memory>;
  deleteMemory: (id: string) => Promise<void>;
  duplicateMemory: (id: string) => Promise<Memory>;
  archiveMemory: (id: string) => Promise<void>;
  unarchiveMemory: (id: string) => Promise<void>;
  
  // Search operations
  searchMemories: (request: MemorySearchRequest) => Promise<Memory[]>;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  
  // Selection operations
  selectMemory: (id: string) => void;
  selectMultipleMemories: (ids: string[]) => void;
  clearSelection: () => void;
  selectAllMemories: () => void;
  
  // Linking operations
  linkMemories: (sourceId: string, targetId: string, linkType?: string, strength?: number) => Promise<MemoryLink>;
  unlinkMemories: (sourceId: string, targetId: string) => Promise<void>;
  getRelatedMemories: (memoryId: string) => Promise<Memory[]>;
  
  // Tag operations
  getTags: () => Promise<MemoryTag[]>;
  addTag: (name: string, color?: string) => Promise<MemoryTag>;
  removeTag: (name: string) => Promise<void>;
  
  // Bulk operations
  bulkMoveMemories: (memoryIds: string[], targetFolderId: string) => Promise<void>;
  bulkTagMemories: (memoryIds: string[], tags: string[]) => Promise<void>;
  bulkDeleteMemories: (memoryIds: string[]) => Promise<void>;
  
  // UI operations
  setViewMode: (mode: 'grid' | 'list') => void;
  setSorting: (sortBy: string, order: 'asc' | 'desc') => void;
  setFilterTags: (tags: string[]) => void;
  setFilterTypes: (types: string[]) => void;
  
  // Editing operations
  startEditingMemory: (memory: Memory) => void;
  stopEditingMemory: () => void;
  startCreatingFolder: () => void;
  stopCreatingFolder: () => void;
  startCreatingMemory: (folderId?: string) => void;
  stopCreatingMemory: () => void;
  
  // Analytics
  getMemoryStats: () => Promise<Record<string, any>>;
  getUsageAnalytics: (daysBack?: number) => Promise<Record<string, any>>;
  
  // Import/Export
  exportMemories: (memoryIds?: string[]) => Promise<string>;
  importMemories: (data: any) => Promise<void>;
}

export const useJeanMemory = (userId?: string): { state: JeanMemoryState; actions: JeanMemoryActions } => {
  const [state, setState] = useState<JeanMemoryState>({
    folders: [],
    memories: [],
    currentFolder: null,
    selectedMemories: [],
    searchResults: [],
    isLoading: false,
    error: undefined,
    
    // UI state
    viewMode: 'grid',
    sortBy: 'created_at',
    sortOrder: 'desc',
    filterTags: [],
    filterTypes: [],
    
    // Search state
    searchQuery: '',
    isSearching: false,
    
    // Editing state
    editingMemory: null,
    isCreatingFolder: false,
    creatingNewMemory: false,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error?: string) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // Folder operations
  const loadFolders = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError();
    
    try {
      const folders = await invoke<MemoryFolder[]>('jean_memory_get_folders', { userId });
      setState(prev => ({ ...prev, folders }));
    } catch (error) {
      setError(`Failed to load folders: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [userId, setLoading, setError]);

  const createFolder = useCallback(async (
    name: string,
    description?: string,
    parentId?: string,
    color?: string,
    icon?: string
  ): Promise<MemoryFolder> => {
    if (!userId) throw new Error('User ID required');
    
    setLoading(true);
    
    try {
      const folder = await invoke<MemoryFolder>('jean_memory_create_folder', {
        userId,
        name,
        description,
        parentId,
        color,
        icon,
      });
      
      setState(prev => ({
        ...prev,
        folders: [...prev.folders, folder],
      }));
      
      return folder;
    } catch (error) {
      setError(`Failed to create folder: ${error}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userId, setLoading, setError]);

  const updateFolder = useCallback(async (id: string, updates: Partial<MemoryFolder>) => {
    setLoading(true);
    
    try {
      await invoke('jean_memory_update_folder', { id, updates });
      
      setState(prev => ({
        ...prev,
        folders: prev.folders.map(folder => 
          folder.id === id ? { ...folder, ...updates, updated_at: new Date().toISOString() } : folder
        ),
      }));
    } catch (error) {
      setError(`Failed to update folder: ${error}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const deleteFolder = useCallback(async (id: string) => {
    setLoading(true);
    
    try {
      await invoke('jean_memory_delete_folder', { id });
      
      setState(prev => ({
        ...prev,
        folders: prev.folders.filter(folder => folder.id !== id),
        currentFolder: prev.currentFolder?.id === id ? null : prev.currentFolder,
      }));
    } catch (error) {
      setError(`Failed to delete folder: ${error}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const setCurrentFolder = useCallback((folder: MemoryFolder | null) => {
    setState(prev => ({
      ...prev,
      currentFolder: folder,
      selectedMemories: [],
    }));
  }, []);

  // Memory operations
  const loadMemories = useCallback(async (folderId?: string, options?: MemorySearchRequest) => {
    if (!userId) return;
    
    setLoading(true);
    setError();
    
    try {
      const request: MemorySearchRequest = {
        user_id: userId,
        folder_id: folderId || state.currentFolder?.id,
        ...options,
      };
      
      const memories = await invoke<Memory[]>('jean_memory_search_memories', { request });
      
      setState(prev => ({
        ...prev,
        memories,
        searchResults: options?.query ? memories : [],
        isSearching: !!options?.query,
      }));
    } catch (error) {
      setError(`Failed to load memories: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [userId, state.currentFolder?.id, setLoading, setError]);

  const createMemory = useCallback(async (memory: MemoryCreateRequest): Promise<Memory> => {
    setLoading(true);
    
    try {
      const createdMemory = await invoke<Memory>('jean_memory_create_memory', { memory });
      
      setState(prev => ({
        ...prev,
        memories: [createdMemory, ...prev.memories],
      }));
      
      // Update folder memory count
      if (memory.folder_id) {
        setState(prev => ({
          ...prev,
          folders: prev.folders.map(folder =>
            folder.id === memory.folder_id
              ? { ...folder, memory_count: folder.memory_count + 1 }
              : folder
          ),
        }));
      }
      
      return createdMemory;
    } catch (error) {
      setError(`Failed to create memory: ${error}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const updateMemory = useCallback(async (memory: MemoryUpdateRequest): Promise<Memory> => {
    setLoading(true);
    
    try {
      const updatedMemory = await invoke<Memory>('jean_memory_update_memory', { memory });
      
      setState(prev => ({
        ...prev,
        memories: prev.memories.map(m => 
          m.id === memory.id ? updatedMemory : m
        ),
        editingMemory: prev.editingMemory?.id === memory.id ? null : prev.editingMemory,
      }));
      
      return updatedMemory;
    } catch (error) {
      setError(`Failed to update memory: ${error}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const deleteMemory = useCallback(async (id: string) => {
    setLoading(true);
    
    try {
      await invoke('jean_memory_delete_memory', { id });
      
      setState(prev => {
        const deletedMemory = prev.memories.find(m => m.id === id);
        return {
          ...prev,
          memories: prev.memories.filter(m => m.id !== id),
          selectedMemories: prev.selectedMemories.filter(selectedId => selectedId !== id),
          // Update folder memory count
          folders: deletedMemory?.folder_id
            ? prev.folders.map(folder =>
                folder.id === deletedMemory.folder_id
                  ? { ...folder, memory_count: Math.max(0, folder.memory_count - 1) }
                  : folder
              )
            : prev.folders,
        };
      });
    } catch (error) {
      setError(`Failed to delete memory: ${error}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const duplicateMemory = useCallback(async (id: string): Promise<Memory> => {
    const originalMemory = state.memories.find(m => m.id === id);
    if (!originalMemory) throw new Error('Memory not found');
    
    const duplicatedMemory: MemoryCreateRequest = {
      user_id: originalMemory.user_id,
      folder_id: originalMemory.folder_id,
      title: `${originalMemory.title || 'Untitled'} (Copy)`,
      memory_type: originalMemory.memory_type,
      content: originalMemory.content,
      context_tags: originalMemory.context_tags,
      metadata: {
        ...originalMemory.metadata,
        duplicated_from: originalMemory.id,
        duplicated_at: new Date().toISOString(),
      },
      is_private: originalMemory.is_private,
      is_encrypted: originalMemory.is_encrypted,
    };
    
    return createMemory(duplicatedMemory);
  }, [state.memories, createMemory]);

  const archiveMemory = useCallback(async (id: string) => {
    await updateMemory({ id, user_id: userId!, is_archived: true });
  }, [updateMemory, userId]);

  const unarchiveMemory = useCallback(async (id: string) => {
    await updateMemory({ id, user_id: userId!, is_archived: false });
  }, [updateMemory, userId]);

  // Search operations
  const searchMemories = useCallback(async (request: MemorySearchRequest): Promise<Memory[]> => {
    if (!userId) return [];
    
    setLoading(true);
    setError();
    
    try {
      const results = await invoke<Memory[]>('jean_memory_search_memories', { request });
      
      setState(prev => ({
        ...prev,
        searchResults: results,
        isSearching: true,
        searchQuery: request.query || '',
      }));
      
      return results;
    } catch (error) {
      setError(`Search failed: ${error}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId, setLoading, setError]);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      isSearching: !!query,
    }));
    
    // Trigger search with debounce
    if (query) {
      const timeoutId = setTimeout(() => {
        searchMemories({
          user_id: userId!,
          query,
          folder_id: state.currentFolder?.id,
          sort_by: state.sortBy as any,
          sort_order: state.sortOrder,
        });
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      loadMemories(state.currentFolder?.id);
    }
  }, [userId, state.currentFolder?.id, state.sortBy, state.sortOrder, searchMemories, loadMemories]);

  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchQuery: '',
      searchResults: [],
      isSearching: false,
    }));
    
    loadMemories(state.currentFolder?.id);
  }, [loadMemories, state.currentFolder?.id]);

  // Selection operations
  const selectMemory = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      selectedMemories: prev.selectedMemories.includes(id)
        ? prev.selectedMemories.filter(selectedId => selectedId !== id)
        : [...prev.selectedMemories, id],
    }));
  }, []);

  const selectMultipleMemories = useCallback((ids: string[]) => {
    setState(prev => ({
      ...prev,
      selectedMemories: ids,
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedMemories: [],
    }));
  }, []);

  const selectAllMemories = useCallback(() => {
    const currentMemories = state.searchQuery ? state.searchResults : state.memories;
    setState(prev => ({
      ...prev,
      selectedMemories: currentMemories.map(m => m.id),
    }));
  }, [state.searchQuery, state.searchResults, state.memories]);

  // Linking operations
  const linkMemories = useCallback(async (
    sourceId: string,
    targetId: string,
    linkType: string = 'related',
    strength: number = 0.5
  ): Promise<MemoryLink> => {
    if (!userId) throw new Error('User ID required');
    
    try {
      const link = await invoke<MemoryLink>('jean_memory_link_memories', {
        userId,
        sourceMemoryId: sourceId,
        targetMemoryId: targetId,
        linkType,
        strength,
      });
      
      return link;
    } catch (error) {
      setError(`Failed to link memories: ${error}`);
      throw error;
    }
  }, [userId, setError]);

  const unlinkMemories = useCallback(async (sourceId: string, targetId: string) => {
    try {
      await invoke('jean_memory_unlink_memories', { sourceId, targetId });
    } catch (error) {
      setError(`Failed to unlink memories: ${error}`);
      throw error;
    }
  }, [setError]);

  const getRelatedMemories = useCallback(async (memoryId: string): Promise<Memory[]> => {
    if (!userId) return [];
    
    try {
      const memories = await invoke<Memory[]>('jean_memory_get_related_memories', {
        userId,
        memoryId,
      });
      
      return memories;
    } catch (error) {
      setError(`Failed to get related memories: ${error}`);
      return [];
    }
  }, [userId, setError]);

  // Tag operations
  const getTags = useCallback(async (): Promise<MemoryTag[]> => {
    if (!userId) return [];
    
    try {
      const tags = await invoke<MemoryTag[]>('jean_memory_get_tags', { userId });
      return tags;
    } catch (error) {
      setError(`Failed to get tags: ${error}`);
      return [];
    }
  }, [userId, setError]);

  const addTag = useCallback(async (name: string, color?: string): Promise<MemoryTag> => {
    if (!userId) throw new Error('User ID required');
    
    try {
      const tag = await invoke<MemoryTag>('jean_memory_get_or_create_tag', {
        userId,
        name,
        color,
      });
      
      return tag;
    } catch (error) {
      setError(`Failed to add tag: ${error}`);
      throw error;
    }
  }, [userId, setError]);

  const removeTag = useCallback(async (name: string) => {
    if (!userId) return;
    
    try {
      await invoke('jean_memory_delete_tag', { userId, name });
    } catch (error) {
      setError(`Failed to remove tag: ${error}`);
      throw error;
    }
  }, [userId, setError]);

  // Bulk operations
  const bulkMoveMemories = useCallback(async (memoryIds: string[], targetFolderId: string) => {
    setLoading(true);
    
    try {
      await invoke('jean_memory_bulk_update', {
        userId,
        memoryIds,
        updates: { folder_id: targetFolderId },
      });
      
      // Update local state
      setState(prev => {
        const updatedMemories = prev.memories.map(memory =>
          memoryIds.includes(memory.id) ? { ...memory, folder_id: targetFolderId } : memory
        );
        
        return {
          ...prev,
          memories: updatedMemories,
          selectedMemories: [],
        };
      });
      
      // Reload folders to update counts
      await loadFolders();
    } catch (error) {
      setError(`Failed to move memories: ${error}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, loadFolders]);

  const bulkTagMemories = useCallback(async (memoryIds: string[], tags: string[]) => {
    setLoading(true);
    
    try {
      await invoke('jean_memory_bulk_tag', {
        userId,
        memoryIds,
        tags,
      });
      
      // Update local state
      setState(prev => ({
        ...prev,
        memories: prev.memories.map(memory =>
          memoryIds.includes(memory.id)
            ? { ...memory, context_tags: [...new Set([...memory.context_tags, ...tags])] }
            : memory
        ),
        selectedMemories: [],
      }));
    } catch (error) {
      setError(`Failed to tag memories: ${error}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const bulkDeleteMemories = useCallback(async (memoryIds: string[]) => {
    setLoading(true);
    
    try {
      await invoke('jean_memory_bulk_delete', {
        userId,
        memoryIds,
      });
      
      // Update local state
      setState(prev => {
        const remainingMemories = prev.memories.filter(memory => !memoryIds.includes(memory.id));
        const deletedMemories = prev.memories.filter(memory => memoryIds.includes(memory.id));
        
        // Update folder counts
        const folderUpdates = new Map<string, number>();
        deletedMemories.forEach(memory => {
          if (memory.folder_id) {
            folderUpdates.set(
              memory.folder_id,
              (folderUpdates.get(memory.folder_id) || 0) + 1
            );
          }
        });
        
        return {
          ...prev,
          memories: remainingMemories,
          selectedMemories: [],
          folders: prev.folders.map(folder =>
            folderUpdates.has(folder.id)
              ? { ...folder, memory_count: Math.max(0, folder.memory_count - folderUpdates.get(folder.id)!) }
              : folder
          ),
        };
      });
    } catch (error) {
      setError(`Failed to delete memories: ${error}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // UI operations
  const setViewMode = useCallback((mode: 'grid' | 'list') => {
    setState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  const setSorting = useCallback((sortBy: string, order: 'asc' | 'desc') => {
    setState(prev => ({ ...prev, sortBy, sortOrder: order }));
    
    // Reload with new sorting
    loadMemories(state.currentFolder?.id, {
      user_id: userId!,
      folder_id: state.currentFolder?.id,
      sort_by: sortBy as any,
      sort_order: order,
    });
  }, [loadMemories, state.currentFolder?.id, userId]);

  const setFilterTags = useCallback((tags: string[]) => {
    setState(prev => ({ ...prev, filterTags: tags }));
    
    // Apply filter
    loadMemories(state.currentFolder?.id, {
      user_id: userId!,
      folder_id: state.currentFolder?.id,
      tags: tags.length > 0 ? tags : undefined,
    });
  }, [loadMemories, state.currentFolder?.id, userId]);

  const setFilterTypes = useCallback((types: string[]) => {
    setState(prev => ({ ...prev, filterTypes: types }));
    
    // Apply filter
    loadMemories(state.currentFolder?.id, {
      user_id: userId!,
      folder_id: state.currentFolder?.id,
      memory_types: types.length > 0 ? types : undefined,
    });
  }, [loadMemories, state.currentFolder?.id, userId]);

  // Editing operations
  const startEditingMemory = useCallback((memory: Memory) => {
    setState(prev => ({ ...prev, editingMemory: memory }));
  }, []);

  const stopEditingMemory = useCallback(() => {
    setState(prev => ({ ...prev, editingMemory: null }));
  }, []);

  const startCreatingFolder = useCallback(() => {
    setState(prev => ({ ...prev, isCreatingFolder: true }));
  }, []);

  const stopCreatingFolder = useCallback(() => {
    setState(prev => ({ ...prev, isCreatingFolder: false }));
  }, []);

  const startCreatingMemory = useCallback((folderId?: string) => {
    setState(prev => ({ ...prev, creatingNewMemory: true }));
  }, []);

  const stopCreatingMemory = useCallback(() => {
    setState(prev => ({ ...prev, creatingNewMemory: false }));
  }, []);

  // Analytics
  const getMemoryStats = useCallback(async (): Promise<Record<string, any>> => {
    if (!userId) return {};
    
    try {
      const stats = await invoke<Record<string, any>>('jean_memory_get_stats', { userId });
      return stats;
    } catch (error) {
      setError(`Failed to get memory stats: ${error}`);
      return {};
    }
  }, [userId, setError]);

  const getUsageAnalytics = useCallback(async (daysBack: number = 30): Promise<Record<string, any>> => {
    if (!userId) return {};
    
    try {
      const analytics = await invoke<Record<string, any>>('jean_memory_get_usage_analytics', {
        userId,
        daysBack,
      });
      return analytics;
    } catch (error) {
      setError(`Failed to get usage analytics: ${error}`);
      return {};
    }
  }, [userId, setError]);

  // Import/Export
  const exportMemories = useCallback(async (memoryIds?: string[]): Promise<string> => {
    if (!userId) throw new Error('User ID required');
    
    try {
      const exportData = await invoke<string>('jean_memory_export', {
        userId,
        memoryIds,
      });
      
      return exportData;
    } catch (error) {
      setError(`Failed to export memories: ${error}`);
      throw error;
    }
  }, [userId, setError]);

  const importMemories = useCallback(async (data: any) => {
    if (!userId) return;
    
    setLoading(true);
    
    try {
      await invoke('jean_memory_import', {
        userId,
        data,
      });
      
      // Reload data
      await loadFolders();
      await loadMemories();
    } catch (error) {
      setError(`Failed to import memories: ${error}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userId, setLoading, setError, loadFolders, loadMemories]);

  // Initialize data
  useEffect(() => {
    if (userId) {
      loadFolders();
      loadMemories();
    }
  }, [userId]);

  const actions: JeanMemoryActions = {
    loadFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    setCurrentFolder,
    loadMemories,
    createMemory,
    updateMemory,
    deleteMemory,
    duplicateMemory,
    archiveMemory,
    unarchiveMemory,
    searchMemories,
    setSearchQuery,
    clearSearch,
    selectMemory,
    selectMultipleMemories,
    clearSelection,
    selectAllMemories,
    linkMemories,
    unlinkMemories,
    getRelatedMemories,
    getTags,
    addTag,
    removeTag,
    bulkMoveMemories,
    bulkTagMemories,
    bulkDeleteMemories,
    setViewMode,
    setSorting,
    setFilterTags,
    setFilterTypes,
    startEditingMemory,
    stopEditingMemory,
    startCreatingFolder,
    stopCreatingFolder,
    startCreatingMemory,
    stopCreatingMemory,
    getMemoryStats,
    getUsageAnalytics,
    exportMemories,
    importMemories,
  };

  return { state, actions };
};

export default useJeanMemory;