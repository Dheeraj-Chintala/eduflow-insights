import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { fromTable } from '@/lib/supabase-helpers';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Clock, 
  GraduationCap, 
  PlayCircle, 
  FileText, 
  Lock,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import type { Course, CourseModule, Lesson, Enrollment } from '@/types/database';

export default function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const isEnrolled = !!enrollment;

  useEffect(() => {
    if (id) {
      fetchCourseData();
    }
  }, [id, user]);

  const fetchCourseData = async () => {
    setIsLoading(true);
    try {
      // Step 1: Fetch course - RLS handles visibility
      const { data: courseData, error: courseError } = await fromTable('courses')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (courseError) throw courseError;
      setCourse(courseData as Course | null);

      if (!courseData) {
        setIsLoading(false);
        return;
      }

      // Step 2: Fetch user's enrollment
      let userEnrollment: Enrollment | null = null;
      if (user) {
        const { data: enrollmentData } = await fromTable('enrollments')
          .select('*')
          .eq('course_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        userEnrollment = enrollmentData as Enrollment | null;
        setEnrollment(userEnrollment);
      }

      // Step 3: Fetch modules - RLS handles visibility
      const { data: modulesData, error: modulesError } = await fromTable('course_modules')
        .select('*')
        .eq('course_id', id)
        .order('sort_order', { ascending: true });

      if (modulesError) throw modulesError;
      setModules((modulesData || []) as CourseModule[]);

      // Step 4: Fetch lessons based on enrollment status
      if (modulesData && modulesData.length > 0) {
        const moduleIds = (modulesData as CourseModule[]).map(m => m.id);
        
        // Build query - let Supabase/RLS decide visibility
        let lessonsQuery = fromTable('lessons')
          .select('*')
          .in('module_id', moduleIds)
      .order('sort_order', { ascending: true });

        // If not enrolled, only request preview lessons
        if (!userEnrollment) {
          lessonsQuery = lessonsQuery.eq('is_preview', true);
        }

        const { data: lessonsData, error: lessonsError } = await lessonsQuery;

        if (lessonsError) throw lessonsError;
        setLessons((lessonsData || []) as Lesson[]);
      } else {
        setLessons([]);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user || !course) return;

    setIsEnrolling(true);
    try {
      const { error } = await fromTable('enrollments')
        .insert({
          user_id: user.id,
          course_id: course.id,
          progress: 0,
        } as any);

      if (error) {
        // Handle duplicate enrollment (unique constraint violation)
        if (error.code === '23505') {
          toast({
            title: 'Already enrolled',
            description: 'You are already enrolled in this course.',
          });
          await fetchCourseData();
          return;
        }
        // Handle RLS policy violation
        if (error.code === '42501') {
          toast({
            title: 'Permission denied',
            description: 'You do not have permission to enroll in this course.',
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      toast({
        title: 'Enrolled successfully!',
        description: 'You now have full access to this course.',
      });

      await fetchCourseData();
    } catch (error: any) {
      toast({
        title: 'Enrollment failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const getLessonsForModule = (moduleId: string) => {
    return lessons.filter(l => l.module_id === moduleId);
  };


  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video':
        return PlayCircle;
      case 'text':
        return FileText;
      case 'quiz':
        return CheckCircle;
      default:
        return BookOpen;
    }
  };

  const difficultyColors = {
    beginner: 'bg-success/10 text-success border-success/20',
    intermediate: 'bg-warning/10 text-warning border-warning/20',
    advanced: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!course) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-display font-semibold mb-2">Course not found</h2>
          <p className="text-muted-foreground mb-6">
            This course doesn't exist or you don't have access to view it.
          </p>
          <Button asChild variant="outline">
            <Link to="/courses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Back Link */}
        <Link 
          to="/courses" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Link>

        {/* Course Header */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-start gap-3">
              <h1 className="text-3xl font-display font-bold">{course.title}</h1>
              <Badge variant="outline" className={difficultyColors[course.difficulty]}>
                {course.difficulty}
              </Badge>
            </div>
            
            <p className="text-muted-foreground text-lg">
              {course.description || 'No description available'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{course.estimated_hours || 0} hours</span>
              </div>
              <div className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                <span>{course.category || 'General'}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>{modules.length} modules</span>
              </div>
            </div>
          </div>

          {/* Enrollment Card */}
          <Card className="lg:row-span-1">
            <CardContent className="p-6">
              <div className="relative h-32 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                {course.thumbnail_url ? (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <BookOpen className="h-12 w-12 text-primary-foreground/80" />
                )}
              </div>

              {course.course_type === 'free'? (
                <p className="text-2xl font-bold text-success mb-4">Free</p>
              ) : (
                <p className="text-2xl font-bold mb-4">
                  ${course.price?.toFixed(2) || '0.00'}
                </p>
              )}

              {isEnrolled ? (
                <div className="space-y-3">
                  <Badge className="w-full justify-center py-2 bg-success/10 text-success border-success/20">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Enrolled
                  </Badge>
                  <p className="text-sm text-muted-foreground text-center">
                    Progress: {enrollment?.progress || 0}%
                  </p>
                  <Button asChild className="w-full bg-gradient-primary hover:opacity-90">
                    <Link to={`/courses/${course.id}/learn`}>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Start Learning
                    </Link>
                  </Button>
                </div>
              ) : (
                <Button 
                  className="w-full bg-gradient-primary hover:opacity-90"
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                >
                  {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Course Content */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Course Content</CardTitle>
          </CardHeader>
          <CardContent>
            {modules.length > 0 ? (
              <Accordion type="multiple" className="w-full">
                {modules.map((module, index) => {
                  const moduleLessons = getLessonsForModule(module.id);
                  const hasLessons = moduleLessons.length > 0;

                  return (
                    <AccordionItem key={module.id} value={module.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{module.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {hasLessons ? (
                                <>
                                  {moduleLessons.length} {isEnrolled ? 'lessons' : 'preview lessons'}
                                </>
                              ) : (
                                !isEnrolled && <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Enroll to access</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pl-11">
                          {hasLessons ? (
                            moduleLessons.map(lesson => {
                              const LessonIcon = getLessonIcon(lesson.content_type
);

                              return (
                                <div 
                                  key={lesson.id}
                                  className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted/50 cursor-pointer"
                                >
                                  <div className="flex items-center gap-3">
                                    <LessonIcon className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <p className="text-sm font-medium">
                                        {lesson.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {lesson.duration} min • {lesson.content_type}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {lesson.is_preview && !isEnrolled && (
                                      <Badge variant="secondary" className="text-xs">
                                        Preview
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30 text-muted-foreground">
                              <Lock className="h-5 w-5" />
                              <div>
                                <p className="text-sm font-medium">Content locked</p>
                                <p className="text-xs">Enroll in this course to access all lessons</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No content available yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
