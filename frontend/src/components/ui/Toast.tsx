import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  pausedAt?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, action?: Toast['action']) => void;
  toast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
  pauseToast: (id: string) => void;
  resumeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const TOAST_DURATION = 4000;
const MAX_VISIBLE = 3;

const getAriaRole = (type: ToastType) =>
  type === 'error' || type === 'warning' ? 'alert' : 'status';

const getAriaLive = (type: ToastType) =>
  type === 'error' || type === 'warning' ? 'assertive' : 'polite';

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dismissing, setDismissing] = useState<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const scheduleDismiss = useCallback((id: string, delay: number) => {
    const existing = timersRef.current.get(id);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      setDismissing((prev) => new Set([...prev, id]));
      timersRef.current.delete(id);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        setDismissing((prev) => { const s = new Set(prev); s.delete(id); return s; });
      }, 200);
    }, delay);
    timersRef.current.set(id, timer);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', action?: Toast['action']) => {
    const id = crypto.randomUUID();
    setToasts((prev) => {
      const next = [{ id, message, type, action }, ...prev];
      return next.length > MAX_VISIBLE ? next.slice(0, MAX_VISIBLE) : next;
    });
    scheduleDismiss(id, TOAST_DURATION);
  }, [scheduleDismiss]);

  const pauseToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, pausedAt: Date.now() } : t
      )
    );
  }, []);

  const resumeToast = useCallback((id: string) => {
    let remaining = TOAST_DURATION;
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (toast?.pausedAt) {
        remaining = Math.max(TOAST_DURATION - (Date.now() - toast.pausedAt), 500);
      }
      return prev.map((t) => t.id === id ? { ...t, pausedAt: undefined } : t);
    });
    scheduleDismiss(id, remaining);
  }, [scheduleDismiss]);

  const toast = useCallback((type: ToastType, message: string) => {
    showToast(message, type);
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) { clearTimeout(timer); timersRef.current.delete(id); }
    setDismissing((prev) => new Set([...prev, id]));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setDismissing((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }, 200);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, toast, removeToast, pauseToast, resumeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} dismissing={dismissing} pauseToast={pauseToast} resumeToast={resumeToast} />
    </ToastContext.Provider>
  );
};


const ToastContainer: React.FC<{ toasts: Toast[]; removeToast: (id: string) => void; dismissing: Set<string>; pauseToast: (id: string) => void; resumeToast: (id: string) => void }> = ({
  toasts,
  removeToast,
  dismissing,
  pauseToast,
  resumeToast,
}) => {
  if (toasts.length === 0) return null;

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBarColor = (type: ToastType) => {
    switch (type) {
      case 'success': return 'bg-green-400';
      case 'error':   return 'bg-red-400';
      case 'warning': return 'bg-yellow-400';
      case 'info':    return 'bg-blue-400';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={getAriaRole(toast.type)}
          aria-live={getAriaLive(toast.type)}
          onMouseEnter={() => pauseToast(toast.id)}
          onMouseLeave={() => resumeToast(toast.id)}
          className={`${dismissing.has(toast.id) ? 'toast-exit' : 'toast-enter'} flex flex-col ${
            toast.type === 'success' ? 'border-l-green-400' :
            toast.type === 'error'   ? 'border-l-red-400'   :
            toast.type === 'warning' ? 'border-l-yellow-400' :
                                       'border-l-blue-400'
          } bg-dark-card border border-dark-border border-l-4 rounded-lg shadow-2xl overflow-hidden`}
        >
          {/* Progress bar */}
          <div
            className={`h-0.5 ${getBarColor(toast.type)} opacity-60 transition-none`}
            style={{
              width: toast.pausedAt ? undefined : '100%',
              animation: toast.pausedAt ? 'none' : `toast-progress ${TOAST_DURATION}ms linear forwards`,
            }}
          />
          <div className="flex items-start gap-3 p-4">
            <div className="flex-shrink-0 mt-0.5">{getIcon(toast.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-200">{toast.message}</p>
              {toast.action && (
                <button
                  onClick={() => { toast.action?.onClick(); removeToast(toast.id); }}
                  className="mt-1.5 text-xs text-primary hover:text-primary-light font-medium transition-colors"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="关闭通知"
              className="flex-shrink-0 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
