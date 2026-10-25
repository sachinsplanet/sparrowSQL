import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string | null;
}

/**
 * Last stop for a render crash. Without this, any throw inside a child — a bad
 * curriculum entry, a WASM boot failure surfacing during render — unmounts the
 * whole tree and the learner stares at a blank page with no way back. Here they get
 * a plain explanation and a refresh, and the rest of the app stays mounted.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("sparrowsql crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="m-6 rounded-[18px] border border-[color:var(--danger)]/40 bg-surface p-6"
        >
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-ink">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-muted">
            sparrowsql hit a problem it could not recover from. Refresh the page to start
            again — your progress is saved in this browser and will still be here.
          </p>
          {this.state.message && (
            <pre className="mt-3 overflow-auto rounded-[10px] bg-[var(--bg-deep)] p-3 font-mono text-[12px] leading-[1.6] text-faint">
              {this.state.message}
            </pre>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-[color:var(--accent-ink)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Reload application
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem("sparrowsql-progress-v1");
                  localStorage.removeItem("sparrowsql-book-v1");
                } catch {
                  /* ignore */
                }
                window.location.reload();
              }}
              className="rounded-full border border-line px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              Reset local session
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
