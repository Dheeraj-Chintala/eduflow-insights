import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/layouts/AppLayout';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fromTable } from '@/lib/supabase-helpers';
import { BookOpen, Clock, PlusCircle, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Course } from '@/types/database';

export default function MyCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyCourses();
    }
  }, [user]);

  const fetchMyCourses = async () => {
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

  const statusColors: Record<string, string> = {
    draft: 'bg-warning/10 text-warning border-warning/20',
    published: 'bg-success/10 text-success border-success/20',
    archived: 'bg-muted text-muted-foreground border-muted',
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">My Courses</h1>
            <p className="text-muted-foreground mt-1">
              Manage the courses you've created
            </p>
          </div>
          <Button asChild className="bg-gradient-primary hover:opacity-90">
            <Link to="/courses/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Course
            </Link>
          </Button>
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40 w-full" />
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
              <Card key={course.id} className="overflow-hidden group hover:shadow-lg transition-all">
                <div className="relative h-40 bg-gradient-primary flex items-center justify-center">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="h-12 w-12 text-primary-foreground/80" />
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className={`${statusColors[course.status] || ''} backdrop-blur-sm`}>
                      {course.status}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-display font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {course.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{course.category || 'General'}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/courses/${course.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Course
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <BookOpen className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">No courses yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Create your first course to start sharing your knowledge.
              </p>
              <Button asChild className="bg-gradient-primary hover:opacity-90">
                <Link to="/courses/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Course
                </Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
