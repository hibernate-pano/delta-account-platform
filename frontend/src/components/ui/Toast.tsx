import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  toast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
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

const getAriaRole = (type: ToastType) =>
  type === 'error' || type === 'warning' ? 'alert' : 'status';

const getAriaLive = (type: ToastType) =>
  type === 'error' || type === 'warning' ? 'assertive' : 'polite';

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION);
  }, []);

  const toast = useCallback((type: ToastType, message: string) => {
    showToast(message, type);
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, toast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};


const ToastContainer: React.FC<{ toasts: Toast[]; removeToast: (id: string) => void }> = ({
  toasts,
  removeToast,
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
          className={`toast-enter flex flex-col bg-dark-card border border-dark-border border-l-4 ${
            toast.type === 'success' ? 'border-l-green-400' :
            toast.type === 'error'   ? 'border-l-red-400'   :
            toast.type === 'warning' ? 'border-l-yellow-400' :
                                       'border-l-blue-400'
          } rounded-lg shadow-2xl overflow-hidden`}
        >
          {/* Progress bar */}
          <div
            className={`h-0.5 ${getBarColor(toast.type)} opacity-60`}
            style={{
              animation: `toast-progress ${TOAST_DURATION}ms linear forwards`,
            }}
          />
          <div className="flex items-start gap-3 p-4">
            <div className="flex-shrink-0 mt-0.5">{getIcon(toast.type)}</div>
            <p className="flex-1 text-sm text-slate-200">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
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
