import React, { useMemo, useState } from 'react';
import { ActiveAgent } from '../../agents/AgentRuntimeInspector';
import { AgentPermissionScope } from '../../agents/AgentPermissions';
import { AuditTimelineEvent, summarizeTimeline } from '../../control/AuditTimeline';
import { GlobalKillSwitch } from '../../os/OSExecutionBridge';

export interface JeanControlCenterProps {
  bannerText?: string;
  agents?: ActiveAgent[];
  permissions?: Array<{ agentId: string; granted: AgentPermissionScope[] }>;
  memory?: {
    sessions?: number;
    persistentItems?: number;
    notes?: string;
  };
  auditTimeline?: AuditTimelineEvent[];
  killSwitchDisabled?: boolean;
  onNavigate?: (section: 'agents' | 'permissions' | 'memory' | 'audit' | 'killswitch') => void;
}

function SectionHeader({
  title,
  description,
  collapsed,
  onToggle,
  onNavigate
}: {
  title: string;
  description: string;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="text-xs text-blue-600 hover:underline"
          onClick={onNavigate}
        >
          View
        </button>
        <button
          type="button"
          className="text-xs px-2 py-1 border rounded"
          onClick={onToggle}
        >
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>
    </div>
  );
}

export function JeanControlCenter(props: JeanControlCenterProps) {
  const [agentsOpen, setAgentsOpen] = useState(true);
  const [permsOpen, setPermsOpen] = useState(true);
  const [memoryOpen, setMemoryOpen] = useState(true);
  const [auditOpen, setAuditOpen] = useState(true);
  const [killOpen, setKillOpen] = useState(true);

  const banner = props.bannerText || 'Jean never acts without your permission.';
  const agents = props.agents || [];
  const permissions = props.permissions || [];
  const memory = props.memory || { sessions: 0, persistentItems: 0 };
  const auditEvents = props.auditTimeline || [];
  const killDisabled = props.killSwitchDisabled ?? GlobalKillSwitch.isExecutionDisabled;

  const stats = useMemo(() => summarizeTimeline(auditEvents), [auditEvents]);
  const recent = useMemo(() => auditEvents.slice(-5).reverse(), [auditEvents]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <div className="rounded bg-yellow-50 text-yellow-900 px-4 py-3 text-sm">
        {banner}
      </div>

      <div className="border rounded p-3">
        <SectionHeader
          title="Agents"
          description="Shows agent definitions and presence; observational only."
          collapsed={!agentsOpen}
          onToggle={() => setAgentsOpen(!agentsOpen)}
          onNavigate={props.onNavigate ? () => props.onNavigate?.('agents') : undefined}
        />
        {agentsOpen && (
          <div className="mt-2 space-y-2">
            {agents.length === 0 && (
              <div className="text-xs text-gray-500">No agents detected.</div>
            )}
            {agents.map((a) => (
              <div key={`${a.manifest.id}-${a.pid || ''}`} className="border rounded p-2">
                <div className="text-sm font-medium">{a.manifest.name} · {a.manifest.version}</div>
                <div className="text-xs text-gray-600">Intents: {a.manifest.intentTypes.join(', ')}</div>
                <div className="text-xs text-gray-600">Memory: {a.manifest.memoryScope}</div>
                <div className="text-xs text-gray-600">Session: {a.sessionId || 'n/a'} · PID: {a.pid || 'n/a'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border rounded p-3">
        <SectionHeader
          title="Permissions & Scopes"
          description="Displays granted scopes per agent; nothing is enabled by default."
          collapsed={!permsOpen}
          onToggle={() => setPermsOpen(!permsOpen)}
          onNavigate={props.onNavigate ? () => props.onNavigate?.('permissions') : undefined}
        />
        {permsOpen && (
          <div className="mt-2 space-y-2">
            {permissions.length === 0 && (
              <div className="text-xs text-gray-500">No permissions granted.</div>
            )}
            {permissions.map((p) => (
              <div key={p.agentId} className="border rounded p-2">
                <div className="text-sm font-medium">Agent: {p.agentId}</div>
                <div className="text-xs text-gray-600">Granted: {p.granted.length ? p.granted.join(', ') : 'none'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border rounded p-3">
        <SectionHeader
          title="Memory State"
          description="Shows session and persistent memory counts; revocation is explicit."
          collapsed={!memoryOpen}
          onToggle={() => setMemoryOpen(!memoryOpen)}
          onNavigate={props.onNavigate ? () => props.onNavigate?.('memory') : undefined}
        />
        {memoryOpen && (
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div className="border rounded p-2">
              <div className="text-sm font-medium">Sessions</div>
              <div className="text-xl">{memory.sessions ?? 0}</div>
            </div>
            <div className="border rounded p-2">
              <div className="text-sm font-medium">Persistent Items</div>
              <div className="text-xl">{memory.persistentItems ?? 0}</div>
            </div>
            {memory.notes && (
              <div className="col-span-2 text-xs text-gray-600">{memory.notes}</div>
            )}
          </div>
        )}
      </div>

      <div className="border rounded p-3">
        <SectionHeader
          title="Audit Timeline"
          description="Displays decisions, executions, blocks, and revocations chronologically."
          collapsed={!auditOpen}
          onToggle={() => setAuditOpen(!auditOpen)}
          onNavigate={props.onNavigate ? () => props.onNavigate?.('audit') : undefined}
        />
        {auditOpen && (
          <div className="mt-2 space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <div className="border rounded p-2">
                <div className="text-xs text-gray-600">Decisions</div>
                <div className="text-lg">{stats.decisions}</div>
              </div>
              <div className="border rounded p-2">
                <div className="text-xs text-gray-600">Executions</div>
                <div className="text-lg">{stats.executions}</div>
              </div>
              <div className="border rounded p-2">
                <div className="text-xs text-gray-600">Blocks</div>
                <div className="text-lg">{stats.blocks}</div>
              </div>
              <div className="border rounded p-2">
                <div className="text-xs text-gray-600">Revocations</div>
                <div className="text-lg">{stats.revocations}</div>
              </div>
            </div>
            <div className="space-y-2">
              {recent.length === 0 && (
                <div className="text-xs text-gray-500">No recent events.</div>
              )}
              {recent.map((e) => (
                <div key={e.id} className="border rounded p-2">
                  <div className="text-sm font-medium">{e.type} · {e.source}</div>
                  <div className="text-xs text-gray-600">{new Date(e.timestamp).toLocaleString()}</div>
                  <div className="text-xs text-gray-600">{Object.keys(e.details || {}).join(', ')}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border rounded p-3">
        <SectionHeader
          title="Kill Switch"
          description="Shows whether global execution is disabled; status is session-bound."
          collapsed={!killOpen}
          onToggle={() => setKillOpen(!killOpen)}
          onNavigate={props.onNavigate ? () => props.onNavigate?.('killswitch') : undefined}
        />
        {killOpen && (
          <div className="mt-2">
            <div className={`inline-block px-3 py-1 rounded text-xs ${killDisabled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {killDisabled ? 'Engaged' : 'Ready'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default JeanControlCenter;
