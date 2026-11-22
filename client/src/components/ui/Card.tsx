import type { ReactNode } from 'react';
import { card } from '../../design';

interface CardProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  padding?: keyof typeof card.padding;
  hover?: boolean;
}

export default function Card({ children, header, footer, className = '', padding = 'md', hover = false }: CardProps) {
  return (
    <div className={`${card.base} ${hover ? card.hover : ''} ${className}`}>
      {header && (
        <div className={card.header}>
          {typeof header === 'string' ? (
            <h3 className={card.title}>{header}</h3>
          ) : (
            header
          )}
        </div>
      )}
      <div className={card.padding[padding]}>
        {children}
      </div>
      {footer && (
        <div className={card.footer}>
          {footer}
        </div>
      )}
    </div>
  );
}
