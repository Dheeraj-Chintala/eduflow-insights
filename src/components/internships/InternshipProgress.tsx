import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Award,
  FileCheck,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { fromTable } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import type { InternshipEnrollment, InternshipTask, InternshipTaskSubmission } from '@/types/internship';
import { format } from 'date-fns';

interface EnrollmentWithDetails extends InternshipEnrollment {
  user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  tasksCompleted?: number;
  totalTasks?: number;
}

interface InternshipProgressProps {
  internshipId: string;
}

export function InternshipProgress({ internshipId }: InternshipProgressProps) {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [tasks, setTasks] = useState<InternshipTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [internshipId]);

  const fetchData = async () => {
    try {
      // Fetch enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await fromTable('internship_enrollments')
        .select('*')
        .eq('internship_id', internshipId);

      if (enrollmentsError) throw enrollmentsError;

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await fromTable('internship_tasks')
        .select('*')
        .eq('internship_id', internshipId);

      if (tasksError) throw tasksError;

      // Fetch user profiles
      const userIds = [...new Set((enrollmentsData || []).map(e => e.user_id))];
      const { data: profiles } = await fromTable('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      // Fetch submissions for all enrollments
      const enrollmentIds = (enrollmentsData || []).map(e => e.id);
      const { data: submissions } = await fromTable('internship_task_submissions')
        .select('*')
        .in('enrollment_id', enrollmentIds)
        .eq('status', 'approved');

      // Calculate progress for each enrollment
      const enrichedEnrollments = (enrollmentsData || []).map(enrollment => {
        const userSubmissions = (submissions || []).filter(s => s.enrollment_id === enrollment.id);
        return {
          ...enrollment,
          user: profiles?.find(p => p.user_id === enrollment.user_id),
          tasksCompleted: userSubmissions.length,
          totalTasks: tasksData?.length || 0,
        };
      });

      setEnrollments(enrichedEnrollments);
      setTasks(tasksData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (enrollmentId: string) => {
    try {
      const { error } = await fromTable('internship_enrollments')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          actual_end_date: new Date().toISOString().split('T')[0],
          progress: 100,
        })
        .eq('id', enrollmentId);

      if (error) throw error;
      toast.success('Internship marked as completed');
      fetchData();
    } catch (error: any) {
      console.error('Error completing internship:', error);
      toast.error(error.message || 'Failed to complete internship');
    }
  };

  const calculateProgress = (enrollment: EnrollmentWithDetails) => {
    if (!enrollment.totalTasks || enrollment.totalTasks === 0) return 0;
    return Math.round((enrollment.tasksCompleted! / enrollment.totalTasks) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        {[1, 2].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const activeEnrollments = enrollments.filter(e => !e.is_completed);
  const completedEnrollments = enrollments.filter(e => e.is_completed);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{enrollments.length}</p>
                <p className="text-sm text-muted-foreground">Total Interns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeEnrollments.length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedEnrollments.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <FileCheck className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasks.length}</p>
                <p className="text-sm text-muted-foreground">Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intern Progress */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active ({activeEnrollments.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedEnrollments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeEnrollments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active interns</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeEnrollments.map((enrollment) => {
                const progress = calculateProgress(enrollment);
                return (
                  <Card key={enrollment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={enrollment.user?.avatar_url} />
                          <AvatarFallback>
                            {enrollment.user?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{enrollment.user?.full_name || 'Unknown'}</h4>
                              <p className="text-sm text-muted-foreground">
                                Started: {format(new Date(enrollment.start_date), 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {enrollment.tasksCompleted}/{enrollment.totalTasks} tasks
                            </Badge>
                          </div>
                          <div className="mt-3 space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>Progress</span>
                              <span className="font-medium">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                          {progress === 100 && (
                            <div className="mt-3">
                              <Button 
                                size="sm"
                                onClick={() => markAsCompleted(enrollment.id)}
                              >
                                <Award className="h-4 w-4 mr-2" />
                                Mark as Completed
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedEnrollments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No completed internships yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {completedEnrollments.map((enrollment) => (
                <Card key={enrollment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={enrollment.user?.avatar_url} />
                        <AvatarFallback>
                          {enrollment.user?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{enrollment.user?.full_name || 'Unknown'}</h4>
                            <p className="text-sm text-muted-foreground">
                              Completed: {enrollment.completed_at ? format(new Date(enrollment.completed_at), 'MMM dd, yyyy') : 'N/A'}
                            </p>
                          </div>
                          <Badge className="bg-green-500/10 text-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Award className="h-4 w-4 mr-2" />
                            Issue Certificate
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
