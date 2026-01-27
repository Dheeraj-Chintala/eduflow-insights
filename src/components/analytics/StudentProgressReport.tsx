import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, GraduationCap, TrendingUp, Award, BookOpen, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { StudentProgressStats, CourseCompletionData, TimeRange } from '@/types/analytics';

interface StudentProgressReportProps {
  timeRange: TimeRange;
}

export default function StudentProgressReport({ timeRange }: StudentProgressReportProps) {
  const [stats, setStats] = useState<StudentProgressStats | null>(null);
  const [courseData, setCourseData] = useState<CourseCompletionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const getDateFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case '7d': return new Date(now.setDate(now.getDate() - 7));
      case '30d': return new Date(now.setDate(now.getDate() - 30));
      case '90d': return new Date(now.setDate(now.getDate() - 90));
      case '1y': return new Date(now.setFullYear(now.getFullYear() - 1));
      default: return null;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const dateFilter = getDateFilter();

      // Fetch enrollment stats
      let enrollmentsQuery = supabase.from('enrollments').select('*, courses(title)');
      if (dateFilter) {
        enrollmentsQuery = enrollmentsQuery.gte('enrolled_at', dateFilter.toISOString());
      }
      const { data: enrollments } = await enrollmentsQuery;

      // Fetch all enrollments for course completion data
      const { data: allEnrollments } = await supabase
        .from('enrollments')
        .select('*, courses(id, title)');

      // Fetch certificates
      let certsQuery = supabase.from('certificates').select('id');
      if (dateFilter) {
        certsQuery = certsQuery.gte('issued_at', dateFilter.toISOString());
      }
      const { data: certificates } = await certsQuery;

      // Calculate stats
      const totalStudents = new Set(allEnrollments?.map(e => e.user_id) || []).size;
      const activeStudents = new Set(
        allEnrollments?.filter(e => e.progress > 0 && e.progress < 100).map(e => e.user_id) || []
      ).size;
      const completedCourses = allEnrollments?.filter(e => e.progress === 100).length || 0;
      const averageProgress = allEnrollments?.length 
        ? Math.round(allEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / allEnrollments.length)
        : 0;

      setStats({
        totalStudents,
        activeStudents,
        completedCourses,
        averageProgress,
        enrollmentsThisMonth: enrollments?.length || 0,
        certificatesIssued: certificates?.length || 0,
      });

      // Process course completion data
      const courseMap = new Map<string, CourseCompletionData>();
      allEnrollments?.forEach(enrollment => {
        const courseId = enrollment.course_id;
        const courseTitle = (enrollment.courses as any)?.title || 'Unknown Course';
        
        if (!courseMap.has(courseId)) {
          courseMap.set(courseId, {
            courseId,
            courseTitle,
            totalEnrollments: 0,
            completedCount: 0,
            inProgressCount: 0,
            notStartedCount: 0,
            averageProgress: 0,
            completionRate: 0,
          });
        }

        const course = courseMap.get(courseId)!;
        course.totalEnrollments++;
        if (enrollment.progress === 100) {
          course.completedCount++;
        } else if (enrollment.progress > 0) {
          course.inProgressCount++;
        } else {
          course.notStartedCount++;
        }
        course.averageProgress += enrollment.progress || 0;
      });

      const courseDataArray = Array.from(courseMap.values()).map(course => ({
        ...course,
        averageProgress: course.totalEnrollments > 0 
          ? Math.round(course.averageProgress / course.totalEnrollments) 
          : 0,
        completionRate: course.totalEnrollments > 0 
          ? Math.round((course.completedCount / course.totalEnrollments) * 100) 
          : 0,
      }));

      setCourseData(courseDataArray.sort((a, b) => b.totalEnrollments - a.totalEnrollments).slice(0, 10));
    } catch (error) {
      console.error('Error fetching student progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Students', value: stats?.totalStudents || 0, icon: Users, color: 'text-primary' },
    { label: 'Active Learners', value: stats?.activeStudents || 0, icon: UserCheck, color: 'text-accent' },
    { label: 'Courses Completed', value: stats?.completedCourses || 0, icon: GraduationCap, color: 'text-success' },
    { label: 'Avg. Progress', value: `${stats?.averageProgress || 0}%`, icon: TrendingUp, color: 'text-warning' },
    { label: 'New Enrollments', value: stats?.enrollmentsThisMonth || 0, icon: BookOpen, color: 'text-info' },
    { label: 'Certificates Issued', value: stats?.certificatesIssued || 0, icon: Award, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Course Completion Table */}
      <Card>
        <CardHeader>
          <CardTitle>Course Completion Overview</CardTitle>
          <CardDescription>Progress breakdown by course</CardDescription>
        </CardHeader>
        <CardContent>
          {courseData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No course data available</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-center">Enrolled</TableHead>
                  <TableHead className="text-center">Completed</TableHead>
                  <TableHead className="text-center">In Progress</TableHead>
                  <TableHead className="text-center">Not Started</TableHead>
                  <TableHead>Avg. Progress</TableHead>
                  <TableHead className="text-center">Completion Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseData.map((course) => (
                  <TableRow key={course.courseId}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {course.courseTitle}
                    </TableCell>
                    <TableCell className="text-center">{course.totalEnrollments}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="default" className="bg-success/10 text-success">
                        {course.completedCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{course.inProgressCount}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{course.notStartedCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={course.averageProgress} className="w-20 h-2" />
                        <span className="text-sm text-muted-foreground">{course.averageProgress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={course.completionRate >= 70 ? 'default' : course.completionRate >= 40 ? 'secondary' : 'outline'}
                        className={course.completionRate >= 70 ? 'bg-success text-success-foreground' : ''}
                      >
                        {course.completionRate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
