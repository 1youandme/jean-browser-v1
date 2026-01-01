import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type ConsentGateProps = {
  children?: React.ReactNode;
  storageKey?: string;
  onAccepted?: () => void;
};

export default function ConsentGate(props: ConsentGateProps) {
  const storageKey = props.storageKey ?? 'jeantrail_consent_v1_accepted';
  const [accepted, setAccepted] = useState(false);
  const [noTelemetry, setNoTelemetry] = useState(false);
  const [noExecutionWithoutApproval, setNoExecutionWithoutApproval] = useState(false);
  const [localFirstBehavior, setLocalFirstBehavior] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v === 'yes') {
        setAccepted(true);
      }
    } catch {}
  }, [storageKey]);

  const canAccept = useMemo(() => {
    return noTelemetry && noExecutionWithoutApproval && localFirstBehavior;
  }, [noTelemetry, noExecutionWithoutApproval, localFirstBehavior]);

  const handleAccept = () => {
    if (!canAccept) return;
    try {
      localStorage.setItem(storageKey, 'yes');
    } catch {}
    setAccepted(true);
    if (props.onAccepted) props.onAccepted();
  };

  if (accepted) {
    return <>{props.children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Consent Required</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p className="text-foreground">
              Before enabling any capability, please review and accept the following:
            </p>
            <div className="space-y-3">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4"
                  checked={noTelemetry}
                  onChange={() => setNoTelemetry((v) => !v)}
                />
                <span className="text-foreground">
                  No telemetry is sent. Analytics, crash reporting, and usage collection are disabled.
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4"
                  checked={noExecutionWithoutApproval}
                  onChange={() => setNoExecutionWithoutApproval((v) => !v)}
                />
                <span className="text-foreground">
                  No execution occurs without explicit approval. Deny-by-default and governance-first decisions apply.
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4"
                  checked={localFirstBehavior}
                  onChange={() => setLocalFirstBehavior((v) => !v)}
                />
                <span className="text-foreground">
                  Local-first behavior is enforced. Operations prefer local execution and storage where applicable.
                </span>
              </label>
            </div>
            <div className="pt-2">
              <Button
                disabled={!canAccept}
                onClick={handleAccept}
                className="w-full"
              >
                I Understand & Accept
              </Button>
              <p className="mt-2 text-xs">
                You can revoke consent by clearing local data for this application.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

