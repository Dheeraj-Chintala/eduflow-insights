import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  Clock, 
  Users,
  CheckCircle,
  FileText,
  Play
} from 'lucide-react';
import type { Assessment, AssessmentSubmission } from '@/types/database';

interface AssessmentListProps {
  courseId: string;
  isInstructor?: boolean;
  onCreateNew?: () => void;
  onEdit?: (assessmentId: string) => void;
  onGrade?: (assessmentId: string) => void;
  onTake?: (assessmentId: string) => void;
}

interface AssessmentWithStats extends Assessment {
  submission_count?: number;
  user_submission?: AssessmentSubmission;
}

export default function AssessmentList({ 
  courseId, 
  isInstructor = false, 
  onCreateNew, 
  onEdit, 
  onGrade,
  onTake 
}: AssessmentListProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [assessments, setAssessments] = useState<AssessmentWithStats[]>([]);

  useEffect(() => {
    loadAssessments();
  }, [courseId, user]);

  const loadAssessments = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('assessments')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (!isInstructor) {
        query = query.eq('status', 'published');
      }

      const { data: assessmentsData, error } = await query;

      if (error) throw error;

      // Load additional stats for each assessment
      const assessmentsWithStats = await Promise.all(
        (assessmentsData || []).map(async (assessment) => {
          // Get submission count for instructors
          let submissionCount = 0;
          if (isInstructor) {
            const { count } = await supabase
              .from('assessment_submissions')
              .select('*', { count: 'exact', head: true })
              .eq('assessment_id', assessment.id)
              .in('status', ['submitted', 'graded']);
            submissionCount = count || 0;
          }

          // Get user's submission for students
          let userSubmission = null;
          if (!isInstructor && user) {
            const { data } = await supabase
              .from('assessment_submissions')
              .select('*')
              .eq('assessment_id', assessment.id)
              .eq('user_id', user.id)
              .order('attempt_number', { ascending: false })
              .limit(1)
              .single();
            userSubmission = data;
          }

          return {
            ...assessment,
            submission_count: submissionCount,
            user_submission: userSubmission,
          } as AssessmentWithStats;
        })
      );

      setAssessments(assessmentsWithStats);
    } catch (error) {
      console.error('Error loading assessments:', error);
      toast.error('Failed to load assessments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (assessmentId: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;

    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', assessmentId);

      if (error) throw error;

      toast.success('Assessment deleted');
      loadAssessments();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      toast.error('Failed to delete assessment');
    }
  };

  const handlePublish = async (assessmentId: string, publish: boolean) => {
    try {
      const { error } = await supabase
        .from('assessments')
        .update({ status: publish ? 'published' : 'draft' })
        .eq('id', assessmentId);

      if (error) throw error;

      toast.success(publish ? 'Assessment published' : 'Assessment unpublished');
      loadAssessments();
    } catch (error) {
      console.error('Error updating assessment:', error);
      toast.error('Failed to update assessment');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'published':
        return <Badge variant="default" className="bg-success">Published</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAssessmentTypeBadge = (type: string) => {
    switch (type) {
      case 'quiz':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600">Quiz</Badge>;
      case 'exam':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600">Exam</Badge>;
      case 'assignment':
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-600">Assignment</Badge>;
      case 'case_study':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600">Case Study</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Assessments</h2>
          <p className="text-muted-foreground text-sm">
            {isInstructor ? 'Manage your course assessments' : 'Complete assessments to test your knowledge'}
          </p>
        </div>
        {isInstructor && onCreateNew && (
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create Assessment
          </Button>
        )}
      </div>

      {assessments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No assessments yet</h3>
            <p className="text-muted-foreground mb-4">
              {isInstructor 
                ? 'Create your first assessment to test student knowledge'
                : 'No assessments are available for this course yet'}
            </p>
            {isInstructor && onCreateNew && (
              <Button onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Assessment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex gap-2 flex-wrap">
                    {getStatusBadge(assessment.status)}
                    {getAssessmentTypeBadge(assessment.assessment_type)}
                  </div>
                  {isInstructor && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit?.(assessment.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onGrade?.(assessment.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Grade Submissions
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handlePublish(assessment.id, assessment.status !== 'published')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {assessment.status === 'published' ? 'Unpublish' : 'Publish'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(assessment.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <CardTitle className="text-lg mt-2">{assessment.title}</CardTitle>
                {assessment.description && (
                  <CardDescription className="line-clamp-2">
                    {assessment.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                  {assessment.duration_minutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {assessment.duration_minutes} min
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {assessment.total_marks} marks
                  </div>
                  {isInstructor && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {assessment.submission_count} submissions
                    </div>
                  )}
                </div>

                {!isInstructor && (
                  <div className="space-y-2">
                    {assessment.user_submission ? (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Your best score:</span>
                          <Badge variant={assessment.user_submission.passed ? 'default' : 'destructive'}>
                            {assessment.user_submission.total_score?.toFixed(1)} / {assessment.total_marks}
                          </Badge>
                        </div>
                        {assessment.max_attempts > assessment.user_submission.attempt_number && (
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => onTake?.(assessment.id)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Retake ({assessment.user_submission.attempt_number}/{assessment.max_attempts})
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button 
                        className="w-full"
                        onClick={() => onTake?.(assessment.id)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Assessment
                      </Button>
                    )}
                  </div>
                )}

                {isInstructor && assessment.submission_count > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => onGrade?.(assessment.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Review Submissions
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
