import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/layouts/AppLayout';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { fromTable } from '@/lib/supabase-helpers';
import { BookOpen, Clock, Search, Filter, Plus, GraduationCap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { Course, Enrollment } from '@/types/database';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Courses() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const isTrainer = hasRole('trainer') || hasRole('mentor');
  const isAdmin = hasRole('super_admin') || hasRole('admin') || hasRole('sub_admin');

  useEffect(() => {
    fetchCourses();
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await fromTable('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await fromTable('enrollments')
        .select('*');

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!user) return;

    setEnrollingId(courseId);
    try {
      const { error } = await fromTable('enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          progress: 0,
        } as any);

      if (error) throw error;

      toast({
        title: 'Enrolled successfully!',
        description: 'You can now access this course.',
      });

      fetchEnrollments();
    } catch (error: any) {
      toast({
        title: 'Enrollment failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setEnrollingId(null);
    }
  };

  const isEnrolled = (courseId: string) => {
    return enrollments.some(e => e.course_id === courseId);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
            <h1 className="text-3xl font-display font-bold">Courses</h1>
            <p className="text-muted-foreground mt-1">
              {isTrainer 
                ? 'Manage your courses or explore others'
                : 'Explore and enroll in available courses'}
            </p>
          </div>
          {isTrainer && (
            <Button asChild className="bg-gradient-primary hover:opacity-90">
              <Link to="/instructor/courses/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Link>
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {(isTrainer || isAdmin) && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map(course => (
              <Card key={course.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="relative h-40 bg-gradient-primary flex items-center justify-center">
                  {course.thumbnail_url ? (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="h-12 w-12 text-primary-foreground/80" />
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Badge variant="outline" className={`${statusColors[course.status] || ''} bg-background/90 backdrop-blur-sm`}>
                      {course.status}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-display font-semibold line-clamp-1 group-hover:text-primary transition-colors mb-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {course.description || 'No description available'}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      <span>{course.category || 'General'}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  {isEnrolled(course.id) ? (
                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/courses/${course.id}`}>
                        Continue Learning
                      </Link>
                    </Button>
                  ) : course.instructor_id === user?.id ? (
                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/instructor/courses/${course.id}/edit`}>
                        Edit Course
                      </Link>
                    </Button>
                  ) : course.status === 'published' ? (
                    <Button 
                      className="w-full bg-gradient-primary hover:opacity-90"
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrollingId === course.id}
                    >
                      {enrollingId === course.id ? 'Enrolling...' : 'Enroll Now'}
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Not Available
                    </Button>
                  )}
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
              <h3 className="text-xl font-display font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {searchQuery 
                  ? 'Try adjusting your search or filters'
                  : 'Courses will appear here once they are created and published.'}
              </p>
              {isTrainer && (
                <Button asChild className="bg-gradient-primary hover:opacity-90">
                  <Link to="/instructor/courses/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Course
                  </Link>
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
