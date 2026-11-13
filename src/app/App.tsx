import { Sentry } from '@/lib/sentry';
import { Providers } from './providers';
import { AppRouter } from './router';

export const App = () => (
  <Sentry.ErrorBoundary fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-lg text-red-600">Something went wrong. Please refresh the page.</p></div>}>
    <Providers>
      <AppRouter />
    </Providers>
  </Sentry.ErrorBoundary>
);
