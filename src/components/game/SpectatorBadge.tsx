import React from 'react';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpectatorBadgeProps {
  count: number;
  className?: string;
}

export function SpectatorBadge({ count, className }: SpectatorBadgeProps) {
  if (count === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium',
        className
      )}
    >
      <Eye className="h-3 w-3" />
      <span>{count} watching</span>
    </div>
  );
}
