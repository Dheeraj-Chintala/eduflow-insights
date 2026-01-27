import AppLayout from '@/layouts/AppLayout';
import { LiveClassScheduler } from '@/components/instructor/LiveClassScheduler';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function InstructorLiveClasses() {
  const { primaryRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  const instructorRoles = ['trainer', 'mentor', 'admin', 'super_admin'];
  if (!primaryRole || !instructorRoles.includes(primaryRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Live Classes</h1>
          <p className="text-muted-foreground">Schedule and manage your live sessions</p>
        </div>
        <LiveClassScheduler />
      </div>
    </AppLayout>
  );
}
