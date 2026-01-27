import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  FileText,
  Save,
  ChevronRight
} from 'lucide-react';
import type { AssessmentSubmission, Assessment, Profile } from '@/types/database';

interface AssessmentGraderProps {
  assessmentId: string;
}

interface SubmissionWithDetails extends AssessmentSubmission {
  user?: Profile;
  assessment?: Assessment;
  answers?: any[];
}

export default function AssessmentGrader({ assessmentId }: AssessmentGraderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null);
  const [gradeUpdates, setGradeUpdates] = useState<{ [answerId: string]: { marks: number; feedback: string } }>({});

  useEffect(() => {
    loadData();
  }, [assessmentId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load assessment
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;
      setAssessment(assessmentData as Assessment);

      // Load all submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('assessment_submissions')
        .select(`
          *,
          assessment_answers(
            *,
            question:assessment_questions(*, options:question_options(*))
          )
        `)
        .eq('assessment_id', assessmentId)
        .in('status', ['submitted', 'graded'])
        .order('submitted_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      // Load user profiles
      const userIds = [...new Set(submissionsData.map((s: any) => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      const submissionsWithUsers = submissionsData.map((s: any) => ({
        ...s,
        user: profileMap.get(s.user_id),
        answers: s.assessment_answers || [],
      }));

      setSubmissions(submissionsWithUsers);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeChange = (answerId: string, field: 'marks' | 'feedback', value: string | number) => {
    setGradeUpdates(prev => ({
      ...prev,
      [answerId]: {
        ...prev[answerId],
        [field]: value,
      },
    }));
  };

  const saveGrades = async () => {
    if (!selectedSubmission) return;

    try {
      // Update each answer
      for (const [answerId, updates] of Object.entries(gradeUpdates)) {
        await supabase
          .from('assessment_answers')
          .update({
            marks_obtained: updates.marks,
            grader_feedback: updates.feedback,
            graded_at: new Date().toISOString(),
          })
          .eq('id', answerId);
      }

      // Recalculate total score
      const { data: answersData } = await supabase
        .from('assessment_answers')
        .select('marks_obtained')
        .eq('submission_id', selectedSubmission.id);

      const totalScore = (answersData || []).reduce((sum, a) => sum + (Number(a.marks_obtained) || 0), 0);
      const percentage = assessment ? (totalScore / Number(assessment.total_marks)) * 100 : 0;

      await supabase
        .from('assessment_submissions')
        .update({
          total_score: totalScore,
          percentage: percentage,
          passed: assessment ? totalScore >= Number(assessment.passing_marks) : false,
          manually_graded_at: new Date().toISOString(),
          status: 'graded',
        })
        .eq('id', selectedSubmission.id);

      toast.success('Grades saved successfully');
      setGradeUpdates({});
      loadData();
    } catch (error) {
      console.error('Error saving grades:', error);
      toast.error('Failed to save grades');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="outline" className="bg-warning/10 text-warning">Pending Review</Badge>;
      case 'graded':
        return <Badge variant="outline" className="bg-success/10 text-success">Graded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Grade Submissions</h2>
          <p className="text-muted-foreground">{assessment?.title}</p>
        </div>
        {selectedSubmission && (
          <Button onClick={saveGrades}>
            <Save className="h-4 w-4 mr-2" />
            Save Grades
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Submissions list */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Submissions ({submissions.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {submissions.map(submission => (
                <button
                  key={submission.id}
                  className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                    selectedSubmission?.id === submission.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => {
                    setSelectedSubmission(submission);
                    setGradeUpdates({});
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{submission.user?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          {submission.submitted_at 
                            ? new Date(submission.submitted_at).toLocaleDateString() 
                            : 'Not submitted'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(submission.status)}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  {submission.total_score !== null && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant={submission.passed ? 'default' : 'destructive'}>
                        {submission.total_score?.toFixed(1)} / {assessment?.total_marks}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ({submission.percentage?.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </button>
              ))}
              {submissions.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No submissions yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Grading panel */}
        <Card className="md:col-span-2">
          {selectedSubmission ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedSubmission.user?.full_name || 'Unknown'}</CardTitle>
                    <CardDescription>
                      Attempt #{selectedSubmission.attempt_number} • 
                      Time spent: {Math.floor((selectedSubmission.time_spent_seconds || 0) / 60)} minutes
                    </CardDescription>
                  </div>
                  {selectedSubmission.passed !== null && (
                    <div className="flex items-center gap-2">
                      {selectedSubmission.passed ? (
                        <CheckCircle className="h-6 w-6 text-success" />
                      ) : (
                        <XCircle className="h-6 w-6 text-destructive" />
                      )}
                      <span className="text-2xl font-bold">
                        {selectedSubmission.total_score?.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">
                        / {assessment?.total_marks}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6 max-h-[600px] overflow-y-auto">
                {selectedSubmission.answers?.map((answer: any, index: number) => {
                  const question = answer.question;
                  const isAutoGraded = question?.auto_gradable;
                  const currentGrade = gradeUpdates[answer.id] || {
                    marks: answer.marks_obtained ?? 0,
                    feedback: answer.grader_feedback || '',
                  };

                  return (
                    <div key={answer.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Q{index + 1}</Badge>
                          <Badge variant="secondary">{question?.question_type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {question?.marks} marks
                          </span>
                        </div>
                        {answer.is_correct !== null && (
                          answer.is_correct ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )
                        )}
                      </div>

                      <p className="font-medium">{question?.question_text}</p>

                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Student's Answer:</p>
                        {answer.selected_option_id && question?.options && (
                          <p>
                            {question.options.find((o: any) => o.id === answer.selected_option_id)?.option_text || 'Unknown option'}
                          </p>
                        )}
                        {answer.text_answer && (
                          <p className="whitespace-pre-wrap">{answer.text_answer}</p>
                        )}
                        {answer.file_url && (
                          <a href={answer.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            View uploaded file
                          </a>
                        )}
                      </div>

                      {question?.explanation && (
                        <div className="text-sm">
                          <span className="font-medium">Correct answer explanation: </span>
                          {question.explanation}
                        </div>
                      )}

                      {!isAutoGraded && (
                        <div className="grid md:grid-cols-2 gap-4 pt-2 border-t">
                          <div className="space-y-2">
                            <Label>Marks Awarded</Label>
                            <Input
                              type="number"
                              min={0}
                              max={question?.marks || 0}
                              step={0.5}
                              value={currentGrade.marks}
                              onChange={(e) => handleGradeChange(answer.id, 'marks', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Feedback</Label>
                            <Textarea
                              value={currentGrade.feedback}
                              onChange={(e) => handleGradeChange(answer.id, 'feedback', e.target.value)}
                              placeholder="Add feedback for the student"
                              rows={2}
                            />
                          </div>
                        </div>
                      )}

                      {isAutoGraded && (
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Auto-graded: {answer.marks_obtained} marks
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </>
          ) : (
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a submission</h3>
              <p className="text-muted-foreground">
                Click on a submission from the list to start grading
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
