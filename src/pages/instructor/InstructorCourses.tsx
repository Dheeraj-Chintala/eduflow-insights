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
import { BookOpen, PlusCircle, Pencil, Trash2, Eye, Loader2, Layers } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Course } from '@/types/database';

export default function InstructorCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await fromTable('courses')
        .select('*')
        .eq('instructor_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    setDeletingId(courseId);
    try {
      const { error } = await fromTable('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      setCourses(courses.filter(c => c.id !== courseId));
      toast({
        title: 'Course deleted',
        description: 'The course has been permanently deleted.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete course.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (course: Course) => {
    const newStatus = course.status === 'published' ? 'draft' : 'published';
    setUpdatingId(course.id);
    
    try {
      const { error } = await fromTable('courses')
        .update({ status: newStatus })
        .eq('id', course.id);

      if (error) throw error;

      setCourses(courses.map(c => 
        c.id === course.id ? { ...c, status: newStatus } : c
      ));
      
      toast({
        title: newStatus === 'published' ? 'Course Published' : 'Course Unpublished',
        description: newStatus === 'published' 
          ? 'Your course is now available to students.'
          : 'Your course has been moved to drafts.',
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

  const publishedCourses = courses.filter(c => c.status === 'published');
  const draftCourses = courses.filter(c => c.status === 'draft');

  const statusColors = {
    draft: 'bg-warning/10 text-warning border-warning/20',
    published: 'bg-success/10 text-success border-success/20',
    archived: 'bg-muted text-muted-foreground border-border',
  };

  const CourseCard = ({ course }: { course: Course }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative h-32 bg-gradient-primary flex items-center justify-center">
        {course.thumbnail_url ? (
          <img 
            src={course.thumbnail_url} 
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <BookOpen className="h-10 w-10 text-primary-foreground/80" />
        )}
        <Badge 
          variant="outline" 
          className={`absolute top-3 right-3 ${statusColors[course.status]}`}
        >
          {course.status}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="font-display font-semibold line-clamp-1 mb-1">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
          {course.description || 'No description'}
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span className="px-2 py-1 bg-secondary rounded text-xs">
            {course.category || 'Uncategorized'}
          </span>
          {course.duration && (
            <span className="text-xs">{course.duration}</span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleToggleStatus(course)}
            disabled={updatingId === course.id}
          >
            {updatingId === course.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : course.status === 'published' ? (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Publish
              </>
            )}
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to={`/instructor/courses/${course.id}/content`}>
              <Layers className="h-4 w-4 mr-1" />
              Content
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to={`/instructor/courses/${course.id}/edit`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Course</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{course.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(course.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deletingId === course.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ type }: { type: 'all' | 'published' | 'draft' }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
        <BookOpen className="h-10 w-10" />
      </div>
      <p className="font-medium text-lg mb-2">
        {type === 'all' ? 'No courses yet' : type === 'published' ? 'No published courses' : 'No drafts'}
      </p>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {type === 'all' 
          ? 'Start by creating your first course.'
          : type === 'published'
          ? 'Publish a course to make it available to students.'
          : 'Save a course as draft to continue editing later.'}
      </p>
      {type === 'all' && (
        <Button asChild className="bg-gradient-primary hover:opacity-90">
          <Link to="/instructor/courses/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Your First Course
          </Link>
        </Button>
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">My Courses</h1>
            <p className="text-muted-foreground mt-1">
              Manage and organize your course content.
            </p>
          </div>
          <Button asChild className="bg-gradient-primary hover:opacity-90">
            <Link to="/instructor/courses/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Course
            </Link>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Courses ({courses.length})</TabsTrigger>
            <TabsTrigger value="published">Published ({publishedCourses.length})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({draftCourses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-32 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : courses.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <Card>
                <EmptyState type="all" />
              </Card>
            )}
          </TabsContent>

          <TabsContent value="published">
            {publishedCourses.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {publishedCourses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <Card>
                <EmptyState type="published" />
              </Card>
            )}
          </TabsContent>

          <TabsContent value="drafts">
            {draftCourses.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {draftCourses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <Card>
                <EmptyState type="draft" />
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
