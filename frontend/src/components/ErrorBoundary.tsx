import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, copied: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, copied: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, copied: false });
    window.location.reload();
  };

  handleCopy = () => {
    const { error } = this.state;
    if (!error) return;
    const text = `${error.message}\n${error.stack || ''}`;
    navigator.clipboard.writeText(text).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-dark flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold mb-3">出了点问题</h1>
            <p className="text-slate-500 mb-6">
              抱歉，页面加载时遇到了错误。请尝试刷新页面。
            </p>
            {this.state.error && (
              <details className="text-left mb-6 p-4 bg-dark-lighter rounded-lg">
                <summary className="text-sm text-slate-400 cursor-pointer mb-2">
                  错误详情
                </summary>
                <pre className="text-xs text-red-400 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="btn-primary flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                刷新页面
              </button>
              {this.state.error && (
                <button
                  onClick={this.handleCopy}
                  className={`btn-secondary flex items-center gap-2 ${this.state.copied ? '!border-green-500/50 !text-green-400' : ''}`}
                >
                  {this.state.copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {this.state.copied ? '已复制' : '复制错误'}
                </button>
              )}
              <Link to="/" className="btn-secondary flex items-center gap-2">
                <Home className="w-4 h-4" />
                返回首页
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
