import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, TrendingDown, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { DropOffData, LessonDropOff, TimeRange } from '@/types/analytics';

interface DropOffAnalysisProps {
  timeRange: TimeRange;
}

export default function DropOffAnalysis({ timeRange }: DropOffAnalysisProps) {
  const [funnelData, setFunnelData] = useState<DropOffData[]>([]);
  const [lessonDropOffs, setLessonDropOffs] = useState<LessonDropOff[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
    fetchFunnelData();
  }, [timeRange]);

  useEffect(() => {
    if (selectedCourse !== 'all') {
      fetchLessonDropOffs(selectedCourse);
    } else {
      setLessonDropOffs([]);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, title')
      .eq('status', 'published')
      .order('title');
    setCourses(data || []);
  };

  const fetchFunnelData = async () => {
    try {
      setLoading(true);

      // Get enrollment funnel data
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('id, progress, completed_at');

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id');

      const { data: certificates } = await supabase
        .from('certificates')
        .select('id');

      const totalSignups = profiles?.length || 0;
      const totalEnrollments = enrollments?.length || 0;
      const started = enrollments?.filter(e => e.progress > 0).length || 0;
      const halfwayThrough = enrollments?.filter(e => e.progress >= 50).length || 0;
      const completed = enrollments?.filter(e => e.progress === 100).length || 0;
      const certified = certificates?.length || 0;

      const stages: DropOffData[] = [
        { 
          stage: 'Signed Up', 
          count: totalSignups, 
          percentage: 100,
          dropOffRate: 0
        },
        { 
          stage: 'Enrolled in Course', 
          count: totalEnrollments, 
          percentage: totalSignups > 0 ? Math.round((totalEnrollments / totalSignups) * 100) : 0,
          dropOffRate: totalSignups > 0 ? Math.round(((totalSignups - totalEnrollments) / totalSignups) * 100) : 0
        },
        { 
          stage: 'Started Learning', 
          count: started, 
          percentage: totalSignups > 0 ? Math.round((started / totalSignups) * 100) : 0,
          dropOffRate: totalEnrollments > 0 ? Math.round(((totalEnrollments - started) / totalEnrollments) * 100) : 0
        },
        { 
          stage: 'Reached 50%', 
          count: halfwayThrough, 
          percentage: totalSignups > 0 ? Math.round((halfwayThrough / totalSignups) * 100) : 0,
          dropOffRate: started > 0 ? Math.round(((started - halfwayThrough) / started) * 100) : 0
        },
        { 
          stage: 'Completed Course', 
          count: completed, 
          percentage: totalSignups > 0 ? Math.round((completed / totalSignups) * 100) : 0,
          dropOffRate: halfwayThrough > 0 ? Math.round(((halfwayThrough - completed) / halfwayThrough) * 100) : 0
        },
        { 
          stage: 'Earned Certificate', 
          count: certified, 
          percentage: totalSignups > 0 ? Math.round((certified / totalSignups) * 100) : 0,
          dropOffRate: completed > 0 ? Math.round(((completed - certified) / completed) * 100) : 0
        },
      ];

      setFunnelData(stages);
    } catch (error) {
      console.error('Error fetching drop-off data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonDropOffs = async (courseId: string) => {
    try {
      // Get lessons for the course
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, sort_order, module_id, course_modules(title)')
        .eq('course_modules.course_id', courseId)
        .order('sort_order');

      // Get lesson progress
      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('lesson_id, completed_at');

      if (!lessons || !progress) return;

      const lessonStats = lessons.map((lesson) => {
        const lessonProgress = progress.filter(p => p.lesson_id === lesson.id);
        const viewCount = lessonProgress.length;
        const completionCount = lessonProgress.filter(p => p.completed_at !== null).length;
        const dropOffCount = viewCount - completionCount;

        return {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          moduleTitle: (lesson.course_modules as any)?.title || 'Unknown Module',
          viewCount,
          completionCount,
          dropOffCount,
          dropOffRate: viewCount > 0 ? Math.round((dropOffCount / viewCount) * 100) : 0,
        };
      });

      setLessonDropOffs(lessonStats.sort((a, b) => b.dropOffRate - a.dropOffRate).slice(0, 10));
    } catch (error) {
      console.error('Error fetching lesson drop-offs:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
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

  const highestDropOff = funnelData.reduce((max, stage) => 
    stage.dropOffRate > max.dropOffRate ? stage : max
  , funnelData[0] || { stage: '', dropOffRate: 0 });

  return (
    <div className="space-y-6">
      {/* Drop-off Alert */}
      {highestDropOff && highestDropOff.dropOffRate > 30 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-full bg-warning/10">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="font-medium">High Drop-off Detected</p>
              <p className="text-sm text-muted-foreground">
                {highestDropOff.dropOffRate}% of learners drop off at "{highestDropOff.stage}" stage
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Engagement Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Learner Engagement Funnel
          </CardTitle>
          <CardDescription>Track where learners disengage in their journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelData.map((stage, index) => (
              <div key={stage.stage} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{stage.stage}</span>
                    {stage.dropOffRate > 30 && index > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        -{stage.dropOffRate}% drop-off
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{stage.count.toLocaleString()}</span>
                    <Badge variant="outline">{stage.percentage}%</Badge>
                  </div>
                </div>
                <div className="relative">
                  <Progress 
                    value={stage.percentage} 
                    className="h-8"
                  />
                  {index > 0 && stage.dropOffRate > 0 && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
                      <ArrowDown className="h-3 w-3" />
                      {stage.dropOffRate}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lesson-Level Drop-off */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lesson Drop-off Analysis</CardTitle>
              <CardDescription>Identify specific lessons where learners stop</CardDescription>
            </div>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {selectedCourse === 'all' ? (
            <p className="text-center text-muted-foreground py-8">
              Select a course to view lesson-level drop-off data
            </p>
          ) : lessonDropOffs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No lesson data available for this course
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lesson</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead className="text-center">Views</TableHead>
                  <TableHead className="text-center">Completions</TableHead>
                  <TableHead className="text-center">Drop-offs</TableHead>
                  <TableHead className="text-center">Drop-off Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessonDropOffs.map((lesson) => (
                  <TableRow key={lesson.lessonId}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {lesson.lessonTitle}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[150px] truncate">
                      {lesson.moduleTitle}
                    </TableCell>
                    <TableCell className="text-center">{lesson.viewCount}</TableCell>
                    <TableCell className="text-center">{lesson.completionCount}</TableCell>
                    <TableCell className="text-center">{lesson.dropOffCount}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={lesson.dropOffRate > 50 ? 'destructive' : lesson.dropOffRate > 25 ? 'secondary' : 'outline'}
                      >
                        {lesson.dropOffRate}%
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
