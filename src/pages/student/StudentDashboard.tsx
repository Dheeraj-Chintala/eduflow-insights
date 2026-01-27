import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { fromTable } from '@/lib/supabase-helpers';
import { 
  BookOpen, 
  GraduationCap, 
  Clock, 
  Award,
  Play,
  ChevronRight,
  Bell
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationsPanel } from '@/components/student/NotificationsPanel';
import { CertificatesSection } from '@/components/student/CertificatesSection';
import { ResumeCard } from '@/components/student/ResumeCard';
import { MentorChat } from '@/components/student/MentorChat';
import type { Course, Enrollment } from '@/types/database';

interface StudentStats {
  enrolledCourses: number;
  inProgress: number;
  completed: number;
  totalProgress: number;
}

interface EnrollmentWithCourse extends Enrollment {
  course?: Course;
}

export default function StudentDashboard() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);

  const fetchStudentData = async () => {
    try {
      const [enrollmentsResult, coursesResult] = await Promise.all([
        fromTable('enrollments')
  .select('*, course:courses(*)')
  .eq('user_id', user.id),
        fromTable('courses').select('*').eq('status', 'published').order('created_at', { ascending: false }),
      ]);

      const userEnrollments = enrollmentsResult.data || [];
      const allCourses = coursesResult.data || [];
      
      const enrolledIds = userEnrollments.map((e: any) => e.course_id);
      const notEnrolled = allCourses.filter(c => !enrolledIds.includes(c.id));

      const completedCount = userEnrollments.filter((e: any) => e.completed_at !== null).length;
      const totalProgress = userEnrollments.length > 0 
        ? Math.round(userEnrollments.reduce((acc: number, e: any) => acc + (e.progress || 0), 0) / userEnrollments.length)
        : 0;

      setStats({
        enrolledCourses: userEnrollments.length,
        inProgress: userEnrollments.length - completedCount,
        completed: completedCount,
        totalProgress,
      });

      setEnrollments(userEnrollments);
      setAvailableCourses(notEnrolled.slice(0, 6));
    } catch (error) {
      console.error('Error fetching student data:', error);
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

  const inProgressEnrollments = enrollments.filter(e => !e.completed_at);
  const completedEnrollments = enrollments.filter(e => e.completed_at);

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header with Notifications */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">
              {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Student'}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Continue your learning journey.
            </p>
          </div>
          <NotificationsPanel />
        </div>

        {/* Resume Last Lesson */}
        <ResumeCard />

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard 
            title="Enrolled" 
            value={stats?.enrolledCourses} 
            icon={<BookOpen className="h-5 w-5" />} 
            isLoading={isLoading} 
          />
          <StatCard 
            title="In Progress" 
            value={stats?.inProgress} 
            icon={<Clock className="h-5 w-5" />} 
            isLoading={isLoading} 
          />
          <StatCard 
            title="Completed" 
            value={stats?.completed} 
            icon={<Award className="h-5 w-5" />} 
            isLoading={isLoading} 
          />
          <StatCard 
            title="Avg. Progress" 
            value={stats?.totalProgress} 
            suffix="%" 
            icon={<GraduationCap className="h-5 w-5" />} 
            isLoading={isLoading} 
          />
        </div>

        {/* Continue Learning */}
        {inProgressEnrollments.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-display">Continue Learning</CardTitle>
                <CardDescription>Pick up where you left off</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/my-learning">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inProgressEnrollments.slice(0, 3).map((enrollment: any) => (
                  <CourseProgressCard 
                    key={enrollment.id} 
                    course={enrollment.course} 
                    progress={enrollment.progress || 0}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Courses */}
        {availableCourses.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-display">Discover Courses</CardTitle>
                <CardDescription>Explore new learning opportunities</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/courses">Browse All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableCourses.slice(0, 3).map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Courses */}
        {completedEnrollments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Award className="h-5 w-5 text-success" />
                Completed Courses
              </CardTitle>
              <CardDescription>Your achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completedEnrollments.slice(0, 5).map((enrollment: any) => (
                  <div key={enrollment.id} className="flex items-center gap-4 p-3 rounded-lg bg-success/5 border border-success/20">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                      <Award className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{enrollment.course?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Completed {new Date(enrollment.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      Completed
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certificates Section */}
        <CertificatesSection />

        {/* Empty State */}
        {enrollments.length === 0 && !isLoading && (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <GraduationCap className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">Start Your Learning Journey</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                You haven't enrolled in any courses yet. Explore our catalog to find courses that interest you.
              </p>
              <Button asChild className="bg-gradient-primary hover:opacity-90">
                <Link to="/courses">
                  Browse Courses
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        )}

        {/* Mentor Chat Widget */}
        <MentorChat />
      </div>
    </AppLayout>
  );
}

function StatCard({ title, value, suffix, icon, isLoading }: { title: string; value: number | undefined; suffix?: string; icon: React.ReactNode; isLoading: boolean }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-display font-bold mt-1">
                {value ?? 0}{suffix}
              </p>
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

function CourseProgressCard({ course, progress }: { course: Course; progress: number }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative h-28 bg-gradient-primary flex items-center justify-center">
        {course.thumbnail_url ? (
          <img 
            src={course.thumbnail_url} 
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <BookOpen className="h-8 w-8 text-primary-foreground/80" />
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold line-clamp-1 mb-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <Button asChild className="w-full mt-4 bg-gradient-primary hover:opacity-90" size="sm">
          <Link to={`/courses/${course.id}/learn`}>
            <Play className="h-4 w-4 mr-2" />
            Continue
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function CourseCard({ course }: { course: Course }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative h-28 bg-gradient-primary flex items-center justify-center">
        {course.thumbnail_url ? (
          <img 
            src={course.thumbnail_url} 
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <BookOpen className="h-8 w-8 text-primary-foreground/80" />
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold line-clamp-1 mb-1 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
          {course.description || 'No description'}
        </p>
        <Button asChild variant="outline" className="w-full" size="sm">
          <Link to={`/courses/${course.id}`}>
            View Course
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
