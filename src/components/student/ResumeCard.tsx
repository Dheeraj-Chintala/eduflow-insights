import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { fromTable } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import type { Course, Enrollment, LessonProgress, Lesson, CourseModule } from '@/types/database';

interface LastLessonData {
  enrollment: Enrollment & { course: Course };
  lesson: Lesson;
  progress: number;
}

export function ResumeCard() {
  const { user } = useAuth();
  const [lastLesson, setLastLesson] = useState<LastLessonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLastLesson();
    }
  }, [user]);

  const fetchLastLesson = async () => {
    try {
      // Get the most recent lesson progress
      const { data: progressData } = await fromTable('lesson_progress')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!progressData) {
        setIsLoading(false);
        return;
      }

      const lessonProgress = progressData as LessonProgress;

      // Get the lesson details
      const { data: lessonData } = await fromTable('lessons')
        .select('*, module:course_modules(*)')
        .eq('id', lessonProgress.lesson_id)
        .maybeSingle();

      if (!lessonData) {
        setIsLoading(false);
        return;
      }

      const lesson = lessonData as Lesson & { module: CourseModule };

      // Get the course and enrollment
      const { data: enrollmentData } = await fromTable('enrollments')
        .select('*, course:courses(*)')
        .eq('course_id', lesson.module.course_id)
        .maybeSingle();

      if (!enrollmentData) {
        setIsLoading(false);
        return;
      }

      const enrollment = enrollmentData as Enrollment & { course: Course };

      // Calculate progress
      const { data: allLessons } = await fromTable('lessons')
        .select('id, module:course_modules!inner(course_id)')
        .eq('module.course_id', enrollment.course_id);

      const { data: completedLessons } = await fromTable('lesson_progress')
        .select('id')
        .eq('completed', true)
        .in('lesson_id', (allLessons || []).map((l: any) => l.id));

      const totalLessons = allLessons?.length || 0;
      const completedCount = completedLessons?.length || 0;
      const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      setLastLesson({
        enrollment,
        lesson,
        progress,
      });
    } catch (error) {
      console.error('Error fetching last lesson:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            <Skeleton className="h-32 md:w-48" />
            <div className="flex-1 p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!lastLesson) {
    return null;
  }

  const { enrollment, lesson, progress } = lastLesson;

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-48 h-32 md:h-auto bg-gradient-primary flex items-center justify-center shrink-0">
            {enrollment.course.thumbnail_url ? (
              <img 
                src={enrollment.course.thumbnail_url} 
                alt={enrollment.course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <BookOpen className="h-10 w-10 text-primary-foreground/80" />
            )}
          </div>
          <div className="flex-1 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-1">Continue where you left off</p>
                <h3 className="font-display font-semibold text-lg mb-2 line-clamp-1">
                  {enrollment.course.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Clock className="h-4 w-4" />
                  <span className="truncate">{lesson.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={progress} className="flex-1 h-2" />
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
              </div>
              <Button 
                asChild 
                className="bg-gradient-primary hover:opacity-90 shrink-0"
              >
                <Link to={`/courses/${enrollment.course_id}/learn?lesson=${lesson.id}`}>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
