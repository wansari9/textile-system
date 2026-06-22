interface ProductionBarProps {
  produced: number;
  target: number;
  showLabel?: boolean;
  showPercent?: boolean;
  animated?: boolean;
  className?: string;
}

export function getStatusColor(pct: number, lineStatus?: string) {
  if (lineStatus === 'MAINTENANCE') return { text: 'text-cool-gray', bg: 'bg-raw-cotton', border: 'border-cool-gray', fill: 'bg-cool-gray' };
  if (pct >= 100) return { text: 'text-loom-green', bg: 'bg-loom-green-bg', border: 'border-loom-green', fill: 'bg-loom-green' };
  if (pct >= 70) return { text: 'text-caution-amber', bg: 'bg-amber-bg', border: 'border-caution-amber', fill: 'bg-caution-amber' };
  return { text: 'text-defect-red', bg: 'bg-defect-red-bg', border: 'border-defect-red', fill: 'bg-defect-red' };
}

export default function ProductionBar({
  produced,
  target,
  showLabel = false,
  showPercent = false,
  animated = false,
  className = '',
}: ProductionBarProps) {
  const pct = target > 0 ? Math.min((produced / target) * 100, 100) : 0;
  const status = getStatusColor(pct);
  const overflow = target > 0 && produced > target;

  return (
    <div className={className}>
      <div className="relative h-2 w-full rounded-full overflow-hidden bg-raw-cotton">
        <div
          className={`h-full rounded-full ${status.fill} ${animated ? 'transition-all duration-[600ms] ease-out' : ''}`}
          style={{ width: `${pct}%` }}
        />
        {overflow && (
          <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-1 text-xs text-loom-green font-mono">
            ❯
          </span>
        )}
      </div>
      {(showLabel || showPercent) && (
        <div className="flex items-baseline justify-between mt-1">
          {showLabel && (
            <span className="text-sm font-mono text-ink">
              {produced.toLocaleString()} / {target.toLocaleString()}
            </span>
          )}
          {showPercent && (
            <span className={`text-xs font-mono font-medium ${status.text}`}>
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
