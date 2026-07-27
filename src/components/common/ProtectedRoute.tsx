import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import { type ReactNode } from 'react';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const user = useAuthStore((s) => s.user);
  const hydrating = useAuthStore((s) => s.hydrating);
  const location = useLocation();

  if (hydrating) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm text-muted">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
