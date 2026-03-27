import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, ArrowLeft, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-bold mb-2">页面加载失败</h2>
            <p className="text-slate-500 mb-4">抱歉，内容加载时遇到了问题</p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mt-4 p-3 bg-dark rounded-lg border border-dark-border mb-4">
                <summary className="text-xs text-slate-500 cursor-pointer mb-2 select-none">错误详情 (dev only)</summary>
                <pre className="text-[10px] text-red-400 overflow-auto max-h-32 whitespace-pre-wrap">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack?.split('\n').slice(0, 4).join('\n')}
                </pre>
              </details>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={() => window.history.back()}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> 返回上一页
              </button>
              <button
                onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> 刷新页面
              </button>
              <Link to="/" className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors py-1">
                <Home className="w-4 h-4" /> 回到首页
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
