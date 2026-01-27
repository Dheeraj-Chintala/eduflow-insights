import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fromTable } from '@/lib/supabase-helpers';
import { BookOpen, Users, GraduationCap, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface OrgStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  publishedCourses: number;
  draftCourses: number;
  archivedCourses: number;
}

export default function OrgOverview() {
  const { orgId } = useAuth();
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (orgId) {
      fetchOrgStats();
    }
  }, [orgId]);

  const fetchOrgStats = async () => {
    try {
      const [usersResult, coursesResult, enrollmentsResult] = await Promise.all([
        fromTable('profiles').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
        fromTable('courses').select('status').eq('org_id', orgId),
        fromTable('enrollments').select('*', { count: 'exact', head: true }),
      ]);

      const courses = coursesResult.data || [];
      
      setStats({
        totalUsers: usersResult.count || 0,
        totalCourses: courses.length,
        totalEnrollments: enrollmentsResult.count || 0,
        publishedCourses: courses.filter(c => c.status === 'published').length,
        draftCourses: courses.filter(c => c.status === 'draft').length,
        archivedCourses: courses.filter(c => c.status === 'archived').length,
      });
    } catch (error) {
      console.error('Error fetching org stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Organization Overview</h1>
          <p className="text-muted-foreground mt-1">
            High-level statistics for your organization (read-only)
          </p>
        </div>

        {/* Main Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers}
            icon={<Users className="h-6 w-6" />}
            isLoading={isLoading}
          />
          <StatCard
            title="Total Courses"
            value={stats?.totalCourses}
            icon={<BookOpen className="h-6 w-6" />}
            isLoading={isLoading}
          />
          <StatCard
            title="Total Enrollments"
            value={stats?.totalEnrollments}
            icon={<GraduationCap className="h-6 w-6" />}
            isLoading={isLoading}
          />
        </div>

        {/* Course Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Course Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm text-muted-foreground">Published</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-display font-bold text-success">{stats?.publishedCourses || 0}</p>
                )}
              </div>
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm text-muted-foreground">Draft</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-display font-bold text-warning">{stats?.draftCourses || 0}</p>
                )}
              </div>
              <div className="p-4 rounded-lg bg-muted border border-border">
                <p className="text-sm text-muted-foreground">Archived</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-display font-bold text-muted-foreground">{stats?.archivedCourses || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function StatCard({ title, value, icon, isLoading }: { title: string; value: number | undefined; icon: React.ReactNode; isLoading: boolean }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-3xl font-display font-bold mt-1">{value ?? 0}</p>
            )}
          </div>
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
