import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  // Incrementing this key forces React to unmount + remount the child tree on
  // "Try again", so the component can re-initialize cleanly instead of
  // immediately re-throwing the same error.
  resetKey: number;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetKey: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Surface errors to the browser console so they're visible in DevTools.
    // Replace this with an error-monitoring service (e.g. Sentry) when available.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState((s) => ({ hasError: false, resetKey: s.resetKey + 1 }));
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen flex items-center justify-center p-8 text-center">
          <div className="space-y-3">
            <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">Please refresh the page to try again.</p>
            <button
              onClick={this.handleReset}
              className="text-sm text-primary underline"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    // The key prop ensures the entire child subtree is remounted after a reset,
    // giving all child components a clean initial state.
    return (
      <div key={this.state.resetKey} style={{ display: 'contents' }}>
        {this.props.children}
      </div>
    );
  }
}
