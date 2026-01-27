import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fromTable } from '@/lib/supabase-helpers';
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  TrendingUp, 
  BarChart3,
  Eye,
  UserCheck,
  Clock
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Course, Profile } from '@/types/database';

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalEnrollments: number;
  activeInstructors: number;
}

interface CourseWithEnrollments extends Course {
  enrollment_count?: number;
  instructor?: Profile;
}

export default function AdminDashboard() {
  const { orgId } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [courses, setCourses] = useState<CourseWithEnrollments[]>([]);
  const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (orgId) {
      fetchAdminData();
    }
  }, [orgId]);

  const fetchAdminData = async () => {
    try {
      const [usersResult, coursesResult, enrollmentsResult, instructorsResult] = await Promise.all([
        fromTable('profiles').select('*').eq('org_id', orgId).order('created_at', { ascending: false }).limit(10),
        fromTable('courses').select('*').eq('org_id', orgId).order('created_at', { ascending: false }),
        fromTable('enrollments').select('*, course:courses(org_id)'),
        fromTable('user_roles').select('user_id').eq('org_id', orgId).eq('role', 'instructor'),
      ]);

      const allCourses = coursesResult.data || [];
      const allEnrollments = enrollmentsResult.data || [];
      
      // Filter enrollments for this org
      const orgEnrollments = allEnrollments.filter((e: any) => e.course?.org_id === orgId);

      setStats({
        totalUsers: usersResult.data?.length || 0,
        totalCourses: allCourses.length,
        publishedCourses: allCourses.filter(c => c.status === 'published').length,
        draftCourses: allCourses.filter(c => c.status === 'draft').length,
        totalEnrollments: orgEnrollments.length,
        activeInstructors: instructorsResult.data?.length || 0,
      });

      // Add enrollment counts to courses
      const coursesWithEnrollments = allCourses.map(course => ({
        ...course,
        enrollment_count: orgEnrollments.filter((e: any) => e.course_id === course.id).length,
      }));

      setCourses(coursesWithEnrollments.slice(0, 10));
      setRecentUsers(usersResult.data || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statusColors = {
    draft: 'bg-warning/10 text-warning',
    published: 'bg-success/10 text-success',
    archived: 'bg-muted text-muted-foreground',
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor platform activity and manage your organization.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total Users" 
            value={stats?.totalUsers} 
            icon={<Users className="h-5 w-5" />} 
            isLoading={isLoading} 
          />
          <StatCard 
            title="Total Courses" 
            value={stats?.totalCourses} 
            icon={<BookOpen className="h-5 w-5" />} 
            isLoading={isLoading} 
          />
          <StatCard 
            title="Enrollments" 
            value={stats?.totalEnrollments} 
            icon={<GraduationCap className="h-5 w-5" />} 
            isLoading={isLoading} 
          />
          <StatCard 
            title="Instructors" 
            value={stats?.activeInstructors} 
            icon={<UserCheck className="h-5 w-5" />} 
            isLoading={isLoading} 
          />
        </div>

        {/* Course Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Course Analytics
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
                <p className="text-sm text-muted-foreground">Drafts</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-display font-bold text-warning">{stats?.draftCourses || 0}</p>
                )}
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">Total Enrollments</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-display font-bold text-primary">{stats?.totalEnrollments || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* All Courses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-display">All Courses</CardTitle>
                <CardDescription>Courses in your organization</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/courses">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : courses.length > 0 ? (
                <div className="space-y-3">
                  {courses.slice(0, 5).map(course => (
                    <div key={course.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{course.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {course.enrollment_count || 0} enrolled
                        </p>
                      </div>
                      <Badge variant="outline" className={statusColors[course.status]}>
                        {course.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No courses yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-display">Recent Users</CardTitle>
                <CardDescription>Latest users in your organization</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/users">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : recentUsers.length > 0 ? (
                <div className="space-y-3">
                  {recentUsers.slice(0, 5).map(user => (
                    <div key={user.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-medium">
                        {user.full_name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No users yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Quick Actions</CardTitle>
            <CardDescription>Manage your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <QuickAction 
                href="/admin/courses" 
                icon={<BookOpen className="h-5 w-5" />} 
                title="Manage Courses" 
                description="View and manage all courses" 
              />
              <QuickAction 
                href="/admin/users" 
                icon={<Users className="h-5 w-5" />} 
                title="Manage Users" 
                description="View and manage all users" 
              />
              <QuickAction 
                href="/org/overview" 
                icon={<TrendingUp className="h-5 w-5" />} 
                title="Organization Overview" 
                description="View org stats and analytics" 
              />
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

function QuickAction({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <Link
      to={href}
      className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
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
