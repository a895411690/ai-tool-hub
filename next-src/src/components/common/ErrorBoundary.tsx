'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-red-400" />
          <div>
            <p className="font-medium text-white/80">出了点问题</p>
            <p className="mt-1 text-sm text-white/40">{this.state.error?.message || '页面加载失败'}</p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/15"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
