import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Maximize2, Minimize2, Pin, PinOff, X, Grid, Layers } from 'lucide-react';

// Types
interface SplitViewConfig {
  id: string;
  type: 'horizontal' | 'vertical' | 'grid';
  sizes: number[];
  pinned: boolean;
  minimized: boolean;
}

interface PanelProps {
  children: React.ReactNode;
  title: string;
  isActive: boolean;
  onTogglePin: () => void;
  onMinimize: () => void;
  onClose: () => void;
  isPinned: boolean;
  isMinimized: boolean;
  canClose: boolean;
}

interface SplitViewContainerProps {
  children: React.ReactNode[];
  layout?: 'horizontal' | 'vertical' | 'grid' | '33-34-33' | '50-50' | '25-50-25';
  defaultSizes?: number[];
  className?: string;
  onSaveLayout?: (config: SplitViewConfig) => void;
  onLoadLayout?: () => SplitViewConfig | null;
  panelTitles?: string[];
}

// Panel Component
const Panel: React.FC<PanelProps> = ({
  children,
  title,
  isActive,
  onTogglePin,
  onMinimize,
  onClose,
  isPinned,
  isMinimized,
  canClose
}) => {
  if (isMinimized) {
    return (
      <div className="border border-gray-200 rounded-lg p-2 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 truncate">{title}</span>
          <div className="flex items-center space-x-1">
            <button
              onClick={onMinimize}
              className="p-1 hover:bg-gray-100 rounded"
              title="Restore"
            >
              <Maximize2 className="w-3 h-3 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${isActive ? 'ring-2 ring-blue-500' : ''}`}>
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onTogglePin}
            className={`p-1 hover:bg-gray-100 rounded ${isPinned ? 'text-blue-500' : 'text-gray-500'}`}
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            {isPinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
          </button>
          {canClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-red-100 rounded text-gray-500 hover:text-red-500"
              title="Close"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      
      {/* Panel Content */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        {children}
      </div>
    </div>
  );
};

// Draggable Divider Component
const DraggableDivider: React.FC<{
  isHorizontal: boolean;
  onDrag: (delta: number) => void;
  onDragEnd: () => void;
}> = ({ isHorizontal, onDrag, onDragEnd }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      const delta = isHorizontal ? deltaX : deltaY;
      
      onDrag(delta);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`
        ${isHorizontal 
          ? 'w-1 hover:w-2 cursor-col-resize' 
          : 'h-1 hover:h-2 cursor-row-resize'
        }
        ${isDragging ? 'bg-blue-500' : 'bg-gray-300 hover:bg-blue-400'}
        transition-all duration-150 relative z-10
      `}
      onMouseDown={handleMouseDown}
    >
      {isDragging && (
        <div className={`absolute inset-0 ${isHorizontal ? 'w-2' : 'h-2'} -m-0.5 bg-blue-200 opacity-50`}></div>
      )}
    </div>
  );
};

// Main SplitViewContainer Component
export const SplitViewContainer: React.FC<SplitViewContainerProps> = ({
  children,
  layout = 'horizontal',
  defaultSizes,
  className = '',
  onSaveLayout,
  onLoadLayout,
  panelTitles = []
}) => {
  const [sizes, setSizes] = useState<number[]>(defaultSizes || getDefaultSizes(layout, children.length));
  const [panels, setPanels] = useState(() => 
    children.map((_, index) => ({
      id: `panel-${index}`,
      pinned: false,
      minimized: false,
      visible: true
    }))
  );
  const [activePanel, setActivePanel] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Get default sizes based on layout
  function getDefaultSizes(layoutType: string, childCount: number): number[] {
    switch (layoutType) {
      case '50-50':
        return [50, 50];
      case '33-34-33':
        return [33, 34, 33];
      case '25-50-25':
        return [25, 50, 25];
      case 'grid':
        return childCount === 4 ? [50, 50, 50, 50] : Array(childCount).fill(100 / childCount);
      default:
        return Array(childCount).fill(100 / childCount);
    }
  }

  // Save layout configuration
  const saveLayout = useCallback(() => {
    const config: SplitViewConfig = {
      id: 'current-layout',
      type: layout as 'horizontal' | 'vertical' | 'grid',
      sizes,
      pinned: panels.some(p => p.pinned),
      minimized: panels.some(p => p.minimized)
    };
    
    if (onSaveLayout) {
      onSaveLayout(config);
    }
    
    // Save to localStorage
    localStorage.setItem('splitview-layout', JSON.stringify(config));
  }, [layout, sizes, panels, onSaveLayout]);

  // Load layout configuration
  const loadLayout = useCallback(() => {
    if (onLoadLayout) {
      const saved = onLoadLayout();
      if (saved) {
        setSizes(saved.sizes);
        return;
      }
    }
    
    // Load from localStorage
    const saved = localStorage.getItem('splitview-layout');
    if (saved) {
      try {
        const config: SplitViewConfig = JSON.parse(saved);
        setSizes(config.sizes);
      } catch (error) {
        console.error('Failed to load layout:', error);
      }
    }
  }, [onLoadLayout]);

  // Initialize layout on mount
  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  // Handle divider drag
  const handleDividerDrag = useCallback((dividerIndex: number) => (delta: number) => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerSize = layout === 'horizontal' ? containerRect.width : containerRect.height;
    const deltaPercent = (delta / containerSize) * 100;
    
    setSizes(prevSizes => {
      const newSizes = [...prevSizes];
      const currentSize = newSizes[dividerIndex];
      const nextSize = newSizes[dividerIndex + 1];
      
      // Calculate new sizes
      newSizes[dividerIndex] = Math.max(10, Math.min(80, currentSize + deltaPercent));
      newSizes[dividerIndex + 1] = Math.max(10, Math.min(80, nextSize - deltaPercent));
      
      // Normalize to ensure sum is 100
      const total = newSizes.reduce((sum, size) => sum + size, 0);
      if (total !== 100) {
        const diff = (100 - total) / newSizes.length;
        return newSizes.map(size => size + diff);
      }
      
      return newSizes;
    });
  }, [layout]);

  // Handle divider drag end
  const handleDividerDragEnd = useCallback(() => {
    setIsDragging(false);
    saveLayout();
  }, [saveLayout]);

  // Panel management functions
  const togglePin = useCallback((panelIndex: number) => {
    setPanels(prev => prev.map((panel, index) => 
      index === panelIndex ? { ...panel, pinned: !panel.pinned } : panel
    ));
  }, []);

  const toggleMinimize = useCallback((panelIndex: number) => {
    setPanels(prev => prev.map((panel, index) => 
      index === panelIndex ? { ...panel, minimized: !panel.minimized } : panel
    ));
  }, []);

  const closePanel = useCallback((panelIndex: number) => {
    const panel = panels[panelIndex];
    if (panel.pinned) return; // Can't close pinned panels
    
    setPanels(prev => prev.map((p, index) => 
      index === panelIndex ? { ...p, visible: false } : p
    ));
    
    // Redistribute sizes
    setSizes(prev => {
      const newSizes = prev.filter((_, index) => index !== panelIndex);
      const visibleCount = panels.filter((p, i) => i !== panelIndex && p.visible).length;
      return newSizes.map(size => size * (prev.length / visibleCount));
    });
  }, [panels]);

  const restorePanel = useCallback((panelIndex: number) => {
    setPanels(prev => prev.map((panel, index) => 
      index === panelIndex ? { ...panel, visible: true, minimized: false } : panel
    ));
    
    // Redistribute sizes
    const visibleCount = panels.filter(p => p.visible).length + 1;
    setSizes(prev => [...prev, 100 / visibleCount]);
  }, [panels]);

  // Layout presets
  const applyLayoutPreset = useCallback((preset: string) => {
    const visibleCount = panels.filter(p => p.visible).length;
    
    switch (preset) {
      case 'equal':
        setSizes(Array(visibleCount).fill(100 / visibleCount));
        break;
      case '50-50':
        setSizes([50, 50]);
        break;
      case '33-34-33':
        setSizes([33, 34, 33]);
        break;
      case '25-50-25':
        setSizes([25, 50, 25]);
        break;
      case 'focus-left':
        setSizes([70, 30]);
        break;
      case 'focus-right':
        setSizes([30, 70]);
        break;
      case 'focus-center':
        setSizes([25, 50, 25]);
        break;
    }
    
    saveLayout();
  }, [panels, saveLayout]);

  // Get visible children
  const visibleChildren = children.filter((_, index) => panels[index]?.visible !== false);
  const visiblePanels = panels.filter((_, index) => panels[index]?.visible !== false);

  // Render different layouts
  const renderLayout = () => {
    const isHorizontal = layout === 'horizontal' || layout === '50-50' || layout === '33-34-33' || layout === '25-50-25';
    const isVertical = layout === 'vertical';
    const isGrid = layout === 'grid';

    if (isGrid && visibleChildren.length === 4) {
      // 2x2 Grid layout
      return (
        <div className="grid grid-cols-2 grid-rows-2 h-full gap-1">
          {visibleChildren.map((child, index) => {
            const originalIndex = children.indexOf(child);
            const panel = panels[originalIndex];
            
            return (
              <div key={originalIndex} className="relative">
                <Panel
                  title={panelTitles[originalIndex] || `Panel ${originalIndex + 1}`}
                  isActive={activePanel === originalIndex}
                  onTogglePin={() => togglePin(originalIndex)}
                  onMinimize={() => toggleMinimize(originalIndex)}
                  onClose={() => closePanel(originalIndex)}
                  isPinned={panel.pinned}
                  isMinimized={panel.minimized}
                  canClose={!panel.pinned}
                >
                  {child}
                </Panel>
              </div>
            );
          })}
        </div>
      );
    }

    if ((isHorizontal || isVertical) && visibleChildren.length > 1) {
      // Horizontal or Vertical split layout
      return (
        <div className={`flex ${isVertical ? 'flex-col' : 'flex-row'} h-full`}>
          {visibleChildren.map((child, index) => {
            const originalIndex = children.indexOf(child);
            const panel = panels[originalIndex];
            const size = sizes[originalIndex] || 100 / visibleChildren.length;
            
            return (
              <React.Fragment key={originalIndex}>
                <div 
                  className={`relative ${isVertical ? '' : 'flex-shrink-0'}`}
                  style={{ 
                    width: isHorizontal ? `${size}%` : '100%',
                    height: isVertical ? `${size}%` : '100%'
                  }}
                >
                  <Panel
                    title={panelTitles[originalIndex] || `Panel ${originalIndex + 1}`}
                    isActive={activePanel === originalIndex}
                    onTogglePin={() => togglePin(originalIndex)}
                    onMinimize={() => toggleMinimize(originalIndex)}
                    onClose={() => closePanel(originalIndex)}
                    isPinned={panel.pinned}
                    isMinimized={panel.minimized}
                    canClose={!panel.pinned}
                  >
                    {child}
                  </Panel>
                </div>
                {index < visibleChildren.length - 1 && (
                  <DraggableDivider
                    isHorizontal={isHorizontal}
                    onDrag={handleDividerDrag(index)}
                    onDragEnd={handleDividerDragEnd}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      );
    }

    // Single panel fallback
    if (visibleChildren.length === 1) {
      const originalIndex = children.indexOf(visibleChildren[0]);
      const panel = panels[originalIndex];
      
      return (
        <div className="h-full">
          <Panel
            title={panelTitles[originalIndex] || `Panel ${originalIndex + 1}`}
            isActive={activePanel === originalIndex}
            onTogglePin={() => togglePin(originalIndex)}
            onMinimize={() => toggleMinimize(originalIndex)}
            onClose={() => closePanel(originalIndex)}
            isPinned={panel.pinned}
            isMinimized={panel.minimized}
            canClose={!panel.pinned}
          >
            {visibleChildren[0]}
          </Panel>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`flex flex-col h-full bg-gray-100 ${className}`}>
      {/* Layout Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h3 className="text-sm font-medium text-gray-900">Split View</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => applyLayoutPreset('equal')}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="Equal sizes"
            >
              <Grid className="w-3 h-3" />
            </button>
            <button
              onClick={() => applyLayoutPreset('50-50')}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="50/50 split"
            >
              50/50
            </button>
            <button
              onClick={() => applyLayoutPreset('33-34-33')}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="33/34/33 split"
            >
              33/34/33
            </button>
            <button
              onClick={() => applyLayoutPreset('25-50-25')}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="25/50/25 split"
            >
              25/50/25
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={saveLayout}
            className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
          >
            Save Layout
          </button>
          <button
            onClick={loadLayout}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
          >
            Load Layout
          </button>
        </div>
      </div>

      {/* Minimized Panels Bar */}
      {panels.some(p => p.minimized) && (
        <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 border-b border-gray-200 overflow-x-auto">
          <span className="text-xs text-gray-500">Minimized:</span>
          {panels.map((panel, index) => panel.minimized && (
            <div key={index} className="flex-shrink-0">
              <Panel
                title={panelTitles[index] || `Panel ${index + 1}`}
                isActive={false}
                onTogglePin={() => togglePin(index)}
                onMinimize={() => toggleMinimize(index)}
                onClose={() => {}}
                isPinned={panel.pinned}
                isMinimized={true}
                canClose={false}
              >
                <div />
              </Panel>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div ref={containerRef} className="flex-1 overflow-hidden">
        {renderLayout()}
      </div>

      {/* Closed Panels Recovery */}
      {panels.some((p, index) => !p.visible && children[index]) && (
        <div className="flex items-center justify-center px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Closed panels:</span>
            {panels.map((panel, index) => !panel.visible && children[index] && (
              <button
                key={index}
                onClick={() => restorePanel(index)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              >
                {panelTitles[index] || `Panel ${index + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SplitViewContainer;