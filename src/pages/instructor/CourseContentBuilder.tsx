import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { fromTable } from '@/lib/supabase-helpers';
import { 
  ArrowLeft, 
  Loader2, 
  Plus, 
  Trash2, 
  GripVertical,
  Video,
  FileText,
  HelpCircle,
  File,
  Save,
  BookOpen,
  Pencil
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Course, CourseModule, Lesson, LessonType } from '@/types/database';

interface ModuleWithLessons extends CourseModule {
  lessons: Lesson[];
}

const LESSON_TYPE_ICONS: Record<LessonType, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  text: <FileText className="h-4 w-4" />,
  quiz: <HelpCircle className="h-4 w-4" />,
  file: <File className="h-4 w-4" />,
};

const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  video: 'Video',
  text: 'Text/Article',
  quiz: 'Quiz',
  file: 'File/Document',
};

export default function CourseContentBuilder() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Module dialog state
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');

  // Lesson dialog state
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonModuleId, setLessonModuleId] = useState<string>('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState<LessonType>('video');
  const [lessonContentUrl, setLessonContentUrl] = useState('');
  const [lessonContentText, setLessonContentText] = useState('');
  const [lessonDuration, setLessonDuration] = useState('');

  // Delete confirmation state
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null);
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCourseData();
    }
  }, [id]);

  const fetchCourseData = async () => {
    try {
      // Fetch course
      const { data: courseData, error: courseError } = await fromTable('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch modules
      const { data: modulesData, error: modulesError } = await fromTable('course_modules')
        .select('*')
        .eq('course_id', id)
        .order('sort_order', { ascending: true });

      if (modulesError) throw modulesError;

      // Fetch lessons for all modules
      const moduleIds = (modulesData || []).map((m: CourseModule) => m.id);
      let lessonsData: Lesson[] = [];
      
      if (moduleIds.length > 0) {
        const { data, error: lessonsError } = await fromTable('lessons')
          .select('*')
          .in('module_id', moduleIds)
          .order('sort_order', { ascending: true });

        if (lessonsError) throw lessonsError;
        lessonsData = data || [];
      }

      // Combine modules with their lessons
      const modulesWithLessons = (modulesData || []).map((module: CourseModule) => ({
        ...module,
        lessons: lessonsData.filter(l => l.module_id === module.id),
      }));

      setModules(modulesWithLessons);
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course content.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== MODULE OPERATIONS ====================

  const openAddModuleDialog = () => {
    setEditingModule(null);
    setModuleTitle('');
    setModuleDescription('');
    setModuleDialogOpen(true);
  };

  const openEditModuleDialog = (module: CourseModule) => {
    setEditingModule(module);
    setModuleTitle(module.title);
    setModuleDescription(module.description || '');
    setModuleDialogOpen(true);
  };

  const handleSaveModule = async () => {
    if (!moduleTitle.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Module title is required.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editingModule) {
        // Update existing module
        const { error } = await fromTable('course_modules')
          .update({
            title: moduleTitle.trim(),
            description: moduleDescription.trim() || null,
          })
          .eq('id', editingModule.id);

        if (error) throw error;

        setModules(modules.map(m => 
          m.id === editingModule.id 
            ? { ...m, title: moduleTitle.trim(), description: moduleDescription.trim() || null }
            : m
        ));

        toast({ title: 'Module updated successfully!' });
      } else {
        // Create new module
        const newSortOrder = modules.length;
        const { data, error } = await fromTable('course_modules')
          .insert({
            course_id: id,
            title: moduleTitle.trim(),
            description: moduleDescription.trim() || null,
            sort_order: newSortOrder,
          })
          .select()
          .single();

        if (error) throw error;

        setModules([...modules, { ...data, lessons: [] }]);
        toast({ title: 'Module created successfully!' });
      }

      setModuleDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save module.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteModule = async () => {
    if (!deleteModuleId) return;

    setIsSaving(true);
    try {
      const { error } = await fromTable('course_modules')
        .delete()
        .eq('id', deleteModuleId);

      if (error) throw error;

      setModules(modules.filter(m => m.id !== deleteModuleId));
      toast({ title: 'Module deleted successfully!' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete module.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setDeleteModuleId(null);
    }
  };

  // ==================== LESSON OPERATIONS ====================

  const openAddLessonDialog = (moduleId: string) => {
    setEditingLesson(null);
    setLessonModuleId(moduleId);
    setLessonTitle('');
    setLessonType('video');
    setLessonContentUrl('');
    setLessonContentText('');
    setLessonDuration('');
    setLessonDialogOpen(true);
  };

  const openEditLessonDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonModuleId(lesson.module_id);
    setLessonTitle(lesson.title);
    setLessonType(lesson.content_type);
    setLessonContentUrl(lesson.content_url || '');
    setLessonContentText(lesson.content_text || '');
    setLessonDuration(lesson.duration?.toString() || '');
    setLessonDialogOpen(true);
  };

  const handleSaveLesson = async () => {
    if (!lessonTitle.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Lesson title is required.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const lessonData = {
        title: lessonTitle.trim(),
        content_type: lessonType,
        content_url: lessonContentUrl.trim() || null,
        content_text: lessonContentText.trim() || null,
        duration: lessonDuration ? parseInt(lessonDuration) : null,
      };

      if (editingLesson) {
        // Update existing lesson
        const { error } = await fromTable('lessons')
          .update(lessonData)
          .eq('id', editingLesson.id);

        if (error) throw error;

        setModules(modules.map(m => ({
          ...m,
          lessons: m.lessons.map(l => 
            l.id === editingLesson.id ? { ...l, ...lessonData } : l
          ),
        })));

        toast({ title: 'Lesson updated successfully!' });
      } else {
        // Create new lesson
        const module = modules.find(m => m.id === lessonModuleId);
        const newSortOrder = module ? module.lessons.length : 0;

        const { data, error } = await fromTable('lessons')
          .insert({
            ...lessonData,
            module_id: lessonModuleId,
            sort_order: newSortOrder,
          })
          .select()
          .single();

        if (error) throw error;

        setModules(modules.map(m => 
          m.id === lessonModuleId 
            ? { ...m, lessons: [...m.lessons, data] }
            : m
        ));

        toast({ title: 'Lesson created successfully!' });
      }

      setLessonDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save lesson.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!deleteLessonId) return;

    setIsSaving(true);
    try {
      const { error } = await fromTable('lessons')
        .delete()
        .eq('id', deleteLessonId);

      if (error) throw error;

      setModules(modules.map(m => ({
        ...m,
        lessons: m.lessons.filter(l => l.id !== deleteLessonId),
      })));

      toast({ title: 'Lesson deleted successfully!' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete lesson.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setDeleteLessonId(null);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6 max-w-4xl">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!course) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Course not found</h2>
          <Button asChild>
            <Link to="/instructor/courses">Back to My Courses</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        {/* Back Link */}
        <Link 
          to="/instructor/courses" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Courses
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Course Content</h1>
            <p className="text-muted-foreground mt-1">
              {course.title}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to={`/instructor/courses/${id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Details
            </Link>
          </Button>
        </div>

        {/* Add Module Button */}
        <Button onClick={openAddModuleDialog} className="bg-gradient-primary hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Add Module
        </Button>

        {/* Modules List */}
        {modules.length > 0 ? (
          <Accordion type="multiple" className="space-y-4">
            {modules.map((module, moduleIndex) => (
              <AccordionItem 
                key={module.id} 
                value={module.id}
                className="border rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-4 hover:no-underline hover:bg-secondary/50">
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Module {moduleIndex + 1}
                      </span>
                    </div>
                    <span className="font-semibold">{module.title}</span>
                    <Badge variant="outline" className="ml-auto mr-4">
                      {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {/* Module Description */}
                  {module.description && (
                    <p className="text-sm text-muted-foreground mb-4 pl-6">
                      {module.description}
                    </p>
                  )}

                  {/* Module Actions */}
                  <div className="flex gap-2 mb-4 pl-6">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openEditModuleDialog(module)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit Module
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openAddLessonDialog(module.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Lesson
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteModuleId(module.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Lessons List */}
                  {module.lessons.length > 0 ? (
                    <div className="space-y-2 pl-6">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div 
                          key={lesson.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors group"
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                            {LESSON_TYPE_ICONS[lesson.content_type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{lesson.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {LESSON_TYPE_LABELS[lesson.content_type]}
                              {lesson.duration && ` • ${lesson.duration} min`}
                            </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="icon" 
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => openEditLessonDialog(lesson)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteLessonId(lesson.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground pl-6">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No lessons yet. Add your first lesson!</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <BookOpen className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">No modules yet</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Start building your course by adding modules. Each module can contain multiple lessons.
              </p>
              <Button onClick={openAddModuleDialog} className="bg-gradient-primary hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" />
                Add First Module
              </Button>
            </div>
          </Card>
        )}

        {/* Module Dialog */}
        <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingModule ? 'Edit Module' : 'Add Module'}
              </DialogTitle>
              <DialogDescription>
                {editingModule 
                  ? 'Update the module details below.'
                  : 'Create a new module for your course.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="module-title">Module Title *</Label>
                <Input
                  id="module-title"
                  placeholder="e.g., Introduction to the Course"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="module-description">Description (optional)</Label>
                <Textarea
                  id="module-description"
                  placeholder="Brief description of what this module covers..."
                  value={moduleDescription}
                  onChange={(e) => setModuleDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveModule} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingModule ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lesson Dialog */}
        <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingLesson ? 'Edit Lesson' : 'Add Lesson'}
              </DialogTitle>
              <DialogDescription>
                {editingLesson 
                  ? 'Update the lesson details below.'
                  : 'Create a new lesson for this module.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-title">Lesson Title *</Label>
                <Input
                  id="lesson-title"
                  placeholder="e.g., Welcome and Overview"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lesson-type">Content Type</Label>
                  <Select value={lessonType} onValueChange={(v) => setLessonType(v as LessonType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" /> Video
                        </div>
                      </SelectItem>
                      <SelectItem value="text">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Text/Article
                        </div>
                      </SelectItem>
                      <SelectItem value="quiz">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" /> Quiz
                        </div>
                      </SelectItem>
                      <SelectItem value="file">
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4" /> File/Document
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lesson-duration">Duration (minutes)</Label>
                  <Input
                    id="lesson-duration"
                    type="number"
                    placeholder="e.g., 15"
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(e.target.value)}
                  />
                </div>
              </div>

              {(lessonType === 'video' || lessonType === 'file') && (
                <div className="space-y-2">
                  <Label htmlFor="lesson-url">
                    {lessonType === 'video' ? 'Video URL' : 'File URL'}
                  </Label>
                  <Input
                    id="lesson-url"
                    placeholder={lessonType === 'video' 
                      ? 'https://youtube.com/watch?v=... or video file URL'
                      : 'https://example.com/document.pdf'}
                    value={lessonContentUrl}
                    onChange={(e) => setLessonContentUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {lessonType === 'video' 
                      ? 'Supports YouTube, Vimeo, or direct video URLs'
                      : 'Direct link to the downloadable file'}
                  </p>
                </div>
              )}

              {lessonType === 'text' && (
                <div className="space-y-2">
                  <Label htmlFor="lesson-content">Content</Label>
                  <Textarea
                    id="lesson-content"
                    placeholder="Write your lesson content here..."
                    value={lessonContentText}
                    onChange={(e) => setLessonContentText(e.target.value)}
                    rows={6}
                  />
                </div>
              )}

              {lessonType === 'quiz' && (
                <div className="p-4 rounded-lg bg-muted text-center">
                  <HelpCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Quiz builder coming soon. For now, you can add quiz content as text.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveLesson} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingLesson ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Module Confirmation */}
        <AlertDialog open={!!deleteModuleId} onOpenChange={() => setDeleteModuleId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Module</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this module? This will also delete all lessons within it. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteModule}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Lesson Confirmation */}
        <AlertDialog open={!!deleteLessonId} onOpenChange={() => setDeleteLessonId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this lesson? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteLesson}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
