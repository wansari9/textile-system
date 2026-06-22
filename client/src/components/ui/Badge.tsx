import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

type BadgeStatus = 'on_target' | 'warning' | 'critical' | 'maintenance' | 'idle' | 'default';

interface BadgeProps {
  children: ReactNode;
  status?: BadgeStatus;
  dot?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusClasses: Record<BadgeStatus, string> = {
  on_target: 'bg-loom-green-bg text-loom-green',
  warning: 'bg-amber-bg text-caution-amber',
  critical: 'bg-defect-red-bg text-defect-red',
  maintenance: 'bg-raw-cotton text-cool-gray',
  idle: 'bg-raw-cotton text-slate',
  default: 'bg-raw-cotton text-slate',
};

const dotColors: Record<BadgeStatus, string> = {
  on_target: 'bg-loom-green',
  warning: 'bg-caution-amber',
  critical: 'bg-defect-red',
  maintenance: 'bg-cool-gray',
  idle: 'bg-slate',
  default: 'bg-slate',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-[12px]',
  lg: 'px-3 py-1.5 text-[13px]',
};

export default function Badge({ children, status = 'default', dot = false, size = 'md', className = '' }: BadgeProps) {
  const dotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (status === 'critical' && dotRef.current) {
      dotRef.current.style.animation = 'none';
      requestAnimationFrame(() => {
        if (dotRef.current) {
          dotRef.current.style.animation = 'pulse-once 0.6s ease-out 2';
        }
      });
    }
  }, [status]);

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full font-sans ${sizeClasses[size]} ${statusClasses[status]} ${className}`}
    >
      {dot && (
        <span
          ref={dotRef}
          className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`}
        />
      )}
      {children}
    </span>
  );
}
