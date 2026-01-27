import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardCheck, Loader2, CheckCircle, XCircle, RotateCcw, ExternalLink, Calendar, FileText } from 'lucide-react';
import { fromTable } from '@/lib/supabase-helpers';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import type { Assignment, AssignmentSubmission, SubmissionStatus } from '@/types/instructor';

const STATUS_CONFIG: Record<SubmissionStatus, { label: string; className: string }> = {
  submitted: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/20' },
  graded: { label: 'Graded', className: 'bg-success/10 text-success border-success/20' },
  returned: { label: 'Returned', className: 'bg-info/10 text-info border-info/20' },
  resubmit_requested: { label: 'Resubmit', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export function SubmissionGrader() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Grading form state
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      const { data } = await fromTable('assignments')
        .select('id, title, max_marks, course:courses(title)')
        .eq('instructor_id', user?.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      setAssignments((data as unknown as Assignment[]) || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async (assignmentId: string) => {
    if (!assignmentId) {
      setSubmissions([]);
      return;
    }

    setIsLoadingSubmissions(true);
    try {
      const { data } = await fromTable('assignment_submissions')
        .select('*, profile:profiles(full_name, avatar_url, user_id)')
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

      setSubmissions((data as AssignmentSubmission[]) || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(selectedAssignment);
  }, [selectedAssignment]);

  const openGradingDialog = (submission: AssignmentSubmission) => {
    setGradingSubmission(submission);
    setMarks(submission.marks_obtained?.toString() || '');
    setFeedback(submission.feedback || '');
  };

  const closeGradingDialog = () => {
    setGradingSubmission(null);
    setMarks('');
    setFeedback('');
  };

  const handleGrade = async (newStatus: SubmissionStatus = 'graded') => {
    if (!gradingSubmission) return;

    if (newStatus === 'graded' && !marks) {
      toast({
        title: 'Validation Error',
        description: 'Please enter marks.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const updateData: any = {
        feedback: feedback.trim() || null,
        status: newStatus,
        graded_at: new Date().toISOString(),
        graded_by: user?.id,
      };

      if (newStatus === 'graded') {
        updateData.marks_obtained = parseInt(marks);
      }

      const { error } = await fromTable('assignment_submissions')
        .update(updateData)
        .eq('id', gradingSubmission.id);

      if (error) throw error;

      setSubmissions(submissions.map(s =>
        s.id === gradingSubmission.id
          ? { ...s, ...updateData }
          : s
      ));

      toast({ title: newStatus === 'graded' ? 'Submission graded!' : 'Resubmission requested!' });
      closeGradingDialog();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to grade submission.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const selectedAssignmentData = assignments.find(a => a.id === selectedAssignment);
  const pendingCount = submissions.filter(s => s.status === 'submitted').length;
  const gradedCount = submissions.filter(s => s.status === 'graded').length;

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
          <ClipboardCheck className="h-5 w-5" />
          Grade Submissions
        </CardTitle>
        <CardDescription>Review and grade student assignments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Assignment Selector */}
        <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
          <SelectTrigger>
            <SelectValue placeholder="Select an assignment to grade" />
          </SelectTrigger>
          <SelectContent>
            {assignments.map(assignment => (
              <SelectItem key={assignment.id} value={assignment.id}>
                {assignment.title} - {(assignment as any).course?.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!selectedAssignment ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <ClipboardCheck className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Select an assignment to view submissions</p>
          </div>
        ) : isLoadingSubmissions ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No submissions yet</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-foreground">{submissions.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-warning">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-success">{gradedCount}</p>
                <p className="text-xs text-muted-foreground">Graded</p>
              </div>
            </div>

            {/* Submissions List */}
            <div className="space-y-3">
              {submissions.map(submission => {
                const statusConfig = STATUS_CONFIG[submission.status];
                return (
                  <div
                    key={submission.id}
                    className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={(submission.profile as any)?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials((submission.profile as any)?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">
                            {(submission.profile as any)?.full_name || 'Unknown Student'}
                          </p>
                          <Badge variant="outline" className={statusConfig.className}>
                            {statusConfig.label}
                          </Badge>
                          {submission.is_late && (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive">
                              Late
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')}
                          </span>
                          {submission.submission_number > 1 && (
                            <span>Attempt #{submission.submission_number}</span>
                          )}
                          {submission.marks_obtained !== null && (
                            <span className="font-medium text-foreground">
                              {submission.marks_obtained}/{selectedAssignmentData?.max_marks || 100} marks
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {submission.attachment_url && (
                          <Button size="icon" variant="ghost" asChild>
                            <a href={submission.attachment_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={submission.status === 'submitted' ? 'default' : 'outline'}
                          onClick={() => openGradingDialog(submission)}
                        >
                          {submission.status === 'submitted' ? 'Grade' : 'View'}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>

      {/* Grading Dialog */}
      <Dialog open={!!gradingSubmission} onOpenChange={() => closeGradingDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
          </DialogHeader>
          {gradingSubmission && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium mb-2">
                  {(gradingSubmission.profile as any)?.full_name || 'Unknown Student'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Submitted: {format(new Date(gradingSubmission.submitted_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>

              {gradingSubmission.submission_text && (
                <div className="space-y-2">
                  <Label>Submission</Label>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {gradingSubmission.submission_text}
                  </div>
                </div>
              )}

              {gradingSubmission.attachment_url && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={gradingSubmission.attachment_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Attachment
                  </a>
                </Button>
              )}

              <div className="space-y-2">
                <Label htmlFor="marks">
                  Marks (out of {selectedAssignmentData?.max_marks || 100})
                </Label>
                <Input
                  id="marks"
                  type="number"
                  min="0"
                  max={selectedAssignmentData?.max_marks || 100}
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  placeholder="Enter marks"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide feedback for the student..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleGrade('graded')}
                  disabled={isSaving}
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit Grade
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleGrade('resubmit_requested')}
                  disabled={isSaving}
                  variant="outline"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Request Resubmit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
