import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmInlineProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
}

export const ConfirmInline: React.FC<ConfirmInlineProps> = ({
  message,
  onConfirm,
  onCancel,
  confirmLabel = '确认',
  confirmVariant = 'danger',
}) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-dark rounded-xl border border-red-500/20 animate-fade-in">
      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="w-4 h-4 text-red-400" />
      </div>
      <p className="text-sm text-slate-300 flex-1">{message}</p>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-dark-lighter rounded-lg hover:bg-dark-border transition-colors"
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
            confirmVariant === 'danger'
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-primary/20 text-primary hover:bg-primary/30'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
};
