import React, { useMemo } from 'react';
import { Shield, BookOpen, LayoutDashboard, FileText, Workflow, Settings, Globe, Smartphone, Cpu } from 'lucide-react';
import { GlobalKillSwitch } from '@/os/OSExecutionBridge';

export type DockItemKey =
  | 'overview'
  | 'governance'
  | 'threat_model'
  | 'audit'
  | 'web'
  | 'local_device'
  | 'mobile'
  | 'settings';

export interface DockItem {
  key: DockItemKey;
  label: string;
  icon: React.ReactNode;
}

export interface SovereignDockProps {
  active: DockItemKey;
  onSelect: (key: DockItemKey) => void;
  compact?: boolean;
}

export const SovereignDock: React.FC<SovereignDockProps> = ({ active, onSelect, compact }) => {
  const items: DockItem[] = useMemo(() => [
    { key: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'governance', label: 'Governance', icon: <Shield className="w-4 h-4" /> },
    { key: 'threat_model', label: 'Threat Model', icon: <BookOpen className="w-4 h-4" /> },
    { key: 'audit', label: 'Audit', icon: <Workflow className="w-4 h-4" /> },
    { key: 'web', label: 'Web', icon: <Globe className="w-4 h-4" /> },
    { key: 'local_device', label: 'Local', icon: <Cpu className="w-4 h-4" /> },
    { key: 'mobile', label: 'Mobile', icon: <Smartphone className="w-4 h-4" /> },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ], []);

  const disabled = GlobalKillSwitch.isExecutionDisabled;

  return (
    <div className={`border-t border-gray-300 bg-white/95 ${compact ? 'py-1' : 'py-2'} px-2`}>
      <div className="max-w-6xl mx-auto flex items-center gap-2">
        {/* Kill Switch / Mode Indicator */}
        <div className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${disabled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {disabled ? 'Governance Mode: Execution Disabled' : 'Execution Ready'}
        </div>

        {/* Dock Items */}
        <div className="flex-1 flex items-center gap-1 overflow-x-auto">
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              onClick={() => onSelect(it.key)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border text-xs transition-all ${
                active === it.key
                  ? 'border-gray-700 bg-gray-800 text-white'
                  : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span>{it.icon}</span>
              <span className="whitespace-nowrap">{it.label}</span>
            </button>
          ))}
        </div>

        {/* Right-side Quick Links (static, local only) */}
        <div className="flex items-center gap-2">
          <a href="/public/docs/THREAT-MODEL.md" className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100">
            <FileText className="w-3 h-3" /> Threat Model
          </a>
          <a href="/public/JEAN-CERTIFIED-ECOSYSTEM.md" className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100">
            <FileText className="w-3 h-3" /> Governance
          </a>
        </div>
      </div>
    </div>
  );
};

export default SovereignDock;

