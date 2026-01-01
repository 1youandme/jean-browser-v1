import React from 'react';
import type { DecisionTrace, DecisionResult } from '@/kernel/KernelIntrospection';
import { IsolationLevel, isIsolationLevel } from '@/kernel/KernelState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface ExplanationViewerProps {
  decision: DecisionTrace;
  isolationLevel?: IsolationLevel | string;
}

function isolationBadge(value?: IsolationLevel | string) {
  const iso = typeof value === 'string' && isIsolationLevel(value) ? value : undefined;
  const variant =
    iso === 'strict' ? 'secondary' :
    iso === 'shared_read' ? 'info' :
    iso === 'shared_write' ? 'warning' :
    iso === 'permeable' ? 'destructive' : 'outline';
  return (
    <Badge variant={variant} className="text-xs">
      {iso ? iso : 'unknown'}
    </Badge>
  );
}

export const ExplanationViewer: React.FC<ExplanationViewerProps> = ({ decision, isolationLevel }) => {
  const passedChecks = (decision.policyChecks || []).filter(p => p.passed);
  const totalChecks = (decision.policyChecks || []).length;
  const allowed: Readonly<boolean> = (decision.outcome === 'approved');
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Why this was {allowed ? 'allowed' : 'denied'}</CardTitle>
            {allowed ? (
              <Badge variant="success" className="flex items-center gap-1 text-xs">
                <CheckCircle className="w-3 h-3" />
                allowed
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                <AlertCircle className="w-3 h-3" />
                denied
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{decision.intent}</Badge>
          {isolationBadge(isolationLevel)}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="w-4 h-4" />
          <span>
            This explanation highlights the governing isolation rules and policy checks that determined the outcome.
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Policy checks passed</span>
            <Badge variant="outline" className="text-[10px]">
              {passedChecks.length}/{totalChecks}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {passedChecks.map((p: { policyName: string; passed: boolean; reason?: string }, idx: number) => (
              <div key={`pc-${idx}`} className="rounded border p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{p.policyName}</span>
                  <Badge variant="success" className="text-[10px]">pass</Badge>
                </div>
                {p.reason && <div className="mt-1 text-[11px] text-muted-foreground">{p.reason}</div>}
              </div>
            ))}
            {passedChecks.length === 0 && (
              <div className="text-xs text-muted-foreground">No checks passed.</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
