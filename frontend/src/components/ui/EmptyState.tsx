import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface EmptyAction {
  label: string;
  onClick?: () => void;
  to?: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary';
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: EmptyAction[];
  /** SVG viewBox for custom illustrations, rendered in a 128x128 container */
  svgIllustration?: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'error';
  className?: string;
}

const glowColors: Record<string, string> = {
  neutral: 'rgba(99,102,241,0.08)',
  success: 'rgba(34,197,94,0.08)',
  warning: 'rgba(234,179,8,0.08)',
  error: 'rgba(239,68,68,0.08)',
};

const borderColors: Record<string, string> = {
  neutral: 'border-primary/10',
  success: 'border-green-500/10',
  warning: 'border-amber-500/10',
  error: 'border-red-500/10',
};

const iconColors: Record<string, string> = {
  neutral: 'text-slate-700',
  success: 'text-green-500/60',
  warning: 'text-amber-500/60',
  error: 'text-red-400',
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actions,
  svgIllustration,
  variant = 'neutral',
  className = '',
}) => {
  return (
    <div className={`text-center py-16 animate-fade-in ${className}`}>
      <div className="relative w-24 h-24 mx-auto mb-6">
        {svgIllustration ? (
          <div className="w-full h-full">{svgIllustration}</div>
        ) : (
          <>
            <div
              className="absolute inset-0 rounded-full blur-xl"
              style={{ background: glowColors[variant] }}
            />
            <div
              className={`relative w-full h-full bg-dark-lighter rounded-2xl flex items-center justify-center border ${borderColors[variant]} animate-float`}
            >
              <Icon className={`w-10 h-10 ${iconColors[variant]}`} />
            </div>
          </>
        )}
      </div>

      <h3 className="text-lg font-bold mb-2 text-slate-400">{title}</h3>
      {description && (
        <p className="text-slate-600 text-sm mb-6 max-w-xs mx-auto leading-relaxed whitespace-pre-line">
          {description}
        </p>
      )}
      {actions && actions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
          {actions.map((action, i) => {
            const Icon2 = action.icon;
            if (action.to) {
              return (
                <Link
                  key={i}
                  to={action.to}
                  className={action.variant === 'secondary' ? 'btn-secondary text-sm hover:scale-105 active:scale-95' : 'btn-primary text-sm hover:scale-105 active:scale-95'}
                >
                  {Icon2 && <Icon2 className="w-4 h-4" />}
                  {action.label}
                </Link>
              );
            }
            return (
              <button
                key={i}
                onClick={action.onClick}
                className={action.variant === 'secondary' ? 'btn-secondary text-sm hover:scale-105 active:scale-95' : 'btn-primary text-sm hover:scale-105 active:scale-95'}
              >
                {Icon2 && <Icon2 className="w-4 h-4" />}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
