import type { ReactNode } from 'react';
import { useEffect, useCallback } from 'react';
import { modal } from '../../design';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof modal.sizes;
}

export default function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className={modal.overlay} onClick={onClose} />
      <div className={`${modal.panel} ${modal.sizes[size]}`}>
        {title && (
          <div className={modal.header}>
            <h2 className={modal.title}>{title}</h2>
            <button onClick={onClose} className={modal.close} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className={modal.body}>
          {children}
        </div>
        {footer && (
          <div className={modal.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
