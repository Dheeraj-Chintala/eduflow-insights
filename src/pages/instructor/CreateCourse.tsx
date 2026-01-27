import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ArrowLeft, Loader2, Save, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

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

export default function CreateCourse() {
  const { user, orgId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a course title.',
        variant: 'destructive',
      });
      return;
    }

    if (!user || !orgId) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a course.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await fromTable('courses')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          category: category || null,
          duration: duration || null,
          thumbnail_url: thumbnailUrl.trim() || null,
          status,
          instructor_id: user.id,
          org_id: orgId,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: status === 'published' ? 'Course Published!' : 'Course Saved!',
        description: status === 'published' 
          ? 'Your course is now available to students.'
          : 'Your course has been saved as a draft.',
      });
      
      navigate('/instructor/courses');
    } catch (error: any) {
      console.error('Error creating course:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create course. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        <div>
          <h1 className="text-3xl font-display font-bold">Create New Course</h1>
          <p className="text-muted-foreground mt-1">
            Fill in the details below to create your course.
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Course Details</CardTitle>
            <CardDescription>
              Enter the basic information for your course.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit('draft'); }} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Introduction to Web Development"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Choose a clear, descriptive title for your course.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what students will learn in this course..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  Provide a brief overview of the course content and objectives.
                </p>
              </div>

              {/* Category & Duration Row */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory} disabled={isLoading}>
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
                    placeholder="e.g., 4 hours, 2 weeks"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    disabled={isLoading}
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
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Provide a URL to an image that represents your course.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/instructor/courses')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <div className="flex gap-3 sm:ml-auto">
                  <Button 
                    type="button"
                    variant="secondary"
                    onClick={() => handleSubmit('draft')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save as Draft
                  </Button>
                  <Button 
                    type="button"
                    className="bg-gradient-primary hover:opacity-90"
                    onClick={() => handleSubmit('published')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Publish Course
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
