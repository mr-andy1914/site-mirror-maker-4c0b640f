import React from 'react';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TurnTimerProps {
  timeLeft: number;
  isLow: boolean;
  enabled: boolean;
}

export function TurnTimer({ timeLeft, isLow, enabled }: TurnTimerProps) {
  if (!enabled) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-bold transition-all duration-200',
        isLow
          ? 'bg-destructive/20 text-destructive animate-pulse'
          : 'bg-muted text-foreground'
      )}
    >
      <Timer className={cn('h-4 w-4', isLow && 'animate-bounce')} />
      <span>{formatTime(timeLeft)}</span>
    </div>
  );
}
