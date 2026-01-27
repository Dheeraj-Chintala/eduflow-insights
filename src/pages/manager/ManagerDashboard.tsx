import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fromTable } from '@/lib/supabase-helpers';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Users, 
  FileText, 
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Course, Profile } from '@/types/database';

interface ManagerStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  pendingReviews: number;
  totalInstructors: number;
}

interface CourseWithInstructor extends Course {
  instructor?: Profile;
}

export default function ManagerDashboard() {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [courses, setCourses] = useState<CourseWithInstructor[]>([]);
  const [instructors, setInstructors] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (orgId) {
      fetchManagerData();
    }
  }, [orgId]);

  const fetchManagerData = async () => {
    try {
      const [coursesResult, instructorRolesResult, profilesResult] = await Promise.all([
        fromTable('courses').select('*').eq('org_id', orgId).order('created_at', { ascending: false }),
        fromTable('user_roles').select('user_id').eq('org_id', orgId).eq('role', 'instructor'),
        fromTable('profiles').select('*').eq('org_id', orgId),
      ]);

      const allCourses = coursesResult.data || [];
      const instructorIds = instructorRolesResult.data?.map((r: any) => r.user_id) || [];
      const allProfiles = profilesResult.data || [];
      
      // Get instructor profiles
      const instructorProfiles = allProfiles.filter(p => instructorIds.includes(p.user_id));

      // Attach instructor to courses
      const coursesWithInstructor = allCourses.map(course => ({
        ...course,
        instructor: allProfiles.find(p => p.user_id === course.instructor_id),
      }));

      setStats({
        totalCourses: allCourses.length,
        publishedCourses: allCourses.filter(c => c.status === 'published').length,
        draftCourses: allCourses.filter(c => c.status === 'draft').length,
        pendingReviews: allCourses.filter(c => c.status === 'draft').length,
        totalInstructors: instructorProfiles.length,
      });

      setCourses(coursesWithInstructor);
      setInstructors(instructorProfiles);
    } catch (error) {
      console.error('Error fetching manager data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (courseId: string, newStatus: 'published' | 'draft' | 'archived') => {
    setUpdatingId(courseId);
    try {
      const { error } = await fromTable('courses')
        .update({ status: newStatus })
        .eq('id', courseId);

      if (error) throw error;

      setCourses(courses.map(c => 
        c.id === courseId ? { ...c, status: newStatus } : c
      ));

      toast({
        title: 'Status Updated',
        description: `Course status changed to ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update course status.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const statusColors = {
    draft: 'bg-warning/10 text-warning',
    published: 'bg-success/10 text-success',
    archived: 'bg-muted text-muted-foreground',
  };

  const draftCourses = courses.filter(c => c.status === 'draft');
  const publishedCourses = courses.filter(c => c.status === 'published');

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage instructors, review courses, and generate reports.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total Courses" 
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
            title="Pending Review" 
            value={stats?.pendingReviews} 
            icon={<FileText className="h-5 w-5" />} 
            isLoading={isLoading}
            highlight
          />
          <StatCard 
            title="Instructors" 
            value={stats?.totalInstructors} 
            icon={<Users className="h-5 w-5" />} 
            isLoading={isLoading} 
          />
        </div>

        {/* Tabs for Courses */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">Pending Review ({draftCourses.length})</TabsTrigger>
            <TabsTrigger value="published">Published ({publishedCourses.length})</TabsTrigger>
            <TabsTrigger value="instructors">Instructors ({instructors.length})</TabsTrigger>
          </TabsList>

          {/* Pending Review Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Courses Pending Review</CardTitle>
                <CardDescription>Review and approve draft courses</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                  </div>
                ) : draftCourses.length > 0 ? (
                  <div className="space-y-4">
                    {draftCourses.map(course => (
                      <div key={course.id} className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{course.title}</p>
                          <p className="text-sm text-muted-foreground">
                            By {course.instructor?.full_name || 'Unknown'} • {course.category || 'Uncategorized'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(course.id, 'published')}
                            disabled={updatingId === course.id}
                          >
                            {updatingId === course.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() => handleUpdateStatus(course.id, 'archived')}
                            disabled={updatingId === course.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No courses pending review</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Published Tab */}
          <TabsContent value="published">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Published Courses</CardTitle>
                <CardDescription>All active courses in the platform</CardDescription>
              </CardHeader>
              <CardContent>
                {publishedCourses.length > 0 ? (
                  <div className="space-y-3">
                    {publishedCourses.map(course => (
                      <div key={course.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{course.title}</p>
                          <p className="text-sm text-muted-foreground">
                            By {course.instructor?.full_name || 'Unknown'}
                          </p>
                        </div>
                        <Badge variant="outline" className={statusColors[course.status]}>
                          {course.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No published courses yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Instructors Tab */}
          <TabsContent value="instructors">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Instructors</CardTitle>
                <CardDescription>Manage instructors and their courses</CardDescription>
              </CardHeader>
              <CardContent>
                {instructors.length > 0 ? (
                  <div className="space-y-3">
                    {instructors.map(instructor => {
                      const instructorCourses = courses.filter(c => c.instructor_id === instructor.user_id);
                      return (
                        <div key={instructor.id} className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-medium text-lg">
                            {instructor.full_name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{instructor.full_name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">
                              {instructorCourses.length} course{instructorCourses.length !== 1 ? 's' : ''} • 
                              {instructorCourses.filter(c => c.status === 'published').length} published
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No instructors found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <QuickAction 
                href="/courses" 
                icon={<BookOpen className="h-5 w-5" />} 
                title="Browse Courses" 
                description="View available courses" 
              />
              <QuickAction 
                href="/my-learning" 
                icon={<TrendingUp className="h-5 w-5" />} 
                title="My Learning" 
                description="Track your progress" 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function StatCard({ title, value, icon, isLoading, highlight }: { title: string; value: number | undefined; icon: React.ReactNode; isLoading: boolean; highlight?: boolean }) {
  return (
    <Card className={highlight && value && value > 0 ? 'border-warning' : ''}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className={`text-2xl font-display font-bold mt-1 ${highlight && value && value > 0 ? 'text-warning' : ''}`}>
                {value ?? 0}
              </p>
            )}
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${highlight && value && value > 0 ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'}`}>
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
