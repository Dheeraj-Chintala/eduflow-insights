import AppLayout from '@/layouts/AppLayout';
import { AssignmentManager } from '@/components/instructor/AssignmentManager';
import { SubmissionGrader } from '@/components/instructor/SubmissionGrader';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function InstructorAssignments() {
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
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">Create assignments and grade submissions</p>
        </div>
        <Tabs defaultValue="manage" className="w-full">
          <TabsList>
            <TabsTrigger value="manage">Manage Assignments</TabsTrigger>
            <TabsTrigger value="grade">Grade Submissions</TabsTrigger>
          </TabsList>
          <TabsContent value="manage" className="mt-6">
            <AssignmentManager />
          </TabsContent>
          <TabsContent value="grade" className="mt-6">
            <SubmissionGrader />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
