import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "animate-spin rounded-full border-primary border-t-transparent",
        sizeClasses[size],
        className
      )}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function PageLoader() {
  return (
    <div 
      className="flex items-center justify-center min-h-[400px]"
      role="status"
      aria-label="Loading page content"
    >
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground text-sm animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card overflow-hidden animate-pulse" aria-hidden="true">
      <div className="h-40 bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse" aria-hidden="true">
      <div className="h-10 bg-muted rounded" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-muted/50 rounded" />
      ))}
    </div>
  );
}
