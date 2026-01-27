import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, PlusCircle, FileText, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { fromTable } from '@/lib/supabase-helpers';
import type { Course } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';

interface InstructorStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
}

export default function InstructorDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<InstructorStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInstructorData();
  }, []);

  const fetchInstructorData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verify user has instructor role
      const { data: instructorRole } = await fromTable('user_roles')
        .select('id')
        .eq('user_id', user.id)
        // .in('role', ['instructor', 'content_creator', 'org_admin', 'super_admin'])
        .eq('role', 'trainer')

        .maybeSingle();

      if (!instructorRole) {
        setIsLoading(false);
        return;
      }

      // Fetch instructor's courses
      const { data: coursesData, error: coursesError } = await fromTable('courses')
        .select('*')
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      const instructorCourses = coursesData || [];
      setCourses(instructorCourses);

      // Calculate stats from courses
      const published = instructorCourses.filter(c => c.status === 'published').length;
      const drafts = instructorCourses.filter(c => c.status === 'draft').length;

      setStats({
        totalCourses: instructorCourses.length,
        publishedCourses: published,
        draftCourses: drafts,
      });
    } catch (error) {
      console.error('Error fetching instructor data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Instructor'}!
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your courses and track student progress.
          </p>
        </div>

        {/* Stats Cards - Three in a row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard 
            title="My Courses" 
            value={stats?.totalCourses} 
            icon={<BookOpen className="h-5 w-5" />}
            isLoading={isLoading}
          />
          <StatCard 
            title="Published" 
            value={stats?.publishedCourses} 
            icon={<CheckCircle className="h-5 w-5" />}
            isLoading={isLoading}
          />
          <StatCard 
            title="Drafts" 
            value={stats?.draftCourses} 
            icon={<FileText className="h-5 w-5" />}
            isLoading={isLoading}
          />
        </div>

        {/* Main Content Grid - Two cards side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Courses Card */}
          <Card className="bg-card border border-border rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">My Courses</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : courses.length > 0 ? (
                <div className="space-y-2">
                  {courses.slice(0, 5).map(course => (
                    <CourseListItem key={course.id} course={course} />
                  ))}
                  {courses.length > 5 && (
                    <Link 
                      to="/instructor/courses" 
                      className="block text-center text-sm text-primary hover:underline pt-2"
                    >
                      View all courses →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">No courses yet</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Create your first course to get started
                  </p>
                  <Link
                    to="/instructor/courses/create"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Create Course
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="bg-card border border-border rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <QuickActionButton 
                href="/instructor/courses/create" 
                icon={<PlusCircle className="h-5 w-5" />} 
                title="Create Course" 
              />
              <QuickActionButton 
                href="/instructor/courses" 
                icon={<BookOpen className="h-5 w-5" />} 
                title="My Courses" 
                subtitle="View and edit your courses"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ title, value, icon, isLoading }: { 
  title: string; 
  value: number | undefined; 
  icon: React.ReactNode;
  isLoading: boolean;
}) {
  return (
    <Card className="bg-card border border-border rounded-xl shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-12 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-foreground mt-1">{value ?? 0}</p>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CourseListItem({ course }: { course: Course }) {
  const statusConfig = {
    draft: { label: 'Draft', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    published: { label: 'Published', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    archived: { label: 'Archived', className: 'bg-muted text-muted-foreground' },
  };

  const status = statusConfig[course.status] || statusConfig.draft;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <BookOpen className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{course.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {course.category || 'Uncategorized'}
        </p>
      </div>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}>
        {status.label}
      </span>
    </div>
  );
}

function QuickActionButton({ href, icon, title, subtitle }: { 
  href: string; 
  icon: React.ReactNode; 
  title: string;
  subtitle?: string;
}) {
  return (
    <Link
      to={href}
      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
    >
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </Link>
  );
}