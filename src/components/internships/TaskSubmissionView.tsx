import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  FileCheck, 
  Clock, 
  Calendar, 
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { fromTable } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import type { InternshipTask, InternshipTaskSubmission, TASK_STATUS_LABELS } from '@/types/internship';
import { format } from 'date-fns';

interface TaskSubmissionViewProps {
  enrollmentId: string;
  internshipId: string;
}

interface TaskWithSubmission extends InternshipTask {
  submission?: InternshipTaskSubmission;
}

export function TaskSubmissionView({ enrollmentId, internshipId }: TaskSubmissionViewProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskWithSubmission | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchTasksWithSubmissions();
  }, [enrollmentId, internshipId]);

  const fetchTasksWithSubmissions = async () => {
    try {
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await fromTable('internship_tasks')
        .select('*')
        .eq('internship_id', internshipId)
        .order('sort_order', { ascending: true });

      if (tasksError) throw tasksError;

      // Fetch submissions for this enrollment
      const { data: submissionsData, error: submissionsError } = await fromTable('internship_task_submissions')
        .select('*')
        .eq('enrollment_id', enrollmentId);

      if (submissionsError) throw submissionsError;

      // Merge tasks with submissions
      const tasksWithSubmissions = (tasksData || []).map(task => ({
        ...task,
        submission: submissionsData?.find(s => s.task_id === task.id),
      }));

      setTasks(tasksWithSubmissions);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTask || !user) return;
    if (!submissionText.trim()) {
      toast.error('Please enter your submission');
      return;
    }

    setSubmitting(true);
    try {
      const submissionData = {
        task_id: selectedTask.id,
        enrollment_id: enrollmentId,
        user_id: user.id,
        submission_text: submissionText,
        status: 'submitted',
      };

      if (selectedTask.submission) {
        // Update existing submission
        const { error } = await fromTable('internship_task_submissions')
          .update({ 
            submission_text: submissionText, 
            status: 'submitted',
            submitted_at: new Date().toISOString()
          })
          .eq('id', selectedTask.submission.id);
        if (error) throw error;
      } else {
        // Create new submission
        const { error } = await fromTable('internship_task_submissions')
          .insert(submissionData);
        if (error) throw error;
      }

      toast.success('Task submitted successfully');
      setIsDialogOpen(false);
      setSubmissionText('');
      setSelectedTask(null);
      fetchTasksWithSubmissions();
    } catch (error: any) {
      console.error('Error submitting task:', error);
      toast.error(error.message || 'Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'revision_needed':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'submitted':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <XCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600">Approved</Badge>;
      case 'revision_needed':
        return <Badge className="bg-yellow-500/10 text-yellow-600">Needs Revision</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-500/10 text-blue-600">Under Review</Badge>;
      case 'in_progress':
        return <Badge className="bg-purple-500/10 text-purple-600">In Progress</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(t => t.submission?.status === 'approved').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Internship Progress</CardTitle>
          <CardDescription>
            Complete all tasks to finish your internship
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{tasks.filter(t => t.submission?.status === 'approved').length} of {tasks.length} tasks completed</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Tasks</h3>
        
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No tasks assigned yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                      {getStatusIcon(task.submission?.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{task.title}</h4>
                            {task.is_mandatory && (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(task.submission?.status)}
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span>Max: {task.max_marks} marks</span>
                        </div>
                        {task.submission?.marks_obtained !== undefined && (
                          <div className="flex items-center gap-1 text-green-600">
                            <span>Obtained: {task.submission.marks_obtained} marks</span>
                          </div>
                        )}
                      </div>

                      {/* Mentor Feedback */}
                      {task.submission?.mentor_feedback && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 text-sm font-medium mb-1">
                            <MessageSquare className="h-4 w-4" />
                            Mentor Feedback
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {task.submission.mentor_feedback}
                          </p>
                        </div>
                      )}

                      <div className="mt-4">
                        <Dialog open={isDialogOpen && selectedTask?.id === task.id} onOpenChange={(open) => {
                          setIsDialogOpen(open);
                          if (!open) {
                            setSelectedTask(null);
                            setSubmissionText('');
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm"
                              variant={task.submission?.status === 'approved' ? 'outline' : 'default'}
                              onClick={() => {
                                setSelectedTask(task);
                                setSubmissionText(task.submission?.submission_text || '');
                              }}
                              disabled={task.submission?.status === 'approved'}
                            >
                              {task.submission?.status === 'approved' ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Completed
                                </>
                              ) : task.submission ? (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Update Submission
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Submit Task
                                </>
                              )}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Submit: {task.title}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {task.instructions && (
                                <div className="p-4 bg-muted rounded-lg">
                                  <h4 className="font-medium mb-2">Instructions</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {task.instructions}
                                  </p>
                                </div>
                              )}
                              <div>
                                <label className="text-sm font-medium">Your Submission</label>
                                <Textarea
                                  value={submissionText}
                                  onChange={(e) => setSubmissionText(e.target.value)}
                                  placeholder="Enter your work, links, or detailed response..."
                                  className="mt-2 min-h-48"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleSubmit} disabled={submitting}>
                                  {submitting ? 'Submitting...' : 'Submit'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
