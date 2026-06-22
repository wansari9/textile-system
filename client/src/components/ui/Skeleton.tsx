interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({ className = '', variant = 'text', width, height }: SkeletonProps) {
  const base = 'animate-pulse bg-linen';
  const shape = variant === 'circle' ? 'rounded-full' : variant === 'rect' ? 'rounded-lg' : 'rounded h-4';

  return (
    <div
      className={`${base} ${shape} ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="flex-1 h-6" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="flex-1 h-5" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-surface-raised rounded-xl border border-linen p-5 space-y-4">
      <div className="flex justify-between">
        <Skeleton className="w-1/3 h-5" />
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
      <Skeleton className="w-1/2 h-8" />
      <Skeleton className="w-full h-2.5" />
    </div>
  );
}
