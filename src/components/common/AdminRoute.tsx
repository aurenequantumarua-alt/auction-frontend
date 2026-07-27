import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';

interface AdminRouteProps {
  children?: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, hydrating } = useAuthStore();

  if (hydrating) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
