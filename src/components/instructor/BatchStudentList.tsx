import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Users, Search, Mail, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { fromTable } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import type { Course, CourseBatch } from '@/types/database';

interface EnrolledStudent {
  id: string;
  user_id: string;
  course_id: string;
  batch_id: string | null;
  enrolled_at: string;
  progress: number;
  completed_at: string | null;
  profile: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function BatchStudentList() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<CourseBatch[]>([]);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const { data } = await fromTable('courses')
        .select('id, title')
        .eq('instructor_id', user?.id)
        .order('title');

      setCourses((data as Course[]) || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBatches = async (courseId: string) => {
    if (!courseId) {
      setBatches([]);
      return;
    }

    const { data } = await fromTable('course_batches')
      .select('*')
      .eq('course_id', courseId)
      .order('course_start');

    setBatches((data as CourseBatch[]) || []);
  };

  const fetchStudents = async () => {
    if (!selectedCourse) return;

    setIsLoadingStudents(true);
    try {
      let query = fromTable('enrollments')
        .select('id, user_id, course_id, batch_id, enrolled_at, progress, completed_at, profile:profiles(full_name, avatar_url)')
        .eq('course_id', selectedCourse);

      if (selectedBatch) {
        query = query.eq('batch_id', selectedBatch);
      }

      const { data } = await query.order('enrolled_at', { ascending: false });

      setStudents((data as unknown as EnrolledStudent[]) || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (selectedCourse) {
      fetchBatches(selectedCourse);
      fetchStudents();
    } else {
      setBatches([]);
      setStudents([]);
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedCourse) {
      fetchStudents();
    }
  }, [selectedBatch]);

  const handleCourseChange = (value: string) => {
    setSelectedCourse(value);
    setSelectedBatch('');
    setStudents([]);
  };

  const filteredStudents = students.filter(student => {
    if (!searchQuery) return true;
    const name = (student.profile as any)?.full_name?.toLowerCase() || '';
    return name.includes(searchQuery.toLowerCase());
  });

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const stats = {
    total: students.length,
    completed: students.filter(s => s.progress === 100 || s.completed_at).length,
    avgProgress: students.length > 0 
      ? Math.round(students.reduce((acc, s) => acc + s.progress, 0) / students.length) 
      : 0,
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Student List
        </CardTitle>
        <CardDescription>View students enrolled in your courses by batch</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Select value={selectedCourse} onValueChange={handleCourseChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {batches.length > 0 && (
            <div className="flex-1 min-w-[200px]">
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger>
                  <SelectValue placeholder="All batches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All batches</SelectItem>
                  {batches.map(batch => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {selectedCourse && (
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {!selectedCourse ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Select a course to view enrolled students</p>
          </div>
        ) : isLoadingStudents ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No students enrolled yet</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Students</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.avgProgress}%</p>
                <p className="text-xs text-muted-foreground">Avg Progress</p>
              </div>
            </div>

            {/* Student List */}
            <div className="space-y-3">
              {filteredStudents.map(student => (
                <div
                  key={student.id}
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={(student.profile as any)?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials((student.profile as any)?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">
                          {(student.profile as any)?.full_name || 'Unknown Student'}
                        </p>
                        {student.completed_at && (
                          <Badge variant="outline" className="bg-success/10 text-success">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Enrolled: {format(new Date(student.enrolled_at), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {student.progress}% complete
                        </span>
                      </div>
                    </div>
                    <div className="w-32 hidden sm:block">
                      <Progress value={student.progress} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
