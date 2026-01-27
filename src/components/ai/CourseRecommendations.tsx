import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, BookOpen, RefreshCw, ThumbsUp, ThumbsDown, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { RecommendedItem } from '@/types/advanced-features';

interface CourseRecommendationsProps {
  onCourseClick?: (courseId: string) => void;
}

export const CourseRecommendations: React.FC<CourseRecommendationsProps> = ({ onCourseClick }) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [reasoning, setReasoning] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchRecommendations = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get user's enrolled courses and progress
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id, progress, courses(title, category)')
        .eq('user_id', user.id);

      // Get available courses
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title, category, description, difficulty')
        .eq('status', 'published')
        .limit(20);

      // Call AI assistant
      const response = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'course_recommendations',
          messages: [
            {
              role: 'user',
              content: 'Based on my learning history, recommend courses for me.'
            }
          ],
          context: {
            enrolledCourses: enrollments?.map(e => ({
              courseId: e.course_id,
              progress: e.progress,
              ...(e.courses as { title: string; category: string } | null)
            })) || [],
            availableCourses: courses || []
          }
        }
      });

      if (response.error) throw response.error;

      try {
        const parsed = JSON.parse(response.data.content);
        setRecommendations(parsed.recommendations || []);
        setReasoning(parsed.reasoning || '');
        setLastFetched(new Date());
      } catch {
        // If not JSON, show as reasoning
        setReasoning(response.data.content);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      toast.error('Failed to get recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  const handleFeedback = async (helpful: boolean) => {
    if (!user) return;

    try {
      await supabase.from('ai_recommendations').insert([{
        user_id: user.id,
        recommendation_type: 'course_recommendations',
        recommended_items: JSON.parse(JSON.stringify(recommendations)),
        reasoning,
        was_helpful: helpful
      }]);
      toast.success('Thanks for your feedback!');
    } catch (error) {
      console.error('Failed to save feedback:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            AI Course Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              AI Course Recommendations
            </CardTitle>
            <CardDescription>
              Personalized suggestions based on your learning journey
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRecommendations} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {reasoning && (
          <p className="text-sm text-muted-foreground italic">{reasoning}</p>
        )}

        {recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => rec.courseId && onCourseClick?.(rec.courseId)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-medium">{rec.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {rec.matchScore}% match
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            Complete some courses to get personalized recommendations!
          </p>
        )}

        {recommendations.length > 0 && (
          <div className="flex items-center justify-center gap-4 pt-4 border-t">
            <span className="text-sm text-muted-foreground">Were these helpful?</span>
            <Button variant="outline" size="sm" onClick={() => handleFeedback(true)}>
              <ThumbsUp className="h-4 w-4 mr-1" /> Yes
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleFeedback(false)}>
              <ThumbsDown className="h-4 w-4 mr-1" /> No
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
