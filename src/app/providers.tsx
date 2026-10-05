import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect, useRef } from 'react';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/features/auth/authStore';
import { authApi } from '@/features/auth/api';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useRealtimeBridge } from './useRealtimeBridge';

const SessionBootstrap = ({ children }: { children: ReactNode }) => {
  const setSession = useAuthStore((s) => s.setSession);
  const clear = useAuthStore((s) => s.clear);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const didRun = useRef(false);

  useEffect(() => {
    // Guard against StrictMode double-fire.
    if (didRun.current) return;
    didRun.current = true;

    // If we already have a persisted accessToken + user, no need to refresh.
    if (accessToken && user) return;

    // Try to silently refresh using the httpOnly cookie.
    (async () => {
      const result = await authApi.refresh();
      if (result) {
        setSession({ user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken });
      } else {
        clear();
      }
    })();
  }, [setSession, clear, accessToken, user]);

  useRealtimeBridge();
  return <>{children}</>;
};

export const Providers = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <SessionBootstrap>{children}</SessionBootstrap>
    </ErrorBoundary>
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#FAFAF7',
          color: '#111111',
          border: '1px solid #E8E5DD',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
      }}
    />
  </QueryClientProvider>
);
