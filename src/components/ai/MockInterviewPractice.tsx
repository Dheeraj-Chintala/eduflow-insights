import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Mic, Play, CheckCircle, Clock, MessageSquare, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Question {
  id: string;
  question: string;
  category: string;
  tips?: string;
}

interface Feedback {
  score: number;
  strengths: string[];
  improvements: string[];
  suggestion: string;
}

type InterviewType = 'behavioral' | 'technical' | 'case_study' | 'mixed';
type Difficulty = 'easy' | 'medium' | 'hard';

export const MockInterviewPractice: React.FC = () => {
  const { user } = useAuth();
  const [jobRole, setJobRole] = useState('');
  const [interviewType, setInterviewType] = useState<InterviewType>('behavioral');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions] = useState(5);
  const [response, setResponse] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [interviewId, setInterviewId] = useState<string | null>(null);

  const startInterview = async () => {
    if (!user || !jobRole.trim()) {
      toast.error('Please enter a job role');
      return;
    }

    setIsLoading(true);
    try {
      // Create interview record
      const { data: interview, error } = await supabase
        .from('mock_interviews')
        .insert({
          user_id: user.id,
          job_role: jobRole,
          interview_type: interviewType,
          difficulty,
          questions: [],
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      setInterviewId(interview.id);

      // Get first question
      await getNextQuestion();
      setIsStarted(true);
    } catch (error) {
      console.error('Failed to start interview:', error);
      toast.error('Failed to start interview');
    } finally {
      setIsLoading(false);
    }
  };

  const getNextQuestion = async () => {
    setIsLoading(true);
    setFeedback(null);
    setResponse('');

    try {
      const res = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'mock_interview',
          messages: [
            {
              role: 'user',
              content: `Give me interview question ${questionIndex + 1} of ${totalQuestions} for a ${jobRole} position. Type: ${interviewType}, Difficulty: ${difficulty}.`
            }
          ],
          context: { jobRole, interviewType, difficulty, questionNumber: questionIndex + 1 }
        }
      });

      if (res.error) throw res.error;

      try {
        const parsed = JSON.parse(res.data.content);
        if (parsed.type === 'question') {
          setCurrentQuestion({
            id: `q-${questionIndex + 1}`,
            question: parsed.question,
            category: parsed.category,
            tips: parsed.tips
          });
        }
      } catch {
        // If not JSON, use raw content
        setCurrentQuestion({
          id: `q-${questionIndex + 1}`,
          question: res.data.content,
          category: interviewType
        });
      }
    } catch (error) {
      console.error('Failed to get question:', error);
      toast.error('Failed to get next question');
    } finally {
      setIsLoading(false);
    }
  };

  const submitResponse = async () => {
    if (!response.trim() || !currentQuestion) {
      toast.error('Please provide your response');
      return;
    }

    setIsLoading(true);
    try {
      const res = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'mock_interview',
          messages: [
            {
              role: 'user',
              content: `Question: "${currentQuestion.question}"\n\nMy response: "${response}"\n\nProvide feedback on this interview response.`
            }
          ],
          context: { jobRole, interviewType, difficulty }
        }
      });

      if (res.error) throw res.error;

      try {
        const parsed = JSON.parse(res.data.content);
        if (parsed.type === 'feedback') {
          setFeedback(parsed);
        }
      } catch {
        // Parse feedback from raw text if needed
        setFeedback({
          score: 70,
          strengths: ['Good attempt'],
          improvements: ['Could be more specific'],
          suggestion: res.data.content
        });
      }
    } catch (error) {
      console.error('Failed to get feedback:', error);
      toast.error('Failed to analyze response');
    } finally {
      setIsLoading(false);
    }
  };

  const nextQuestion = async () => {
    if (questionIndex + 1 >= totalQuestions) {
      // End interview
      const avgScore = overallScore || feedback?.score || 70;
      setOverallScore(avgScore);

      if (interviewId) {
        await supabase
          .from('mock_interviews')
          .update({
            status: 'completed',
            overall_score: avgScore,
            completed_at: new Date().toISOString()
          })
          .eq('id', interviewId);
      }
      return;
    }

    setQuestionIndex(prev => prev + 1);
    await getNextQuestion();
  };

  if (!isStarted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-red-500" />
            AI Mock Interview Practice
          </CardTitle>
          <CardDescription>
            Practice interviews with AI-powered feedback to improve your performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="jobRole">Target Job Role</Label>
            <Input
              id="jobRole"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g., Software Engineer, Product Manager"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Interview Type</Label>
              <Select value={interviewType} onValueChange={(v) => setInterviewType(v as InterviewType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="case_study">Case Study</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={startInterview} disabled={isLoading || !jobRole.trim()} className="w-full">
            {isLoading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Preparing...</>
            ) : (
              <><Play className="h-4 w-4 mr-2" /> Start Mock Interview</>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (overallScore !== null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Interview Completed!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-6xl font-bold text-primary">{overallScore}%</div>
          <p className="text-muted-foreground">Overall Performance Score</p>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-6 w-6 ${star <= Math.round(overallScore / 20) ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
              />
            ))}
          </div>
          <Button onClick={() => {
            setIsStarted(false);
            setQuestionIndex(0);
            setOverallScore(null);
            setCurrentQuestion(null);
            setFeedback(null);
          }}>
            Practice Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            Question {questionIndex + 1} of {totalQuestions}
          </CardTitle>
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            {interviewType}
          </Badge>
        </div>
        <Progress value={(questionIndex / totalQuestions) * 100} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {currentQuestion && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium text-lg">{currentQuestion.question}</p>
            {currentQuestion.tips && (
              <p className="text-sm text-muted-foreground mt-2">💡 Tip: {currentQuestion.tips}</p>
            )}
          </div>
        )}

        <div>
          <Label>Your Response</Label>
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Type your answer here..."
            className="mt-1 min-h-[150px]"
            disabled={!!feedback}
          />
        </div>

        {!feedback ? (
          <Button onClick={submitResponse} disabled={isLoading || !response.trim()} className="w-full">
            {isLoading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
            ) : (
              'Submit Response'
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">Feedback</span>
                <Badge variant={feedback.score >= 70 ? 'default' : 'secondary'}>
                  Score: {feedback.score}%
                </Badge>
              </div>
              
              {feedback.strengths?.length > 0 && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-green-600">Strengths:</span>
                  <ul className="text-sm list-disc list-inside">
                    {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              
              {feedback.improvements?.length > 0 && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-yellow-600">Areas to Improve:</span>
                  <ul className="text-sm list-disc list-inside">
                    {feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              
              {feedback.suggestion && (
                <p className="text-sm mt-2 text-muted-foreground">{feedback.suggestion}</p>
              )}
            </div>

            <Button onClick={nextQuestion} className="w-full">
              {questionIndex + 1 >= totalQuestions ? 'Complete Interview' : 'Next Question'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
