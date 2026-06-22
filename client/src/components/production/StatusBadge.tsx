import Badge from '../ui/Badge';

interface StatusBadgeProps {
  status?: 'on_target' | 'warning' | 'critical' | 'maintenance' | 'idle';
  value: number;
  suffix?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function StatusBadge({
  status = 'idle',
  value,
  suffix = '%',
  size = 'md',
  className = '',
}: StatusBadgeProps) {
  return (
    <Badge status={status} dot size={size} className={className}>
      {value}{suffix}
    </Badge>
  );
}
