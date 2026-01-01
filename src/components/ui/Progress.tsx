import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'success' | 'warning' | 'error' | 'blue' | 'green';
}

const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  className,
  showValue = false,
  size = 'md',
  color = 'default',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorClasses = {
    default: 'bg-gray-200 dark:bg-gray-700',
    success: 'bg-green-100 dark:bg-green-900',
    warning: 'bg-yellow-100 dark:bg-yellow-900',
    error: 'bg-red-100 dark:bg-red-900',
    blue: 'bg-blue-100 dark:bg-blue-900',
    green: 'bg-green-100 dark:bg-green-900',
  };

  const progressColorClasses = {
    default: 'bg-blue-600 dark:bg-blue-400',
    success: 'bg-green-600 dark:bg-green-400',
    warning: 'bg-yellow-600 dark:bg-yellow-400',
    error: 'bg-red-600 dark:bg-red-400',
    blue: 'bg-blue-600 dark:bg-blue-400',
    green: 'bg-green-600 dark:bg-green-400',
  };

  return (
    <div className={cn('w-full', className)}>
      {showValue && (
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>{Math.round(value)} / {max}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn(
        'relative w-full rounded-full overflow-hidden',
        sizeClasses[size],
        colorClasses[color]
      )}>
        <div
          className={cn(
            'h-full transition-all duration-300 ease-in-out rounded-full',
            progressColorClasses[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export { Progress };