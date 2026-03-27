import React, { useRef, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ConfirmInlineProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  isPending?: boolean;
}

export const ConfirmInline: React.FC<ConfirmInlineProps> = ({
  message,
  onConfirm,
  onCancel,
  confirmLabel = '确认',
  confirmVariant = 'danger',
  isPending = false,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isPending) cancelRef.current?.focus();
  }, [isPending]);

  return (
    <div
      role="alertdialog"
      aria-live="polite"
      aria-label="请确认此操作"
      className="flex items-center gap-3 p-3 bg-dark rounded-xl border border-red-500/20 animate-fade-in"
    >
      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="w-4 h-4 text-red-400" />
      </div>
      <p className="text-sm text-slate-300 flex-1">{message}</p>
      <div className="flex gap-2 flex-shrink-0">
        <button
          ref={cancelRef}
          onClick={onCancel}
          disabled={isPending}
          onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-dark-lighter rounded-lg hover:bg-dark-border transition-colors disabled:opacity-50"
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          disabled={isPending}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onConfirm(); }}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
            confirmVariant === 'danger'
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-primary/20 text-primary hover:bg-primary/30'
          }`}
        >
          {isPending ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin" />
              {confirmLabel === '确认' ? '处理中...' : confirmLabel + '中...'}
            </>
          ) : (
            confirmLabel
          )}
        </button>
      </div>
    </div>
  );
};
