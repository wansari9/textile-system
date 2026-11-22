import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { badge } from '../../design';

type BadgeStatus = 'on_target' | 'warning' | 'critical' | 'maintenance' | 'idle' | 'default';

interface BadgeProps {
  children: ReactNode;
  status?: BadgeStatus;
  dot?: boolean;
  size?: keyof typeof badge.sizes;
  className?: string;
}

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
      className={`${badge.base} ${badge.sizes[size]} ${badge.status[status]} ${className}`}
    >
      {dot && (
        <span
          ref={dotRef}
          className={`w-1.5 h-1.5 rounded-full ${badge.dot[status]}`}
        />
      )}
      {children}
    </span>
  );
}
