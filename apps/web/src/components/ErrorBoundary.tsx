import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Terminal, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-6">
            <div className="inline-flex p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full mb-4 animate-pulse">
              <Terminal size={48} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">System Exception Detected</h1>
            <p className="text-white/40 text-sm leading-relaxed">
              We encountered an unhandled error while accessing your snippet stack.
              The interface has been halted to prevent data corruption.
            </p>
            <div className="p-4 bg-white/5 border border-white/5 rounded-xl font-mono text-[10px] text-left overflow-x-auto text-white/30">
              {this.state.error?.message}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-white text-black text-sm font-bold rounded-xl flex items-center gap-2 hover:bg-white/90 active:scale-95 transition-all mx-auto"
            >
              <RefreshCw size={18} />
              Reboot Interface
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
