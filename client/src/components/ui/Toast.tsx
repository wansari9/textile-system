import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

let nextId = 0;

const icons: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 size={18} className="text-success-600" />,
  error: <XCircle size={18} className="text-danger-600" />,
  warning: <AlertCircle size={18} className="text-warning-600" />,
  info: <Info size={18} className="text-info-600" />,
};

const bgColors: Record<ToastType, string> = {
  success: 'bg-success-50 border-success-500/20',
  error: 'bg-danger-50 border-danger-500/20',
  warning: 'bg-warning-50 border-warning-500/20',
  info: 'bg-info-50 border-info-500/20',
};

function ToastItem({ t, onRemove }: { t: Toast; onRemove: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(t.id), 4000);
    return () => clearTimeout(timer);
  }, [t.id, onRemove]);

  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-card animate-[slideUp_200ms_ease-out] ${bgColors[t.type]}`}>
      {icons[t.type]}
      <p className="text-sm font-medium text-text-primary flex-1">{t.message}</p>
      <button onClick={() => onRemove(t.id)} className="p-0.5 text-text-muted hover:text-text-primary">
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <ToastItem key={t.id} t={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
