import React, { useState } from 'react';
import { Plus, X, Layout, Save } from 'lucide-react';
import { ViewType, SplitPane, Workspace } from '../types';

interface SplitViewProps {
  panes: SplitPane[];
  onPaneAdd: (viewType: ViewType) => void;
  onPaneRemove: (paneId: string) => void;
  onPaneChange: (paneId: string, viewType: ViewType) => void;
  children: React.ReactNode;
}

export const SplitView: React.FC<SplitViewProps> = ({
  panes,
  onPaneAdd,
  onPaneRemove,
  onPaneChange,
  children,
}) => {
  const [layoutDirection, setLayoutDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  const getPaneStyle = () => {
    if (panes.length === 1) return 'w-full h-full';
    
    if (layoutDirection === 'horizontal') {
      return `flex-1 h-full border-r border-gray-200 last:border-r-0`;
    } else {
      return `w-full flex-1 border-b border-gray-200 last:border-b-0`;
    }
  };

  const containerClass = layoutDirection === 'horizontal' ? 'flex-row' : 'flex-col';

  return (
    <div className="flex-1 flex relative">
      {/* Main Split Container */}
      <div className={`flex flex-1 ${containerClass}`}>
        {React.Children.map(children, (child, index) => (
          <div key={panes[index]?.id} className={getPaneStyle()}>
            {/* Pane Controls */}
            <div className="h-8 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <select
                  value={panes[index]?.viewType || 'web'}
                  onChange={(e) => onPaneChange(panes[index]?.id || '', e.target.value as ViewType)}
                  className="text-xs px-2 py-1 border border-gray-300 rounded"
                >
                  <option value="web">Web</option>
                  <option value="local">Local</option>
                  <option value="proxy">Proxy</option>
                  <option value="mobile">Mobile</option>
                </select>
              </div>
              
              <div className="flex items-center gap-1">
                {panes.length > 1 && (
                  <button
                    onClick={() => onPaneRemove(panes[index]?.id || '')}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Remove pane"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Pane Content */}
            <div className="flex-1 overflow-hidden">
              {child}
            </div>
          </div>
        ))}
      </div>

      {/* Split Controls Toolbar */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
        <div className="flex flex-col gap-2">
          {/* Add Pane */}
          <div className="relative group">
            <button
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Add pane"
            >
              <Plus className="w-4 h-4" />
            </button>
            
            {/* Dropdown for pane types */}
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[120px]">
              {(['web', 'local', 'proxy', 'mobile'] as ViewType[]).map(type => (
                <button
                  key={type}
                  onClick={() => onPaneAdd(type)}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 capitalize first:rounded-t-lg last:rounded-b-lg"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Layout Direction */}
          <button
            onClick={() => setLayoutDirection(layoutDirection === 'horizontal' ? 'vertical' : 'horizontal')}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Change layout direction"
          >
            <Layout className="w-4 h-4" />
          </button>

          {/* Workspace Management */}
          <div className="relative">
            <button
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Workspace management"
            >
              <Save className="w-4 h-4" />
            </button>

            {showWorkspaceMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                <button
                  onClick={() => {
                    // Save current workspace
                    console.log('Save workspace');
                    setShowWorkspaceMenu(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg"
                >
                  Save Workspace
                </button>
                <button
                  onClick={() => {
                    // Load workspace
                    console.log('Load workspace');
                    setShowWorkspaceMenu(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                >
                  Load Workspace
                </button>
                <button
                  onClick={() => {
                    // Manage workspaces
                    console.log('Manage workspaces');
                    setShowWorkspaceMenu(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 last:rounded-b-lg"
                >
                  Manage Workspaces
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pane Counter */}
      <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
        {panes.length} pane{panes.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};