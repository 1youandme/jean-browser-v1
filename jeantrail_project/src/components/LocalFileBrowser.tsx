import React, { useState, useEffect } from 'react';
import { Folder, File, ArrowLeft, ArrowRight, Home, Search, Grid, List, Plus } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/shell';
import { Tab, FileEntry } from '../types';

interface LocalFileBrowserProps {
  tab?: Tab;
}

export const LocalFileBrowser: React.FC<LocalFileBrowserProps> = ({ tab }) => {
  const [currentPath, setCurrentPath] = useState(tab?.path || '/');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadDirectory = async (path: string) => {
    setIsLoading(true);
    try {
      const entries = await invoke<FileEntry[]>('list_directory', { path });
      setFiles(entries);
      setCurrentPath(path);
    } catch (error) {
      console.error('Failed to load directory:', error);
      // Fallback to some default files for demo
      setFiles([
        { name: 'Documents', path: `${path}/Documents`, isDirectory: true },
        { name: 'Downloads', path: `${path}/Downloads`, isDirectory: true },
        { name: 'Pictures', path: `${path}/Pictures`, isDirectory: true },
        { name: 'example.txt', path: `${path}/example.txt`, isDirectory: false, size: 1024 },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDirectory(currentPath);
  }, []);

  const handleFileClick = async (entry: FileEntry) => {
    if (entry.isDirectory) {
      await loadDirectory(entry.path);
    } else {
      // Open file with system default application
      try {
        await invoke('open_in_system', { path: entry.path });
      } catch (error) {
        console.error('Failed to open file:', error);
      }
    }
  };

  const navigateToParent = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    loadDirectory(parentPath);
  };

  const navigateToHome = () => {
    loadDirectory('/'); // Would be user home directory in real implementation
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (entry: FileEntry) => {
    if (entry.isDirectory) {
      return <Folder className="w-5 h-5 text-blue-500" />;
    }
    
    const ext = entry.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'txt':
      case 'md':
        return <File className="w-5 h-5 text-gray-500" />;
      case 'pdf':
        return <File className="w-5 h-5 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <File className="w-5 h-5 text-green-500" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <File className="w-5 h-5 text-purple-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-4">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={navigateToParent}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Go to parent directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Go forward"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={navigateToHome}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Go to home directory"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>

        {/* Path */}
        <div className="flex-1 px-3 py-1 bg-gray-50 border border-gray-300 rounded text-sm text-gray-600 truncate">
          {currentPath}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="pl-8 pr-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* View Mode */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1 rounded transition-colors ${
              viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1 rounded transition-colors ${
              viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Grid view"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : viewMode === 'list' ? (
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr className="text-left">
                <th className="px-4 py-2 text-sm font-medium text-gray-700">Name</th>
                <th className="px-4 py-2 text-sm font-medium text-gray-700">Size</th>
                <th className="px-4 py-2 text-sm font-medium text-gray-700">Modified</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((entry, index) => (
                <tr
                  key={index}
                  onClick={() => handleFileClick(entry)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-2 flex items-center gap-2">
                    {getFileIcon(entry)}
                    <span className={entry.isDirectory ? 'font-medium' : ''}>
                      {entry.name}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {entry.isDirectory ? '—' : formatFileSize(entry.size)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {entry.modified ? new Date(entry.modified).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {filteredFiles.map((entry, index) => (
              <div
                key={index}
                onClick={() => handleFileClick(entry)}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="w-12 h-12 flex items-center justify-center">
                  {getFileIcon(entry)}
                </div>
                <span className="text-xs text-center truncate w-full">
                  {entry.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {filteredFiles.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-4">📁</div>
              <p className="text-gray-500">No files found</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-gray-100 border-t border-gray-200 flex items-center justify-between px-4">
        <div className="text-xs text-gray-600">
          {filteredFiles.length} item{filteredFiles.length !== 1 ? 's' : ''}
        </div>
        <div className="text-xs text-gray-500">
          {currentPath}
        </div>
      </div>
    </div>
  );
};