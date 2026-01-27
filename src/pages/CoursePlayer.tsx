import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { fromTable } from '@/lib/supabase-helpers';
import { sanitizeHTML } from '@/lib/sanitize-html';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger
} from '@/components/ui/sidebar';
import { 
  ArrowLeft, BookOpen, CheckCircle, FileText, Lock, PlayCircle, Menu
} from 'lucide-react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Course, CourseModule, Lesson, LessonProgress } from '@/types/database';

export default function CoursePlayer() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const [searchParams] = useSearchParams();
  const lessonFromQuery = searchParams.get('lesson');
  const { user } = useAuth();
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgress>>({});
  const [isLoading, setIsLoading] = useState(true);

  const completedLessons = Object.values(lessonProgress).filter(p => p.completed).length;
  const totalLessons = lessons.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  useEffect(() => {
    if (courseId) fetchCourseData();
  }, [courseId, user]);

  useEffect(() => {
    const targetLessonId = lessonId || lessonFromQuery;

    if (targetLessonId && lessons.length > 0) {
      const lesson = lessons.find(l => l.id === targetLessonId);
      if (lesson) {
        setCurrentLesson(lesson);
        return;
      }
    }

    if (lessons.length > 0 && !currentLesson) {
      setCurrentLesson(lessons[0]);
    }
  }, [lessonId, lessonFromQuery, lessons]);

  const fetchCourseData = async () => {
    setIsLoading(true);
    try {
      const { data: courseData } = await fromTable('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();

      setCourse(courseData as Course | null);
      if (!courseData) return;

      const { data: modulesData } = await fromTable('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true });

      setModules((modulesData || []) as CourseModule[]);

      if (modulesData && modulesData.length > 0) {
        const moduleIds = (modulesData as CourseModule[]).map(m => m.id);

        const { data: lessonsData } = await fromTable('lessons')
          .select('*')
          .in('module_id', moduleIds)
          .order('sort_order', { ascending: true });

        const fetchedLessons = (lessonsData || []) as Lesson[];
        setLessons(fetchedLessons);

        if (user && fetchedLessons.length > 0) {
          const lessonIds = fetchedLessons.map(l => l.id);

          const { data: progressData } = await fromTable('lesson_progress')
            .select('*')
            .eq('user_id', user.id)
            .in('lesson_id', lessonIds);

          if (progressData) {
            const map: Record<string, LessonProgress> = {};
            (progressData as LessonProgress[]).forEach(p => {
              map[p.lesson_id] = p;
            });
            setLessonProgress(map);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const trackLessonOpen = useCallback(async (lessonId: string) => {
    if (!user) return;

    await fromTable('lesson_progress').upsert({
      user_id: user.id,
      lesson_id: lessonId,
      time_spent: lessonProgress[lessonId]?.time_spent || 0,
      last_position: lessonProgress[lessonId]?.last_position || 0,
      completed: lessonProgress[lessonId]?.completed || false,
    } as any, { onConflict: 'user_id,lesson_id' });
  }, [user, lessonProgress]);

  const updateProgress = useCallback(async (lessonId: string, updates: any) => {
    if (!user) return;

    const { data } = await fromTable('lesson_progress')
      .upsert({ user_id: user.id, lesson_id: lessonId, ...updates } as any, {
        onConflict: 'user_id,lesson_id',
      })
      .select()
      .maybeSingle();

    if (data) {
      setLessonProgress(prev => ({ ...prev, [lessonId]: data as LessonProgress }));
    }
  }, [user]);

  const markLessonComplete = useCallback(async (lessonId: string) => {
    if (!user) return;

    const { data } = await fromTable('lesson_progress')
      .upsert({
        user_id: user.id,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      } as any, { onConflict: 'user_id,lesson_id' })
      .select()
      .maybeSingle();

    if (data) {
      setLessonProgress(prev => ({ ...prev, [lessonId]: data as LessonProgress }));
      toast({ title: 'Lesson completed!', description: 'Progress saved.' });
    }
  }, [user, toast]);

  const getLessonsForModule = (moduleId: string) =>
    lessons.filter(l => l.module_id === moduleId);

  const getLessonIcon = (type: string) =>
    type === 'video' ? PlayCircle : type === 'text' ? FileText : BookOpen;

  if (isLoading) return <Skeleton className="h-10 w-40 mx-auto mt-20" />;

  if (!course || lessons.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No course content available</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar */}
        <Sidebar className="border-r">
          <SidebarContent>
            <ScrollArea className="flex-1">
              {modules.map(module => (
                <SidebarGroup key={module.id}>
                  <SidebarGroupLabel>{module.title}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {getLessonsForModule(module.id).map(lesson => {
                        const Icon = getLessonIcon(lesson.content_type);
                        const isCompleted = lessonProgress[lesson.id]?.completed;

                        return (
                          <SidebarMenuItem key={lesson.id}>
                            <SidebarMenuButton
                              onClick={() => {
                                setCurrentLesson(lesson);
                                trackLessonOpen(lesson.id);
                              }}
                            >
                              {isCompleted ? <CheckCircle className="h-4 w-4 mr-2 text-success" /> : <Icon className="h-4 w-4 mr-2" />}
                              {lesson.title}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </ScrollArea>
          </SidebarContent>
        </Sidebar>

        {/* Main */}
        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center px-4">
            <SidebarTrigger><Menu /></SidebarTrigger>
            <h1 className="ml-3 font-medium">{currentLesson?.title}</h1>
          </header>

          <div className="flex-1 overflow-auto">
            {currentLesson && (
              <LessonViewer
                lesson={currentLesson}
                progress={lessonProgress[currentLesson.id]}
                onUpdateProgress={(u) => updateProgress(currentLesson.id, u)}
                onMarkComplete={() => markLessonComplete(currentLesson.id)}
              />
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}


function LessonViewer({ lesson, progress, onUpdateProgress, onMarkComplete }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);

  /* ---------- Helper: Detect YouTube URL ---------- */
  const getYouTubeEmbedUrl = (url: string) => {
    try {
      const parsed = new URL(url);

      // youtu.be/<id>
      if (parsed.hostname === 'youtu.be') {
        return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
      }

      // youtube.com/watch?v=<id>
      if (parsed.hostname.includes('youtube.com')) {
        const id = parsed.searchParams.get('v');
        if (id) return `https://www.youtube.com/embed/${id}`;
      }

      return null;
    } catch {
      return null;
    }
  };

  /* ---------- VIDEO LESSON ---------- */
  if (lesson.content_type === 'video') {
    const videoUrl = lesson.content_url;
    const youtubeEmbed = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null;

    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Title + Complete */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-display font-bold">{lesson.title}</h2>
            {progress?.completed ? (
              <span className="flex items-center gap-1 text-success text-sm">
                <CheckCircle className="h-4 w-4" />
                Completed
              </span>
            ) : (
              <Button size="sm" variant="outline" onClick={onMarkComplete}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark Complete
              </Button>
            )}
          </div>

          {/* Player */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
            {youtubeEmbed ? (
              /* 🔥 YouTube Embed */
              <iframe
                src={youtubeEmbed}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="YouTube lesson"
              />
            ) : videoUrl ? (
              /* Normal MP4 / hosted video */
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/60">
                <p>Video not available</p>
              </div>
            )}
          </div>

          {/* Info */}
          <p className="text-sm text-muted-foreground">
            Duration: {lesson.duration || 0} minutes
          </p>
        </div>
      </div>
    );
  }

  /* ---------- TEXT / MARKDOWN LESSON ---------- */
  if (lesson.content_type === 'text') {
    const textContent = lesson.content_text;

    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          {/* Title + Complete */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold">{lesson.title}</h2>
            {progress?.completed ? (
              <span className="flex items-center gap-1 text-success text-sm">
                <CheckCircle className="h-4 w-4" />
                Completed
              </span>
            ) : (
              <Button size="sm" variant="outline" onClick={onMarkComplete}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark Complete
              </Button>
            )}
          </div>

          {/* Markdown Content */}
          {textContent ? (
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {textContent}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No content available for this lesson</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---------- OTHER TYPES ---------- */
  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-display font-bold mb-4">{lesson.title}</h2>
        <p className="text-muted-foreground mb-4">
          Lesson type: <span className="capitalize">{lesson.content_type}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Duration: {lesson.duration || 0} minutes
        </p>
        <Button className="mt-6" onClick={onMarkComplete}>
          Mark Complete
        </Button>
      </div>
    </div>
  );
}