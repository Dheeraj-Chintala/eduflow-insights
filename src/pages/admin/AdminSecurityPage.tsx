import AppLayout from '@/layouts/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import AdminSecurityDashboard from '@/components/security/AdminSecurityDashboard';

export default function AdminSecurityPage() {
  const { isLoading, primaryRole } = useAuth();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!primaryRole || !['super_admin', 'admin'].includes(primaryRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AppLayout>
      <AdminSecurityDashboard />
    </AppLayout>
  );
}
