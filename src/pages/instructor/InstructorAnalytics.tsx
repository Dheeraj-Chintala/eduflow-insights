import AppLayout from '@/layouts/AppLayout';
import { InstructorStatsCards } from '@/components/instructor/InstructorStatsCards';
import { InstructorRevenueView } from '@/components/instructor/InstructorRevenueView';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { InstructorStats } from '@/types/instructor';

export default function InstructorAnalytics() {
  const { user, primaryRole, isLoading: authLoading } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['instructor-stats', user?.id],
    queryFn: async (): Promise<InstructorStats> => {
      if (!user?.id) throw new Error('Not authenticated');

      const [
        coursesResult,
        batchesResult,
        enrollmentsResult,
        liveClassesResult,
        assignmentsResult
      ] = await Promise.all([
        supabase.from('courses').select('id, status').eq('instructor_id', user.id),
        supabase.from('course_batches').select('id, status, course_id'),
        supabase.from('enrollments').select('id, progress, course_id'),
        supabase.from('live_classes').select('id, status, scheduled_at').eq('instructor_id', user.id),
        supabase.from('assignment_submissions').select('id, status, assignment_id')
      ]);

      const courses = coursesResult.data || [];
      const courseIds = courses.map(c => c.id);
      
      const batches = (batchesResult.data || []).filter(b => courseIds.includes(b.course_id));
      const enrollments = (enrollmentsResult.data || []).filter(e => courseIds.includes(e.course_id));
      const liveClasses = liveClassesResult.data || [];
      
      const pendingSubmissions = (assignmentsResult.data || []).filter(s => s.status === 'submitted');
      const completedEnrollments = enrollments.filter(e => e.progress >= 100);

      return {
        totalCourses: courses.length,
        publishedCourses: courses.filter(c => c.status === 'published').length,
        draftCourses: courses.filter(c => c.status === 'draft').length,
        totalEnrollments: enrollments.length,
        activeBatches: batches.filter(b => b.status === 'active').length,
        upcomingClasses: liveClasses.filter(c => c.status === 'scheduled' && new Date(c.scheduled_at) > new Date()).length,
        pendingAssignments: pendingSubmissions.length,
        completionRate: enrollments.length > 0 
          ? Math.round((completedEnrollments.length / enrollments.length) * 100) 
          : 0
      };
    },
    enabled: !!user?.id,
  });

  const { data: instructorSettings } = useQuery({
    queryKey: ['instructor-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('instructor_settings')
        .select('*')
        .eq('instructor_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  if (authLoading) {
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
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your teaching performance and student progress</p>
        </div>
        <InstructorStatsCards stats={stats || null} isLoading={statsLoading} />
        
        {instructorSettings?.show_revenue && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Revenue Overview</h2>
            <InstructorRevenueView />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
