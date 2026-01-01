import React from 'react';
import type { DecisionTrace, DecisionResult } from '@/kernel/KernelIntrospection';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { CheckCircle, AlertCircle, Clock, Activity } from 'lucide-react';

export interface SessionTimelineProps {
  traces: DecisionTrace[];
  currentIndex?: number;
}

function outcomeBadge(outcome: DecisionResult) {
  const variant = outcome === 'approved' ? 'success' : outcome === 'pending' ? 'warning' : 'destructive';
  const icon = outcome === 'approved' ? <CheckCircle className="w-3 h-3" /> : outcome === 'pending' ? <Clock className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />;
  return (
    <Badge variant={variant} className="flex items-center gap-1 text-xs">
      {icon}
      {outcome}
    </Badge>
  );
}

export const SessionTimeline: React.FC<SessionTimelineProps> = ({ traces, currentIndex = -1 }) => {
  return (
    <ScrollArea className="h-80">
      <div className="space-y-3">
        {traces.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="w-4 h-4" />
            <span>No timeline loaded</span>
          </div>
        )}
        {traces.map((t: DecisionTrace, i: number) => {
          const active = i === currentIndex;
          return (
            <Card key={t.decisionId} className={active ? 'border-blue-500' : ''}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{new Date(t.timestamp).toLocaleTimeString()}</Badge>
                    <Badge variant="secondary" className="text-xs">{t.intent}</Badge>
                  </div>
                  {outcomeBadge(t.outcome)}
                </div>
                <div className="mt-2 text-xs">
                  <div>inputs: {Object.keys(t.inputs || {}).length}</div>
                  <div>checks: {t.policyChecks.length}</div>
                </div>
                {t.policyChecks.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {t.policyChecks.map((p: { policyName: string; passed: boolean; reason?: string }, idx: number) => (
                      <div key={`${t.decisionId}-pc-${idx}`} className="rounded border p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{p.policyName}</span>
                          <Badge variant={p.passed ? 'success' : 'destructive'} className="text-[10px]">
                            {p.passed ? 'pass' : 'fail'}
                          </Badge>
                        </div>
                        {p.reason && <div className="mt-1 text-[11px] text-muted-foreground">{p.reason}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
};
