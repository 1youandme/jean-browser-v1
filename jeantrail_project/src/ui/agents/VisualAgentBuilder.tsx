import React, { useMemo, useState } from 'react';
import { AgentManifest } from '../../agents/AgentDefinition';
import { AgentPermissionScope, KNOWN_SCOPES } from '../../agents/AgentPermissions';
import { ResearchAgent } from '../../agents/templates/ResearchAgent';
import { CodeAssistantAgent } from '../../agents/templates/CodeAssistantAgent';

type MemoryBehavior = 'ephemeral' | 'persistent' | 'none';

interface TemplateCard {
  id: string;
  name: string;
  manifest: AgentManifest;
  intendedCapabilities: string[];
  requiredScopes: AgentPermissionScope[];
  memoryBehavior: MemoryBehavior;
}

export interface VisualAgentBuilderProps {
  onCreate?: (manifest: AgentManifest, approvedScopes: AgentPermissionScope[]) => void;
}

function memoryBehaviorFromScope(scope: AgentManifest['memoryScope']): MemoryBehavior {
  if (scope === 'session') return 'ephemeral';
  if (scope === 'workspace') return 'persistent';
  return 'none';
}

function TemplateCardView({
  t,
  onSelect
}: {
  t: TemplateCard;
  onSelect: () => void;
}) {
  return (
    <div className="border rounded p-3">
      <div className="text-sm font-semibold">{t.name}</div>
      <div className="mt-1 text-xs text-gray-600">Capabilities: {t.intendedCapabilities.join(', ')}</div>
      <div className="mt-1 text-xs text-gray-600">Permission scopes: {t.requiredScopes.join(', ') || 'none'}</div>
      <div className="mt-1 text-xs text-gray-600">Memory: {t.memoryBehavior}</div>
      <div className="mt-2">
        <button
          type="button"
          className="text-xs px-2 py-1 border rounded"
          onClick={onSelect}
        >
          Select
        </button>
      </div>
    </div>
  );
}

export function VisualAgentBuilder(props: VisualAgentBuilderProps) {
  const templates: TemplateCard[] = useMemo(() => {
    const mediaManifest: AgentManifest = {
      id: 'template-media-agent',
      name: 'Media Agent',
      description: 'Assists with media generation and transformations.',
      version: '1.0.0',
      intentTypes: ['generate_image', 'transcode_media', 'enhance_audio'],
      requiredPermissions: ['read_files', 'write_files'],
      memoryScope: 'workspace'
    };
    const osManifest: AgentManifest = {
      id: 'template-os-assistant',
      name: 'OS Assistant',
      description: 'Assists with OS queries and symbolic operations.',
      version: '1.0.0',
      intentTypes: ['system_query', 'workspace_status', 'symbolic_routing'],
      requiredPermissions: [],
      memoryScope: 'session'
    };
    const cards: TemplateCard[] = [
      {
        id: 'research',
        name: 'Research Agent',
        manifest: ResearchAgent,
        intendedCapabilities: ['web_research', 'collect_sources', 'synthesize_findings'],
        requiredScopes: ['read_memory', 'tool_use'],
        memoryBehavior: memoryBehaviorFromScope(ResearchAgent.memoryScope)
      },
      {
        id: 'code',
        name: 'Code Agent',
        manifest: CodeAssistantAgent,
        intendedCapabilities: ['explain_code', 'refactor_code', 'generate_tests'],
        requiredScopes: ['read_memory', 'write_memory', 'tool_use'],
        memoryBehavior: memoryBehaviorFromScope(CodeAssistantAgent.memoryScope)
      },
      {
        id: 'media',
        name: 'Media Agent',
        manifest: mediaManifest,
        intendedCapabilities: ['generate_image', 'transcode_media', 'enhance_audio'],
        requiredScopes: ['read_memory', 'write_memory', 'tool_use'],
        memoryBehavior: memoryBehaviorFromScope(mediaManifest.memoryScope)
      },
      {
        id: 'os',
        name: 'OS Assistant',
        manifest: osManifest,
        intendedCapabilities: ['system_query', 'workspace_status', 'symbolic_routing'],
        requiredScopes: ['read_memory', 'os_action'],
        memoryBehavior: memoryBehaviorFromScope(osManifest.memoryScope)
      }
    ];
    return cards;
  }, []);

  const [step, setStep] = useState<'select' | 'consent' | 'confirm'>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => templates.find(t => t.id === selectedId) || null, [templates, selectedId]);

  const [scopeSelections, setScopeSelections] = useState<Record<AgentPermissionScope, boolean>>(() => {
    const init: Record<AgentPermissionScope, boolean> = {} as any;
    KNOWN_SCOPES.forEach(s => { init[s] = false; });
    return init;
  });

  function selectTemplate(id: string) {
    setSelectedId(id);
    const init: Record<AgentPermissionScope, boolean> = {} as any;
    KNOWN_SCOPES.forEach(s => { init[s] = false; });
    setScopeSelections(init);
    setStep('consent');
  }

  function toggleScope(scope: AgentPermissionScope) {
    setScopeSelections(prev => ({ ...prev, [scope]: !prev[scope] }));
  }

  const approvedScopes = useMemo(
    () => KNOWN_SCOPES.filter(s => scopeSelections[s]),
    [scopeSelections]
  );

  const declinedScopes = useMemo(
    () => KNOWN_SCOPES.filter(s => !scopeSelections[s]),
    [scopeSelections]
  );

  function proceedToConfirm() {
    setStep('confirm');
  }

  function createAgent() {
    if (!selected) return;
    props.onCreate?.(selected.manifest, approvedScopes);
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <div className="rounded bg-blue-50 text-blue-900 px-4 py-3 text-sm">
        Agent creation does not execute anything. Scopes require explicit approval.
      </div>

      {step === 'select' && (
        <div className="grid grid-cols-2 gap-3">
          {templates.map(t => (
            <TemplateCardView
              key={t.id}
              t={t}
              onSelect={() => selectTemplate(t.id)}
            />
          ))}
        </div>
      )}

      {step === 'consent' && selected && (
        <div className="space-y-3">
          <div className="text-sm font-semibold">{selected.name}</div>
          <div className="text-xs text-gray-600">Capabilities: {selected.intendedCapabilities.join(', ')}</div>
          <div className="text-xs text-gray-600">Memory: {selected.memoryBehavior}</div>
          <div className="mt-2 text-xs">Preview and approve permission scopes:</div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {KNOWN_SCOPES.map(scope => (
              <label key={scope} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={scopeSelections[scope] || false}
                  onChange={() => toggleScope(scope)}
                />
                <span>{scope}</span>
              </label>
            ))}
          </div>
          <div className="mt-3">
            <button
              type="button"
              className="text-xs px-2 py-1 border rounded"
              onClick={proceedToConfirm}
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && selected && (
        <div className="space-y-3">
          <div className="text-sm font-semibold">{selected.name}</div>
          <div className="text-xs">
            This agent can do {selected.intendedCapabilities.join(', ')}. It cannot do background tasks or act without approval.
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div className="border rounded p-2">
              <div className="text-xs font-medium">Approved scopes</div>
              <div className="mt-1 text-xs text-gray-600">{approvedScopes.length ? approvedScopes.join(', ') : 'none'}</div>
            </div>
            <div className="border rounded p-2">
              <div className="text-xs font-medium">Declined scopes</div>
              <div className="mt-1 text-xs text-gray-600">{declinedScopes.length ? declinedScopes.join(', ') : 'none'}</div>
            </div>
          </div>
          <div className="mt-3">
            <button
              type="button"
              className="text-xs px-2 py-1 border rounded"
              onClick={createAgent}
            >
              Create Agent
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisualAgentBuilder;
