import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface TafsirSource {
  id: string;
  name: string;
  content: string;
  pointIndex: number;
}

export interface TafsirDisagreementsProps {
  sources: TafsirSource[];
  disagreementPoints: number[];
  className?: string;
}

export const TafsirDisagreements: React.FC<TafsirDisagreementsProps> = ({
  sources,
  disagreementPoints,
  className
}) => {
  const points = Array.from(new Set(disagreementPoints)).filter((p) =>
    sources.some((s) => s.pointIndex === p)
  );
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <AlertCircle className="w-3 h-3" />
        <span>Scholarly disagreements shown without synthesis or preference</span>
      </div>
      {points.map((p) => {
        const byPoint = sources.filter((s) => s.pointIndex === p);
        const cols = Math.min(Math.max(byPoint.length, 1), 4);
        return (
          <div key={`point-${p}`} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Point {p + 1}</Badge>
                <Badge variant="secondary" className="text-xs">{byPoint.length} sources</Badge>
              </div>
            </div>
            <div
              className={cn(
                'grid gap-2',
                cols === 1 && 'grid-cols-1',
                cols === 2 && 'grid-cols-2',
                cols === 3 && 'grid-cols-3',
                cols === 4 && 'grid-cols-4'
              )}
            >
              {byPoint.map((s) => (
                <div key={s.id} className="rounded border bg-background/50 p-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">{s.name}</span>
                    <Badge variant="outline" className="text-[10px]">Source</Badge>
                  </div>
                  <div className="text-xs text-foreground/90 whitespace-pre-wrap">{s.content}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

