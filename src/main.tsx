import React, { StrictMode, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertTriangle, RefreshCw, Terminal, ShieldAlert } from 'lucide-react';
import App from './App';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error captured by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleSafeReset = () => {
    try {
      const backupKeys = [
        "characters",
        "archive_items",
        "mediaCategories",
        "databaseFolders",
        "moodBoardItems",
      ];
      const backupData: Record<string, string | null> = {};
      backupKeys.forEach((k) => {
        backupData[k] = localStorage.getItem(k);
      });
      sessionStorage.setItem("emergency_backup_state", JSON.stringify(backupData));
    } catch (e) {
      console.warn("Could not save emergency session backup:", e);
    }

    try {
      localStorage.removeItem("activeCategory");
      localStorage.removeItem("activeMediaTab");
      localStorage.removeItem("activeNavView");
    } catch (e) {
      // ignore
    }

    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="max-w-2xl w-full bg-slate-900/90 border border-red-500/40 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-4 text-red-400 mb-4">
              <div className="p-3 bg-red-950/70 border border-red-500/30 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-red-400 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Application Recovered from Unexpected State</h1>
                <p className="text-sm text-slate-400">The interface prevented a blank white screen and preserved your session safely.</p>
              </div>
            </div>

            <div className="mt-6 bg-slate-950/80 border border-slate-800 rounded-xl p-4 font-mono text-xs text-red-300/90 overflow-x-auto max-h-48 scrollbar-thin">
              <p className="font-semibold text-red-400 mb-1">
                {this.state.error?.name || "Runtime Error"}: {this.state.error?.message || "Unknown error occurred"}
              </p>
              {this.state.error?.stack && (
                <pre className="text-slate-400 whitespace-pre-wrap text-[11px] leading-relaxed">
                  {this.state.error.stack.split("\n").slice(0, 8).join("\n")}
                </pre>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={this.handleReload}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload App
                </button>
                <button
                  onClick={this.handleSafeReset}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition-all border border-slate-700 active:scale-95 text-xs cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Safe Mode Refresh
                </button>
              </div>
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" /> Armstech Database Safe Guard
              </span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

