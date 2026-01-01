import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SessionTimeline } from '@/components/ui/SessionTimeline';
import { ExplanationViewer } from '@/components/ui/ExplanationViewer';
import type { DecisionTrace } from '@/kernel/KernelIntrospection';
import { isIsolationLevel } from '@/kernel/KernelState';
import { Play, Pause, StepForward, StepBack, Upload, Lock } from 'lucide-react';

export const ReplayViewer: React.FC = () => {
  const [traces, setTraces] = useState<DecisionTrace[]>([]);
  const [current, setCurrent] = useState<number>(-1);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFromFile = async (file: File) => {
    const text = await file.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return;
    }
    const arr: DecisionTrace[] = Array.isArray(data) ? data : Array.isArray(data?.entries) ? data.entries : [];
    setTraces(arr);
    setCurrent(arr.length > 0 ? 0 : -1);
    setPlaying(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else {
      setPlaying(true);
      timerRef.current = window.setInterval(() => {
        setCurrent((idx) => {
          if (idx < 0) return traces.length > 0 ? 0 : -1;
          const next = idx + 1;
          if (next >= traces.length) {
            if (timerRef.current) {
              window.clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setPlaying(false);
            return idx;
          }
          return next;
        });
      }, 1000) as unknown as number;
    }
  };

  const stepForward = () => {
    setCurrent((idx) => (idx < 0 ? (traces.length > 0 ? 0 : -1) : Math.min(idx + 1, traces.length - 1)));
  };

  const stepBack = () => {
    setCurrent((idx) => (idx < 0 ? -1 : Math.max(idx - 1, 0)));
  };

  const openFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Replay Viewer</CardTitle>
            <Badge variant="destructive" className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Replay Mode • Read-only
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="application/json"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) loadFromFile(f);
              }}
            />
            <Button variant="outline" size="sm" onClick={openFile}>
              <Upload className="w-4 h-4 mr-1" />
              Load Timeline
            </Button>
            <Button variant="ghost" size="sm" onClick={stepBack} disabled={traces.length === 0 || current <= 0}>
              <StepBack className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={togglePlay} disabled={traces.length === 0}>
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={stepForward} disabled={traces.length === 0 || current >= traces.length - 1}>
              <StepForward className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <SessionTimeline traces={traces} currentIndex={current} />
        {current >= 0 && traces[current] && (
          <div className="mt-4">
            <ExplanationViewer
              decision={traces[current]}
              isolationLevel={
                (() => {
                  const iso = (traces[current] as any)?.isolationLevel;
                  return typeof iso === 'string' && isIsolationLevel(iso) ? iso : undefined;
                })()
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReplayViewer;
