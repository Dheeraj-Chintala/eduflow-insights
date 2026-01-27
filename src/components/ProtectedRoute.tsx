import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import type { AppRole } from '@/types/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  requiredPermission?: string;
}

// Role hierarchy for redirect priority
const ROLE_PRIORITY: { role: AppRole; path: string }[] = [
  { role: 'super_admin', path: '/admin/dashboard' },
  { role: 'admin', path: '/admin/dashboard' },
  { role: 'sub_admin', path: '/admin/dashboard' },
  { role: 'trainer', path: '/instructor/dashboard' },
  { role: 'mentor', path: '/instructor/dashboard' },
  { role: 'corporate_hr', path: '/manager/dashboard' },
  { role: 'super_distributor', path: '/dashboard' },
  { role: 'franchise', path: '/dashboard' },
  { role: 'distributor', path: '/dashboard' },
  { role: 'affiliate', path: '/dashboard' },
  { role: 'student', path: '/dashboard' },
];

function getDefaultPathForRoles(userRoles: AppRole[]): string {
  for (const { role, path } of ROLE_PRIORITY) {
    if (userRoles.includes(role)) {
      return path;
    }
  }
  return '/dashboard';
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, roles } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if allowedRoles specified
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some(role => roles.includes(role));
    if (!hasRequiredRole) {
      // Redirect to appropriate dashboard based on user's actual roles
      const redirectPath = getDefaultPathForRoles(roles);
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
}
