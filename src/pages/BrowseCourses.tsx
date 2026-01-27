import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/layouts/AppLayout';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fromTable } from '@/lib/supabase-helpers';
import { BookOpen, Clock, GraduationCap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AdvancedFilters, FilterState } from '@/components/search/AdvancedFilters';
import { useDebounce } from '@/hooks/useDebounce';
import { LazyImage } from '@/components/ui/lazy-image';
import type { Course, Enrollment } from '@/types/database';

export default function BrowseCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    difficulty: '',
    priceRange: [0, 1000],
    freeOnly: false,
    sortBy: 'newest',
  });
  
  const debouncedSearch = useDebounce(filters.search, 300);

  useEffect(() => {
    fetchCourses();
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      // Only fetch published courses - RLS handles visibility rules
      const { data, error } = await fromTable('courses')
        .select('*')
        .eq('status', 'published')
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

  // Memoized filtered and sorted courses
  const displayedCourses = useMemo(() => {
    let filtered = courses.filter(course => {
      // Search filter
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        if (!course.title.toLowerCase().includes(query) && 
            !course.description?.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Category filter
      if (filters.category && filters.category !== 'all' && course.category !== filters.category) {
        return false;
      }
      
      // Difficulty filter
      if (filters.difficulty && filters.difficulty !== 'all' && course.difficulty !== filters.difficulty) {
        return false;
      }
      
      // Free only filter
      if (filters.freeOnly && course.price && course.price > 0) {
        return false;
      }
      
      // Price range filter
      const price = course.price || 0;
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false;
      }
      
      return true;
    });
    
    // Sort
    switch (filters.sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }
    
    return filtered;
  }, [courses, debouncedSearch, filters]);

  // Extract unique categories from courses
  const categories = useMemo(() => {
    const cats = new Set(courses.map(c => c.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [courses]);

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-success/10 text-success border-success/20',
    intermediate: 'bg-warning/10 text-warning border-warning/20',
    advanced: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <header>
          <h1 className="text-3xl font-display font-bold">Browse Courses</h1>
          <p className="text-muted-foreground mt-1">
            Explore and enroll in available courses
          </p>
        </header>

        {/* Advanced Filters */}
        <AdvancedFilters 
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories}
        />

        {/* Results count */}
        {!isLoading && (
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            Showing {displayedCourses.length} of {courses.length} courses
          </p>
        )}

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading courses">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="overflow-hidden" aria-hidden="true">
                <Skeleton className="h-40 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayedCourses.length > 0 ? (
          <div 
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            role="list"
            aria-label="Available courses"
          >
            {displayedCourses.map(course => (
              <Card 
                key={course.id} 
                className="overflow-hidden group hover:shadow-lg transition-all duration-300"
                role="listitem"
              >
                <div className="relative h-40 bg-gradient-primary flex items-center justify-center">
                  {course.thumbnail_url ? (
                    <LazyImage 
                      src={course.thumbnail_url} 
                      alt=""
                      className="w-full h-full object-cover"
                      wrapperClassName="w-full h-full"
                    />
                  ) : (
                    <BookOpen className="h-12 w-12 text-primary-foreground/80" aria-hidden="true" />
                  )}
                  {(!course.price || course.price === 0) && (
                    <Badge className="absolute top-3 right-3 bg-success text-success-foreground">
                      Free
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="font-display font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                      {course.title}
                    </h2>
                    {course.difficulty && (
                      <Badge variant="outline" className={difficultyColors[course.difficulty] || ''}>
                        {course.difficulty}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {course.description || 'No description available'}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      <span>{course.duration || '0h'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" aria-hidden="true" />
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
                  ) : (
                    <Button 
                      className="w-full bg-gradient-primary hover:opacity-90"
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrollingId === course.id}
                      aria-busy={enrollingId === course.id}
                    >
                      {enrollingId === course.id ? 'Enrolling...' : 'Enroll Now'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4" aria-hidden="true">
                <BookOpen className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-display font-semibold mb-2">No courses found</h2>
              <p className="text-muted-foreground max-w-md">
                {filters.search || filters.category || filters.difficulty || filters.freeOnly
                  ? 'Try adjusting your filters to see more results'
                  : 'No courses are currently available. Check back soon!'}
              </p>
              {(filters.search || filters.category || filters.difficulty || filters.freeOnly) && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setFilters({
                    search: '',
                    category: '',
                    difficulty: '',
                    priceRange: [0, 1000],
                    freeOnly: false,
                    sortBy: 'newest',
                  })}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
