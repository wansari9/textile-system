import { skeleton } from '../../design';

interface SkeletonProps {
  className?: string;
  variant?: keyof typeof skeleton.shapes;
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({ className = '', variant = 'text', width, height }: SkeletonProps) {
  return (
    <div
      className={`${skeleton.base} ${skeleton.shapes[variant]} ${className}`}
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
    <div className="bg-surface-raised rounded-xl border border-rule p-5 space-y-3">
      <Skeleton className="w-1/3 h-4" />
      <Skeleton variant="rect" className="h-32" />
    </div>
  );
}
