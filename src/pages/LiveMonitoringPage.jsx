import React, { Component } from 'react';
import { CCTVCommandCenter } from '../components/live/CCTVCommandCenter';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class LiveMonitoringErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[LiveMonitoringPage ErrorBoundary]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-surface rounded-xl border border-red-500/30 text-center space-y-4 shadow-sm m-4">
          <div className="p-3 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary uppercase tracking-tight">
              LIVE MONITORING SYSTEM RECOVERY
            </h2>
            <p className="text-xs text-text-muted mt-1 max-w-md">
              A runtime rendering error occurred in the CCTV command module.
              The application preserved system stability.
            </p>
            {this.state.error?.message && (
              <div className="mt-2 p-2 bg-slate-900 text-rose-400 font-mono text-[11px] rounded border border-slate-800 max-w-lg mx-auto overflow-x-auto select-all">
                {this.state.error.message}
              </div>
            )}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors shadow-xs"
          >
            <RefreshCw className="w-3 h-3" />
            Reload Live Monitoring Deck
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function LiveMonitoringPage() {
  return (
    <LiveMonitoringErrorBoundary>
      <CCTVCommandCenter />
    </LiveMonitoringErrorBoundary>
  );
}

export default LiveMonitoringPage;
