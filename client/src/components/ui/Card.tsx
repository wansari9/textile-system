import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export default function Card({ children, header, footer, className = '', padding = 'md', hover = false }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-border shadow-card transition-all duration-200 ${
        hover ? 'hover:shadow-card-hover hover:border-gray-300' : ''
      } ${className}`}
    >
      {header && (
        <div className="px-5 py-4 border-b border-border">
          {header}
        </div>
      )}
      <div className={paddingClasses[padding]}>
        {children}
      </div>
      {footer && (
        <div className="px-5 py-3 border-t border-border bg-gray-50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
}
