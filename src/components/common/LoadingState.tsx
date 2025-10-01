import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

/**
 * Optimized Loading State Component for Phase 2: UI Hardening
 * Provides consistent loading UI across the application
 */
export function LoadingState({ 
  message = 'Loading...', 
  fullScreen = false,
  className,
  size = 'md'
}: LoadingStateProps) {
  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center gap-3",
      fullScreen ? "min-h-screen" : "min-h-[200px]",
      className
    )}>
      <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary")} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );

  return content;
}

/**
 * Skeleton loading component for lists
 */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-20 bg-muted rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loading for cards
 */
export function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-4 p-4 border rounded-lg">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-1/2" />
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded" />
        <div className="h-3 bg-muted rounded w-5/6" />
      </div>
    </div>
  );
}

/**
 * Inline spinner for buttons
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
  );
}
