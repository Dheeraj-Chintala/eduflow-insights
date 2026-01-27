import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { fromTable } from '@/lib/supabase-helpers';
import { ArrowLeft, Loader2, Save, Send, Trash2, Layers } from 'lucide-react';
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

const CATEGORIES = [
  'Technology',
  'Business',
  'Design',
  'Marketing',
  'Personal Development',
  'Finance',
  'Health & Wellness',
  'Language',
  'Other',
];

export default function EditCourse() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCourse();
    }
  }, [id]);

  const fetchCourse = async () => {
    try {
      const { data, error } = await fromTable('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setCourse(data);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setCategory(data.category || '');
        setDuration(data.duration || '');
        setThumbnailUrl(data.thumbnail_url || '');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (newStatus?: 'draft' | 'published') => {
    if (!title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a course title.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const updates: any = {
        title: title.trim(),
        description: description.trim() || null,
        category: category || null,
        duration: duration || null,
        thumbnail_url: thumbnailUrl.trim() || null,
      };

      if (newStatus) {
        updates.status = newStatus;
      }

      const { error } = await fromTable('courses')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Changes Saved',
        description: newStatus === 'published' 
          ? 'Your course has been published.'
          : 'Your changes have been saved.',
      });

      if (newStatus) {
        navigate('/instructor/courses');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save changes.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await fromTable('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Course deleted',
        description: 'The course has been permanently deleted.',
      });
      navigate('/instructor/courses');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete course.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6 max-w-3xl">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-64" />
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!course) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Course not found</h2>
          <p className="text-muted-foreground mb-4">The course you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/instructor/courses">Back to My Courses</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in max-w-3xl">
        {/* Back Link */}
        <Link 
          to="/instructor/courses" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Courses
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-display font-bold">Edit Course</h1>
            <p className="text-muted-foreground mt-1">
              Update your course details.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to={`/instructor/courses/${id}/content`}>
                <Layers className="h-4 w-4 mr-2" />
                Manage Content
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Course</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this course? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Course Details</CardTitle>
            <CardDescription>
              Update the information for your course.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Introduction to Web Development"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what students will learn..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSaving}
                  rows={5}
                />
              </div>

              {/* Category & Duration */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory} disabled={isSaving}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 4 hours"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Thumbnail URL */}
              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  placeholder="https://example.com/image.jpg"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/instructor/courses')}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <div className="flex gap-3 sm:ml-auto">
                  <Button 
                    type="submit"
                    variant="secondary"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                  {course.status === 'draft' && (
                    <Button 
                      type="button"
                      className="bg-gradient-primary hover:opacity-90"
                      onClick={() => handleSave('published')}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Publish
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
