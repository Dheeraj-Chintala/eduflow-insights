import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fromTable } from '@/lib/supabase-helpers';
import { BookOpen, Users, GraduationCap, Clock, TrendingUp, Award, PlusCircle, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Course, Enrollment } from '@/types/database';

interface DashboardStats {
  totalCourses: number;
  enrolledCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalUsers?: number;
  totalEnrollments?: number;
  myCourses?: number;
}

export default function Dashboard() {
  const { profile, primaryRole, orgId, hasRole } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = hasRole('super_admin') || hasRole('admin') || hasRole('sub_admin');
  const isTrainer = hasRole('trainer') || hasRole('mentor');
  const isLearner = hasRole('student') || hasRole('corporate_hr');

  useEffect(() => {
    if (orgId) {
      fetchDashboardData();
    }
  }, [orgId, primaryRole]);

  const fetchDashboardData = async () => {
    try {
      let statsData: DashboardStats = {
        totalCourses: 0,
        enrolledCourses: 0,
        completedCourses: 0,
        inProgressCourses: 0,
      };

      if (isAdmin) {
        // Admin: fetch org-wide stats
        const [coursesResult, usersResult, enrollmentsResult] = await Promise.all([
          fromTable('courses').select('*', { count: 'exact' }).eq('org_id', orgId),
          fromTable('profiles').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
          fromTable('enrollments').select('*', { count: 'exact' }),
        ]);

        statsData = {
          ...statsData,
          totalCourses: coursesResult.count || 0,
          totalUsers: usersResult.count || 0,
          totalEnrollments: enrollmentsResult.count || 0,
        };

        setRecentCourses(coursesResult.data?.slice(0, 5) || []);

      } else if (isTrainer) {
        // Trainer: fetch my courses
        const { data: myCourses, count: myCoursesCount } = await fromTable('courses')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        statsData.myCourses = myCoursesCount || 0;
        statsData.totalCourses = myCoursesCount || 0;
        setRecentCourses(myCourses?.slice(0, 5) || []);

      } else {
        // Learner/Other: fetch enrollments and available courses
        const [enrollmentsResult, coursesResult] = await Promise.all([
          fromTable('enrollments').select('*, course:courses(*)'),
          fromTable('courses').select('*', { count: 'exact' }).eq('status', 'published'),
        ]);

        const userEnrollments = enrollmentsResult.data || [];
        const completedCount = userEnrollments.filter(e => e.completed_at !== null).length;

        statsData = {
          totalCourses: coursesResult.count || 0,
          enrolledCourses: userEnrollments.length,
          completedCourses: completedCount,
          inProgressCourses: userEnrollments.length - completedCount,
        };

        setEnrollments(userEnrollments);
        setRecentCourses(coursesResult.data?.slice(0, 5) || []);
      }

      setStats(statsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">
            {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin 
              ? "Here's an overview of your organization."
              : isTrainer
              ? "Manage your courses and create new content."
              : "Continue your learning journey."}
          </p>
        </div>

        {/* Role-based Dashboard Content */}
        {isAdmin ? (
          <AdminDashboardContent stats={stats} recentCourses={recentCourses} isLoading={isLoading} />
        ) : isTrainer ? (
          <TrainerDashboardContent stats={stats} recentCourses={recentCourses} isLoading={isLoading} />
        ) : (
          <LearnerDashboardContent stats={stats} recentCourses={recentCourses} enrollments={enrollments} isLoading={isLoading} />
        )}
      </div>
    </AppLayout>
  );
}

// ==================== ADMIN DASHBOARD ====================
function AdminDashboardContent({ stats, recentCourses, isLoading }: { stats: DashboardStats | null; recentCourses: Course[]; isLoading: boolean }) {
  return (
    <>
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Users" value={stats?.totalUsers} icon={<Users className="h-5 w-5" />} isLoading={isLoading} />
        <StatCard title="Total Courses" value={stats?.totalCourses} icon={<BookOpen className="h-5 w-5" />} isLoading={isLoading} />
        <StatCard title="Total Enrollments" value={stats?.totalEnrollments} icon={<GraduationCap className="h-5 w-5" />} isLoading={isLoading} />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Recent Courses</CardTitle>
            <CardDescription>Latest courses in your organization</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingSkeleton count={3} />
            ) : recentCourses.length > 0 ? (
              <div className="space-y-3">
                {recentCourses.map(course => (
                  <CourseListItem key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <EmptyState icon={<BookOpen className="h-10 w-10" />} title="No courses yet" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Quick Actions</CardTitle>
            <CardDescription>Manage your organization</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <QuickAction href="/admin/dashboard" icon={<Building2 className="h-5 w-5" />} title="Admin Dashboard" description="View organization statistics" />
            <QuickAction href="/admin/courses" icon={<BookOpen className="h-5 w-5" />} title="All Courses" description="Browse and manage courses" />
            <QuickAction href="/admin/users" icon={<Users className="h-5 w-5" />} title="Users" description="View organization members" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// ==================== TRAINER DASHBOARD ====================
function TrainerDashboardContent({ stats, recentCourses, isLoading }: { stats: DashboardStats | null; recentCourses: Course[]; isLoading: boolean }) {
  const draftCourses = recentCourses.filter(c => c.status === 'draft').length;
  const publishedCourses = recentCourses.filter(c => c.status === 'published').length;

  return (
    <>
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="My Courses" value={stats?.myCourses} icon={<BookOpen className="h-5 w-5" />} isLoading={isLoading} />
        <StatCard title="Published" value={publishedCourses} icon={<TrendingUp className="h-5 w-5" />} isLoading={isLoading} />
        <StatCard title="Drafts" value={draftCourses} icon={<Clock className="h-5 w-5" />} isLoading={isLoading} />
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">My Courses</CardTitle>
            <CardDescription>Courses you've created</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingSkeleton count={3} />
            ) : recentCourses.length > 0 ? (
              <div className="space-y-3">
                {recentCourses.map(course => (
                  <CourseListItem key={course.id} course={course} showStatus />
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={<BookOpen className="h-10 w-10" />} 
                title="No courses yet"
                action={
                  <Button asChild className="bg-gradient-primary hover:opacity-90">
                    <Link to="/instructor/courses/create">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Your First Course
                    </Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Quick Actions</CardTitle>
            <CardDescription>Create and manage content</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <QuickAction href="/instructor/courses/create" icon={<PlusCircle className="h-5 w-5" />} title="Create Course" description="Build a new learning experience" />
            <QuickAction href="/instructor/courses" icon={<BookOpen className="h-5 w-5" />} title="My Courses" description="View and edit your courses" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// ==================== LEARNER DASHBOARD ====================
function LearnerDashboardContent({ stats, recentCourses, enrollments, isLoading }: { stats: DashboardStats | null; recentCourses: Course[]; enrollments: Enrollment[]; isLoading: boolean }) {
  return (
    <>
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Enrolled" value={stats?.enrolledCourses} icon={<BookOpen className="h-5 w-5" />} isLoading={isLoading} />
        <StatCard title="In Progress" value={stats?.inProgressCourses} icon={<Clock className="h-5 w-5" />} isLoading={isLoading} />
        <StatCard title="Completed" value={stats?.completedCourses} icon={<Award className="h-5 w-5" />} isLoading={isLoading} />
        <StatCard title="Available" value={stats?.totalCourses} icon={<GraduationCap className="h-5 w-5" />} isLoading={isLoading} />
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Continue Learning</CardTitle>
            <CardDescription>Pick up where you left off</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingSkeleton count={3} />
            ) : enrollments.length > 0 ? (
              <div className="space-y-3">
                {enrollments.slice(0, 4).map((enrollment: any) => (
                  <CourseListItem key={enrollment.id} course={enrollment.course} progress={enrollment.progress} />
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={<GraduationCap className="h-10 w-10" />} 
                title="No courses enrolled"
                action={
                  <Button asChild className="bg-gradient-primary hover:opacity-90">
                    <Link to="/courses">Browse Courses</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Quick Actions</CardTitle>
            <CardDescription>Continue your learning journey</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <QuickAction href="/my-learning" icon={<GraduationCap className="h-5 w-5" />} title="My Learning" description="View your enrolled courses" />
            <QuickAction href="/courses" icon={<BookOpen className="h-5 w-5" />} title="Browse Courses" description="Discover new courses" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// ==================== SHARED COMPONENTS ====================
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
              <p className="text-2xl font-display font-bold mt-1">{value ?? 0}</p>
            )}
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CourseListItem({ course, showStatus, progress }: { course: Course; showStatus?: boolean; progress?: number }) {
  const statusColors = {
    draft: 'bg-warning/10 text-warning',
    published: 'bg-success/10 text-success',
    archived: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
        <BookOpen className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{course.title}</p>
        <p className="text-sm text-muted-foreground truncate">
          {progress !== undefined ? `${progress}% complete` : course.category || 'Uncategorized'}
        </p>
      </div>
      {showStatus && (
        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[course.status]}`}>
          {course.status}
        </span>
      )}
    </div>
  );
}

function QuickAction({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <Link
      to={href}
      className="flex items-center gap-4 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
    >
      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <div>
        <p className="font-medium group-hover:text-primary transition-colors">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}

function EmptyState({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
        {icon}
      </div>
      <p className="font-medium mb-4">{title}</p>
      {action}
    </div>
  );
}

function LoadingSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
