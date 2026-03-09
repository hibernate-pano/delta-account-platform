import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Loading: React.FC<LoadingProps> = ({ text = '加载中...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className={`${sizeClasses[size]} text-primary animate-spin mb-4`} />
      <p className="text-gray-500">{text}</p>
    </div>
  );
};

interface EmptyProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    text: string;
    onClick: () => void;
  };
}

export const Empty: React.FC<EmptyProps> = ({ 
  icon, 
  title = '暂无数据', 
  description, 
  action 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-gray-600">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-400 mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
      {action && (
        <button onClick={action.onClick} className="btn-primary">
          {action.text}
        </button>
      )}
    </div>
  );
};

interface ErrorProps {
  message?: string;
  onRetry?: () => void;
}

export const Error: React.FC<ErrorProps> = ({ 
  message = '出错了，请稍后重试', 
  onRetry 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-gray-400 mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          重试
        </button>
      )}
    </div>
  );
};
