import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Clock, 
  CheckCircle, 
  FileText, 
  Upload,
  Settings,
  ListChecks,
  Save
} from 'lucide-react';
import type { Assessment, AssessmentQuestion, QuestionOption, QuestionType, AssessmentType } from '@/types/database';

interface AssessmentBuilderProps {
  courseId: string;
  assessmentId?: string;
  onSave?: (assessment: Assessment) => void;
  onCancel?: () => void;
}

const QUESTION_TYPES: { value: QuestionType; label: string; icon: React.ReactNode }[] = [
  { value: 'mcq', label: 'Multiple Choice', icon: <ListChecks className="h-4 w-4" /> },
  { value: 'true_false', label: 'True/False', icon: <CheckCircle className="h-4 w-4" /> },
  { value: 'descriptive', label: 'Descriptive', icon: <FileText className="h-4 w-4" /> },
  { value: 'file_upload', label: 'File Upload', icon: <Upload className="h-4 w-4" /> },
  { value: 'case_study', label: 'Case Study', icon: <FileText className="h-4 w-4" /> },
  { value: 'fill_blank', label: 'Fill in Blank', icon: <FileText className="h-4 w-4" /> },
];

const ASSESSMENT_TYPES: { value: AssessmentType; label: string }[] = [
  { value: 'quiz', label: 'Quiz' },
  { value: 'exam', label: 'Exam' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'case_study', label: 'Case Study' },
];

interface LocalOption {
  id?: string;
  localId: string;
  option_text: string;
  option_media_url: string | null;
  is_correct: boolean;
  sort_order: number;
}

interface LocalQuestion {
  id?: string;
  localId: string;
  question_type: QuestionType;
  question_text: string;
  question_media_url: string | null;
  explanation: string | null;
  marks: number;
  sort_order: number;
  case_study_content: string | null;
  allowed_file_types: string[] | null;
  max_file_size_mb: number;
  auto_gradable: boolean;
  grading_rubric: string | null;
  is_required: boolean;
  options: LocalOption[];
}

export default function AssessmentBuilder({ courseId, assessmentId, onSave, onCancel }: AssessmentBuilderProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  
  // Assessment settings
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('quiz');
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [totalMarks, setTotalMarks] = useState(100);
  const [passingMarks, setPassingMarks] = useState(40);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeMarkValue, setNegativeMarkValue] = useState(0);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [randomizeOptions, setRandomizeOptions] = useState(false);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [showScoreImmediately, setShowScoreImmediately] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [allowResume, setAllowResume] = useState(true);
  const [instructions, setInstructions] = useState('');
  
  // Questions
  const [questions, setQuestions] = useState<LocalQuestion[]>([]);

  useEffect(() => {
    if (assessmentId) {
      loadAssessment();
    }
  }, [assessmentId]);

  const loadAssessment = async () => {
    if (!assessmentId) return;
    
    setIsLoading(true);
    try {
      const { data: assessment, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();
      
      if (error) throw error;
      
      setTitle(assessment.title);
      setDescription(assessment.description || '');
      setAssessmentType(assessment.assessment_type as AssessmentType);
      setDurationMinutes(assessment.duration_minutes);
      setTotalMarks(Number(assessment.total_marks));
      setPassingMarks(Number(assessment.passing_marks));
      setNegativeMarking(assessment.negative_marking);
      setNegativeMarkValue(Number(assessment.negative_mark_value) || 0);
      setRandomizeQuestions(assessment.randomize_questions);
      setRandomizeOptions(assessment.randomize_options);
      setShowCorrectAnswers(assessment.show_correct_answers);
      setShowScoreImmediately(assessment.show_score_immediately);
      setMaxAttempts(assessment.max_attempts);
      setAllowResume(assessment.allow_resume);
      setInstructions(assessment.instructions || '');

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('assessment_questions')
        .select('*, question_options(*)')
        .eq('assessment_id', assessmentId)
        .order('sort_order');
      
      if (questionsError) throw questionsError;
      
      const localQuestions: LocalQuestion[] = (questionsData || []).map((q: any) => ({
        ...q,
        localId: q.id,
        options: (q.question_options || []).map((o: any) => ({
          ...o,
          localId: o.id,
        })),
      }));
      
      setQuestions(localQuestions);
    } catch (error) {
      console.error('Error loading assessment:', error);
      toast.error('Failed to load assessment');
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = (type: QuestionType = 'mcq') => {
    const newQuestion: LocalQuestion = {
      localId: crypto.randomUUID(),
      question_type: type,
      question_text: '',
      question_media_url: null,
      explanation: null,
      marks: 1,
      sort_order: questions.length,
      case_study_content: null,
      allowed_file_types: type === 'file_upload' ? ['pdf', 'doc', 'docx'] : null,
      max_file_size_mb: 10,
      auto_gradable: type === 'mcq' || type === 'true_false',
      grading_rubric: null,
      is_required: true,
      options: type === 'mcq' ? [
        { localId: crypto.randomUUID(), option_text: '', option_media_url: null, is_correct: false, sort_order: 0 },
        { localId: crypto.randomUUID(), option_text: '', option_media_url: null, is_correct: false, sort_order: 1 },
        { localId: crypto.randomUUID(), option_text: '', option_media_url: null, is_correct: false, sort_order: 2 },
        { localId: crypto.randomUUID(), option_text: '', option_media_url: null, is_correct: false, sort_order: 3 },
      ] : type === 'true_false' ? [
        { localId: crypto.randomUUID(), option_text: 'True', option_media_url: null, is_correct: false, sort_order: 0 },
        { localId: crypto.randomUUID(), option_text: 'False', option_media_url: null, is_correct: false, sort_order: 1 },
      ] : [],
    };
    setQuestions([...questions, newQuestion]);
    setActiveTab('questions');
  };

  const updateQuestion = (localId: string, updates: Partial<LocalQuestion>) => {
    setQuestions(questions.map(q => 
      q.localId === localId ? { ...q, ...updates } : q
    ));
  };

  const removeQuestion = (localId: string) => {
    setQuestions(questions.filter(q => q.localId !== localId));
  };

  const addOption = (questionLocalId: string) => {
    setQuestions(questions.map(q => {
      if (q.localId === questionLocalId) {
        return {
          ...q,
          options: [
            ...q.options,
            {
              localId: crypto.randomUUID(),
              option_text: '',
              option_media_url: null,
              is_correct: false,
              sort_order: q.options.length,
            },
          ],
        };
      }
      return q;
    }));
  };

  const updateOption = (questionLocalId: string, optionLocalId: string, updates: Partial<LocalOption>) => {
    setQuestions(questions.map(q => {
      if (q.localId === questionLocalId) {
        return {
          ...q,
          options: q.options.map(o => 
            o.localId === optionLocalId ? { ...o, ...updates } : o
          ),
        };
      }
      return q;
    }));
  };

  const removeOption = (questionLocalId: string, optionLocalId: string) => {
    setQuestions(questions.map(q => {
      if (q.localId === questionLocalId) {
        return {
          ...q,
          options: q.options.filter(o => o.localId !== optionLocalId),
        };
      }
      return q;
    }));
  };

  const setCorrectOption = (questionLocalId: string, optionLocalId: string) => {
    setQuestions(questions.map(q => {
      if (q.localId === questionLocalId) {
        return {
          ...q,
          options: q.options.map(o => ({
            ...o,
            is_correct: o.localId === optionLocalId,
          })),
        };
      }
      return q;
    }));
  };

  const handleSave = async (publish: boolean = false) => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    setIsLoading(true);
    try {
      const assessmentData = {
        course_id: courseId,
        title,
        description: description || null,
        assessment_type: assessmentType,
        status: publish ? 'published' as const : 'draft' as const,
        duration_minutes: durationMinutes,
        total_marks: totalMarks,
        passing_marks: passingMarks,
        negative_marking: negativeMarking,
        negative_mark_value: negativeMarkValue,
        randomize_questions: randomizeQuestions,
        randomize_options: randomizeOptions,
        show_correct_answers: showCorrectAnswers,
        show_score_immediately: showScoreImmediately,
        max_attempts: maxAttempts,
        allow_resume: allowResume,
        instructions: instructions || null,
        created_by: user?.id!,
      };

      let savedAssessmentId = assessmentId;
      
      if (assessmentId) {
        const { error } = await supabase
          .from('assessments')
          .update(assessmentData)
          .eq('id', assessmentId);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('assessments')
          .insert([assessmentData])
          .select()
          .single();
        
        if (error) throw error;
        savedAssessmentId = data.id;
      }

      // Delete existing questions if updating
      if (assessmentId) {
        await supabase
          .from('assessment_questions')
          .delete()
          .eq('assessment_id', assessmentId);
      }

      // Insert questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const { data: questionData, error: questionError } = await supabase
          .from('assessment_questions')
          .insert({
            assessment_id: savedAssessmentId,
            question_type: q.question_type,
            question_text: q.question_text,
            question_media_url: q.question_media_url,
            explanation: q.explanation,
            marks: q.marks,
            sort_order: i,
            case_study_content: q.case_study_content,
            allowed_file_types: q.allowed_file_types,
            max_file_size_mb: q.max_file_size_mb,
            auto_gradable: q.auto_gradable,
            grading_rubric: q.grading_rubric,
            is_required: q.is_required,
          })
          .select()
          .single();
        
        if (questionError) throw questionError;

        // Insert options for MCQ/true-false
        if (q.options.length > 0 && questionData) {
          const optionsData = q.options.map((o, idx) => ({
            question_id: questionData.id,
            option_text: o.option_text,
            option_media_url: o.option_media_url,
            is_correct: o.is_correct,
            sort_order: idx,
          }));
          
          const { error: optionsError } = await supabase
            .from('question_options')
            .insert(optionsData);
          
          if (optionsError) throw optionsError;
        }
      }

      toast.success(publish ? 'Assessment published!' : 'Assessment saved as draft');
      
      if (onSave && savedAssessmentId) {
        const { data } = await supabase
          .from('assessments')
          .select('*')
          .eq('id', savedAssessmentId)
          .single();
        
        if (data) {
          onSave(data as Assessment);
        }
      }
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast.error('Failed to save assessment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{assessmentId ? 'Edit' : 'Create'} Assessment</h2>
          <p className="text-muted-foreground">Build your exam with various question types</p>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button variant="outline" onClick={() => handleSave(false)} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={isLoading}>
            Publish
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="questions">
            <ListChecks className="h-4 w-4 mr-2" />
            Questions ({questions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Assessment title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={assessmentType} onValueChange={(v) => setAssessmentType(v as AssessmentType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSESSMENT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of the assessment"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="Instructions for students taking this assessment"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timing & Attempts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={durationMinutes || ''}
                    onChange={e => setDurationMinutes(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Unlimited"
                  />
                  <p className="text-xs text-muted-foreground">Leave empty for no time limit</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAttempts">Max Attempts</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    value={maxAttempts}
                    onChange={e => setMaxAttempts(parseInt(e.target.value) || 1)}
                    min={1}
                  />
                </div>
                <div className="space-y-2 flex items-center pt-6">
                  <Switch
                    id="allowResume"
                    checked={allowResume}
                    onCheckedChange={setAllowResume}
                  />
                  <Label htmlFor="allowResume" className="ml-2">Allow Resume</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="totalMarks">Total Marks</Label>
                  <Input
                    id="totalMarks"
                    type="number"
                    value={totalMarks}
                    onChange={e => setTotalMarks(parseInt(e.target.value) || 100)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passingMarks">Passing Marks</Label>
                  <Input
                    id="passingMarks"
                    type="number"
                    value={passingMarks}
                    onChange={e => setPassingMarks(parseInt(e.target.value) || 40)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Switch
                      id="negativeMarking"
                      checked={negativeMarking}
                      onCheckedChange={setNegativeMarking}
                    />
                    <Label htmlFor="negativeMarking" className="ml-2">Negative Marking</Label>
                  </div>
                  {negativeMarking && (
                    <Input
                      type="number"
                      step="0.1"
                      value={negativeMarkValue}
                      onChange={e => setNegativeMarkValue(parseFloat(e.target.value) || 0)}
                      placeholder="Marks per wrong answer"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Display Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="randomizeQuestions"
                    checked={randomizeQuestions}
                    onCheckedChange={setRandomizeQuestions}
                  />
                  <Label htmlFor="randomizeQuestions">Randomize Questions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="randomizeOptions"
                    checked={randomizeOptions}
                    onCheckedChange={setRandomizeOptions}
                  />
                  <Label htmlFor="randomizeOptions">Randomize Options</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showCorrectAnswers"
                    checked={showCorrectAnswers}
                    onCheckedChange={setShowCorrectAnswers}
                  />
                  <Label htmlFor="showCorrectAnswers">Show Correct Answers After Submit</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showScoreImmediately"
                    checked={showScoreImmediately}
                    onCheckedChange={setShowScoreImmediately}
                  />
                  <Label htmlFor="showScoreImmediately">Show Score Immediately</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Question</CardTitle>
              <CardDescription>Choose a question type to add</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {QUESTION_TYPES.map(type => (
                  <Button
                    key={type.value}
                    variant="outline"
                    onClick={() => addQuestion(type.value)}
                  >
                    {type.icon}
                    <span className="ml-2">{type.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {questions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ListChecks className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add questions using the buttons above
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <Card key={question.localId}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                        <Badge variant="secondary">Q{index + 1}</Badge>
                        <Badge variant="outline">
                          {QUESTION_TYPES.find(t => t.value === question.question_type)?.label}
                        </Badge>
                        <Badge variant="outline">{question.marks} marks</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.localId)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Question Text *</Label>
                      <Textarea
                        value={question.question_text}
                        onChange={e => updateQuestion(question.localId, { question_text: e.target.value })}
                        placeholder="Enter your question"
                        rows={2}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Marks</Label>
                        <Input
                          type="number"
                          value={question.marks}
                          onChange={e => updateQuestion(question.localId, { marks: parseFloat(e.target.value) || 1 })}
                          min={0}
                          step={0.5}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Explanation (shown after answering)</Label>
                        <Input
                          value={question.explanation || ''}
                          onChange={e => updateQuestion(question.localId, { explanation: e.target.value || null })}
                          placeholder="Optional explanation"
                        />
                      </div>
                    </div>

                    {question.question_type === 'case_study' && (
                      <div className="space-y-2">
                        <Label>Case Study Content</Label>
                        <Textarea
                          value={question.case_study_content || ''}
                          onChange={e => updateQuestion(question.localId, { case_study_content: e.target.value || null })}
                          placeholder="Enter the case study content"
                          rows={6}
                        />
                      </div>
                    )}

                    {(question.question_type === 'mcq' || question.question_type === 'true_false') && (
                      <div className="space-y-3">
                        <Label>Options</Label>
                        {question.options.map((option, optIndex) => (
                          <div key={option.localId} className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`correct-${question.localId}`}
                              checked={option.is_correct}
                              onChange={() => setCorrectOption(question.localId, option.localId)}
                              className="h-4 w-4"
                            />
                            <Input
                              value={option.option_text}
                              onChange={e => updateOption(question.localId, option.localId, { option_text: e.target.value })}
                              placeholder={`Option ${optIndex + 1}`}
                              className="flex-1"
                            />
                            {question.question_type === 'mcq' && question.options.length > 2 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(question.localId, option.localId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {question.question_type === 'mcq' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(question.localId)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Option
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Select the correct answer by clicking the radio button
                        </p>
                      </div>
                    )}

                    {question.question_type === 'descriptive' && (
                      <div className="space-y-2">
                        <Label>Grading Rubric</Label>
                        <Textarea
                          value={question.grading_rubric || ''}
                          onChange={e => updateQuestion(question.localId, { grading_rubric: e.target.value || null })}
                          placeholder="Guidelines for grading this question"
                          rows={3}
                        />
                      </div>
                    )}
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
