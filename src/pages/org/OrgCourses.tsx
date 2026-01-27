import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { fromTable } from '@/lib/supabase-helpers';
import { BookOpen, Search, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Course } from '@/types/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function OrgCourses() {
  const { orgId } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (orgId) {
      fetchCourses();
    }
  }, [orgId]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await fromTable('courses')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors = {
    draft: 'bg-warning/10 text-warning border-warning/20',
    published: 'bg-success/10 text-success border-success/20',
    archived: 'bg-muted text-muted-foreground border-muted',
  };


  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Courses</h1>
          <p className="text-muted-foreground mt-1">
            View all courses in your organization (read-only)
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Courses Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              All Courses ({filteredCourses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredCourses.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.map(course => (
                      <TableRow key={course.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                              <BookOpen className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{course.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {course.description || 'No description'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {course.category || '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[course.status] || 'bg-muted text-muted-foreground border-muted'}>
                            {course.status || 'draft'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{course.duration || '—'}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium">No courses found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search' : 'Courses will appear here'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
