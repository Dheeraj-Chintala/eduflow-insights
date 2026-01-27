import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/layouts/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fromTable } from '@/lib/supabase-helpers';
import { BookOpen, Calendar, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import type { Course, Enrollment, LessonProgress } from '@/types/database';

interface EnrolledCourse extends Enrollment {
  course: Course;
}

interface CourseProgress {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  firstIncompleteLessonId: string | null;
}

export default function MyLearning() {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [courseProgress, setCourseProgress] = useState<Record<string, CourseProgress>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEnrolledCourses();
    }
  }, [user]);

  const fetchEnrolledCourses = async () => {
    try {
      // Fetch enrollments with courses
      const { data: enrollmentsData, error: enrollmentsError } = await fromTable('enrollments')
        .select(`
          *,
          course:courses(*)
        `)
        .order('enrolled_at', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;
      const enrollments = (enrollmentsData || []) as EnrolledCourse[];
      setEnrolledCourses(enrollments);

      // Fetch progress for each course
      if (enrollments.length > 0 && user) {
        const courseIds = enrollments.map(e => e.course.id);
        
        // Fetch all lessons for enrolled courses
        const { data: modulesData } = await fromTable('course_modules')
          .select('id, course_id')
          .in('course_id', courseIds);

        if (modulesData && modulesData.length > 0) {
          const moduleIds = modulesData.map((m: any) => m.id);
          const modulesByCourse: Record<string, string[]> = {};
          modulesData.forEach((m: any) => {
            if (!modulesByCourse[m.course_id]) modulesByCourse[m.course_id] = [];
            modulesByCourse[m.course_id].push(m.id);
          });

          // Fetch lessons with order
          const { data: lessonsData } = await fromTable('lessons')
            .select('id, module_id, sort_order')
            .in('module_id', moduleIds)
            .order('sort_order', { ascending: true });

          // Fetch user's lesson progress
          const { data: progressData } = await fromTable('lesson_progress')
            .select('lesson_id, completed')
            .eq('user_id', user.id);

          // Build progress map
          const lessonsByCourse: Record<string, { id: string; module_id: string; sort_order: number }[]> = {};
          
          if (lessonsData) {
            // Map lessons to courses (maintaining order)
            courseIds.forEach(courseId => {
              const courseModuleIds = modulesByCourse[courseId] || [];
              lessonsByCourse[courseId] = (lessonsData as any[])
                .filter(l => courseModuleIds.includes(l.module_id));
            });
          }

          const completedLessonIds = new Set(
            (progressData as LessonProgress[] || [])
              .filter(p => p.completed)
              .map(p => p.lesson_id)
          );

          // Calculate progress for each course and find first incomplete lesson
          const progressMap: Record<string, CourseProgress> = {};
          courseIds.forEach(courseId => {
            const courseLessons = lessonsByCourse[courseId] || [];
            const completedCount = courseLessons.filter(l => completedLessonIds.has(l.id)).length;
            const totalCount = courseLessons.length;
            
            // Find first incomplete lesson (in order)
            const firstIncomplete = courseLessons.find(l => !completedLessonIds.has(l.id));
            
            progressMap[courseId] = {
              courseId,
              totalLessons: totalCount,
              completedLessons: completedCount,
              progressPercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
              firstIncompleteLessonId: firstIncomplete?.id || null,
            };
          });
          setCourseProgress(progressMap);
        }
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const inProgress = enrolledCourses.filter(e => {
    const progress = courseProgress[e.course.id];
    return !progress || progress.progressPercent < 100;
  });
  const completed = enrolledCourses.filter(e => {
    const progress = courseProgress[e.course.id];
    return progress && progress.progressPercent === 100;
  });

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">My Learning</h1>
          <p className="text-muted-foreground mt-1">
            Track your progress and continue where you left off
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold">{enrolledCourses.length}</p>
                <p className="text-sm text-muted-foreground">Total Courses</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold">{inProgress.length}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold">{completed.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="in-progress" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="in-progress" className="gap-2">
              <Clock className="h-4 w-4" />
              In Progress ({inProgress.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completed ({completed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="in-progress">
            {isLoading ? (
              <CourseListSkeleton />
            ) : inProgress.length > 0 ? (
              <div className="space-y-4">
                {inProgress.map(enrollment => (
                  <EnrolledCourseCard 
                    key={enrollment.id} 
                    enrollment={enrollment}
                    progress={courseProgress[enrollment.course.id]}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Clock className="h-10 w-10" />}
                title="No courses in progress"
                description="Enroll in a course to start learning"
                action={
                  <Button asChild className="bg-gradient-primary hover:opacity-90">
                    <Link to="/courses">Browse Courses</Link>
                  </Button>
                }
              />
            )}
          </TabsContent>

          <TabsContent value="completed">
            {isLoading ? (
              <CourseListSkeleton />
            ) : completed.length > 0 ? (
              <div className="space-y-4">
                {completed.map(enrollment => (
                  <EnrolledCourseCard 
                    key={enrollment.id} 
                    enrollment={enrollment}
                    progress={courseProgress[enrollment.course.id]}
                    isCompleted
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<CheckCircle2 className="h-10 w-10" />}
                title="No completed courses"
                description="Complete a course to see it here"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

const EnrolledCourseCard = React.forwardRef<
  HTMLDivElement,
  { 
    enrollment: EnrolledCourse;
    progress?: CourseProgress;
    isCompleted?: boolean;
  }
>(({ enrollment, progress, isCompleted = false }, ref) => {
  const course = enrollment.course;
  const displayProgress = progress?.progressPercent ?? 0;
  
  // Build resume URL - go to first incomplete lesson if available
  const resumeUrl = progress?.firstIncompleteLessonId 
    ? `/courses/${course.id}/learn?lesson=${progress.firstIncompleteLessonId}`
    : `/courses/${course.id}/learn`;
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-48 h-32 sm:h-auto bg-gradient-primary flex items-center justify-center flex-shrink-0">
          {course.thumbnail_url ? (
            <img 
              src={course.thumbnail_url} 
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <BookOpen className="h-10 w-10 text-primary-foreground/80" />
          )}
        </div>
        <CardContent className="flex-1 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-display font-semibold text-lg mb-1">
                {course.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {course.description || 'No description available'}
              </p>
              
              {/* Enrollment Date */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                <Calendar className="h-3 w-3" />
                <span>Enrolled {format(new Date(enrollment.enrolled_at), 'MMM d, yyyy')}</span>
              </div>
              
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {progress ? `${progress.completedLessons}/${progress.totalLessons} lessons` : 'Progress'}
                  </span>
                  <span className="font-medium">{displayProgress}%</span>
                </div>
                <Progress value={displayProgress} className="h-2" />
              </div>
            </div>
            <div className="sm:ml-4 flex flex-col gap-2">
              <Button 
                asChild 
                className={isCompleted ? 'bg-success hover:bg-success/90' : 'bg-gradient-primary hover:opacity-90'}
              >
                <Link to={resumeUrl}>
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Review
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Resume
                    </>
                  )}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
});

EnrolledCourseCard.displayName = 'EnrolledCourseCard';

function CourseListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Card key={i} className="overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            <Skeleton className="sm:w-48 h-32" />
            <CardContent className="flex-1 p-4 sm:p-6">
              <Skeleton className="h-6 w-2/3 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </div>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ 
  icon, 
  title, 
  description, 
  action 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-display font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
        {action}
      </div>
    </Card>
  );
}
