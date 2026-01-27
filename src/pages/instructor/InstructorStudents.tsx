import AppLayout from '@/layouts/AppLayout';
import { BatchStudentList } from '@/components/instructor/BatchStudentList';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function InstructorStudents() {
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
          <h1 className="text-3xl font-bold">My Students</h1>
          <p className="text-muted-foreground">View and manage students across your batches</p>
        </div>
        <BatchStudentList />
      </div>
    </AppLayout>
  );
}
