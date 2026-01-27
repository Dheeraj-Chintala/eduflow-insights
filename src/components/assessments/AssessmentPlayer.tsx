import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import type { Assessment, AssessmentQuestion, AssessmentSubmission, QuestionOption } from '@/types/database';

interface AssessmentPlayerProps {
  assessmentId: string;
  onComplete?: (submission: AssessmentSubmission) => void;
  onExit?: () => void;
}

interface AnswerState {
  [questionId: string]: {
    selectedOptionId?: string;
    textAnswer?: string;
    fileUrl?: string;
  };
}

export default function AssessmentPlayer({ assessmentId, onComplete, onExit }: AssessmentPlayerProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [submission, setSubmission] = useState<AssessmentSubmission | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const loadAssessment = async () => {
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

      // Load questions with options
      const { data: questionsData, error: questionsError } = await supabase
        .from('assessment_questions')
        .select('*, question_options(*)')
        .eq('assessment_id', assessmentId)
        .order('sort_order');

      if (questionsError) throw questionsError;

      let processedQuestions = questionsData.map((q: any) => ({
        ...q,
        options: q.question_options || [],
      })) as AssessmentQuestion[];

      // Randomize if needed
      if (assessmentData.randomize_questions) {
        processedQuestions = shuffleArray(processedQuestions);
      }

      if (assessmentData.randomize_options) {
        processedQuestions = processedQuestions.map(q => ({
          ...q,
          options: q.options ? shuffleArray([...q.options]) : [],
        }));
      }

      setQuestions(processedQuestions);

      // Check for existing in-progress submission
      const { data: existingSubmission } = await supabase
        .from('assessment_submissions')
        .select('*, assessment_answers(*)')
        .eq('assessment_id', assessmentId)
        .eq('user_id', user?.id)
        .eq('status', 'in_progress')
        .single();

      if (existingSubmission && assessmentData.allow_resume) {
        setSubmission(existingSubmission as AssessmentSubmission);
        
        // Restore answers
        const restoredAnswers: AnswerState = {};
        (existingSubmission.assessment_answers || []).forEach((a: any) => {
          restoredAnswers[a.question_id] = {
            selectedOptionId: a.selected_option_id,
            textAnswer: a.text_answer,
            fileUrl: a.file_url,
          };
        });
        setAnswers(restoredAnswers);

        // Restore timer
        if (assessmentData.duration_minutes) {
          const elapsed = Math.floor(
            (new Date().getTime() - new Date(existingSubmission.started_at).getTime()) / 1000
          );
          const remaining = assessmentData.duration_minutes * 60 - elapsed;
          setTimeRemaining(Math.max(0, remaining));
        }
      } else {
        // Create new submission
        await startNewSubmission(assessmentData);
      }
    } catch (error) {
      console.error('Error loading assessment:', error);
      toast.error('Failed to load assessment');
    } finally {
      setIsLoading(false);
    }
  };

  const startNewSubmission = async (assessmentData: any) => {
    // Check attempt limits
    const { count } = await supabase
      .from('assessment_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('assessment_id', assessmentId)
      .eq('user_id', user?.id);

    if (assessmentData.max_attempts > 0 && (count || 0) >= assessmentData.max_attempts) {
      toast.error('Maximum attempts reached');
      onExit?.();
      return;
    }

    const { data: newSubmission, error } = await supabase
      .from('assessment_submissions')
      .insert({
        assessment_id: assessmentId,
        user_id: user?.id,
        attempt_number: (count || 0) + 1,
        status: 'in_progress',
        question_order: questions.map(q => q.id),
      })
      .select()
      .single();

    if (error) throw error;
    setSubmission(newSubmission as AssessmentSubmission);

    if (assessmentData.duration_minutes) {
      setTimeRemaining(assessmentData.duration_minutes * 60);
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = async (questionId: string, answer: Partial<AnswerState[string]>) => {
    const newAnswers = {
      ...answers,
      [questionId]: { ...answers[questionId], ...answer },
    };
    setAnswers(newAnswers);

    // Auto-save answer
    if (submission) {
      const answerData = {
        submission_id: submission.id,
        question_id: questionId,
        selected_option_id: answer.selectedOptionId || null,
        text_answer: answer.textAnswer || null,
        file_url: answer.fileUrl || null,
      };

      await supabase
        .from('assessment_answers')
        .upsert(answerData, { onConflict: 'submission_id,question_id' });
    }
  };

  const handleAutoSubmit = useCallback(async () => {
    toast.info('Time is up! Submitting your answers...');
    await handleSubmit();
  }, [answers, submission]);

  const handleSubmit = async () => {
    if (!submission) return;

    setIsSubmitting(true);
    try {
      // Save all answers
      const answersToInsert = Object.entries(answers).map(([questionId, answer]) => ({
        submission_id: submission.id,
        question_id: questionId,
        selected_option_id: answer.selectedOptionId || null,
        text_answer: answer.textAnswer || null,
        file_url: answer.fileUrl || null,
      }));

      await supabase
        .from('assessment_answers')
        .upsert(answersToInsert, { onConflict: 'submission_id,question_id' });

      // Update submission status
      await supabase
        .from('assessment_submissions')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          time_spent_seconds: assessment?.duration_minutes 
            ? (assessment.duration_minutes * 60) - (timeRemaining || 0)
            : 0,
        })
        .eq('id', submission.id);

      // Trigger auto-grading
      await supabase.rpc('auto_grade_submission', { submission_uuid: submission.id });

      // Reload submission with results
      const { data: gradedSubmission } = await supabase
        .from('assessment_submissions')
        .select('*, assessment_answers(*, question:assessment_questions(*, options:question_options(*)))')
        .eq('id', submission.id)
        .single();

      if (gradedSubmission) {
        setSubmission(gradedSubmission as AssessmentSubmission);
        setShowResults(true);
        onComplete?.(gradedSubmission as AssessmentSubmission);
      }

      toast.success('Assessment submitted successfully!');
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!assessment || questions.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Assessment not found or has no questions.</AlertDescription>
      </Alert>
    );
  }

  if (showResults && submission) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {submission.passed ? (
              <span className="text-success flex items-center justify-center gap-2">
                <CheckCircle className="h-8 w-8" />
                Congratulations! You Passed!
              </span>
            ) : (
              <span className="text-destructive flex items-center justify-center gap-2">
                <XCircle className="h-8 w-8" />
                Assessment Not Passed
              </span>
            )}
          </CardTitle>
          <CardDescription>{assessment.title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-3xl font-bold">{submission.total_score?.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Score</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-3xl font-bold">{submission.percentage?.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Percentage</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Passing marks: {assessment.passing_marks}</span>
              <span>Total marks: {assessment.total_marks}</span>
            </div>
            <Progress value={submission.percentage || 0} />
          </div>

          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={onExit}>
              Back to Course
            </Button>
            {assessment.show_correct_answers && (
              <Button onClick={() => setShowResults(false)}>
                Review Answers
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with timer and progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">{assessment.title}</h2>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            {timeRemaining !== null && (
              <div className={`flex items-center gap-2 ${timeRemaining < 300 ? 'text-destructive' : ''}`}>
                <Clock className="h-5 w-5" />
                <span className="font-mono text-xl">{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>
          <Progress value={progress} className="mt-4" />
        </CardContent>
      </Card>

      {/* Question navigation pills */}
      <div className="flex flex-wrap gap-2">
        {questions.map((q, index) => (
          <Button
            key={q.id}
            variant={index === currentQuestionIndex ? 'default' : answers[q.id] ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setCurrentQuestionIndex(index)}
            className="w-10 h-10"
          >
            {index + 1}
          </Button>
        ))}
      </div>

      {/* Current question */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{currentQuestion.marks} marks</Badge>
            <Badge variant="secondary">
              {currentQuestion.question_type === 'mcq' ? 'Multiple Choice' :
               currentQuestion.question_type === 'true_false' ? 'True/False' :
               currentQuestion.question_type === 'descriptive' ? 'Descriptive' :
               currentQuestion.question_type === 'case_study' ? 'Case Study' :
               currentQuestion.question_type === 'file_upload' ? 'File Upload' : 'Fill in Blank'}
            </Badge>
          </div>
          <CardTitle className="text-lg mt-2">
            {currentQuestion.question_text}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion.question_type === 'case_study' && currentQuestion.case_study_content && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Case Study</span>
              </div>
              <p className="whitespace-pre-wrap">{currentQuestion.case_study_content}</p>
            </div>
          )}

          {(currentQuestion.question_type === 'mcq' || currentQuestion.question_type === 'true_false') && 
           currentQuestion.options && (
            <RadioGroup
              value={answers[currentQuestion.id]?.selectedOptionId || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, { selectedOptionId: value })}
            >
              {currentQuestion.options.map((option: QuestionOption) => (
                <div key={option.id} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    {option.option_text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {(currentQuestion.question_type === 'descriptive' || 
            currentQuestion.question_type === 'case_study' ||
            currentQuestion.question_type === 'fill_blank') && (
            <Textarea
              value={answers[currentQuestion.id]?.textAnswer || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, { textAnswer: e.target.value })}
              placeholder="Enter your answer here..."
              rows={6}
            />
          )}

          {currentQuestion.question_type === 'file_upload' && (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <p className="text-muted-foreground">
                File upload functionality coming soon
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Allowed types: {currentQuestion.allowed_file_types?.join(', ') || 'Any'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentQuestionIndex < questions.length - 1 ? (
          <Button
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
          </Button>
        )}
      </div>
    </div>
  );
}
