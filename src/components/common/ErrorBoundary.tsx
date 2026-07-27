import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface State {
  error: Error | null;
}

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // In production this would forward to Sentry / Datadog / etc.
    console.error('ErrorBoundary caught:', error, info);
  }

  reset = () => this.setState({ error: null });

  override render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <p className="kicker mb-3">Something broke</p>
          <h2 className="font-display text-3xl font-semibold text-ink">Unexpected error</h2>
          <p className="mt-2 max-w-md text-sm text-muted">
            We&apos;ve logged the issue. You can try again or head back to the home page.
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" onClick={this.reset}>Try again</Button>
            <Button onClick={() => (window.location.href = '/')}>Go home</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
