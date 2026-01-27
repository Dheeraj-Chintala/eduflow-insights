import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, TrendingUp, AlertCircle, CheckCircle, Loader2, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { SkillGap, SkillRecommendation, AssessedSkill } from '@/types/advanced-features';

interface SkillGapAnalysis {
  currentSkills: AssessedSkill[];
  targetRoleRequirements: Array<{
    skill: string;
    importance: string;
    currentLevel: string;
    requiredLevel: string;
  }>;
  gaps: SkillGap[];
  recommendations: SkillRecommendation[];
  overallAnalysis: string;
}

export const SkillGapAnalyzer: React.FC = () => {
  const { user } = useAuth();
  const [targetRole, setTargetRole] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);

  const analyzeSkillGap = async () => {
    if (!user || !targetRole.trim()) {
      toast.error('Please enter a target role');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Get user's completed courses and certificates
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('progress, courses(title, category)')
        .eq('user_id', user.id)
        .gte('progress', 50);

      const { data: certificates } = await supabase
        .from('certificates')
        .select('courses(title)')
        .eq('user_id', user.id);

      const response = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'skill_gap_analysis',
          messages: [
            {
              role: 'user',
              content: `Analyze my skills for the target role: ${targetRole}`
            }
          ],
          context: {
            targetRole,
            completedCourses: enrollments?.map(e => e.courses) || [],
            certificates: certificates?.map(c => c.courses) || []
          }
        }
      });

      if (response.error) throw response.error;

      try {
        const parsed = JSON.parse(response.data.content);
        setAnalysis(parsed);

        // Save the assessment
        await supabase.from('skill_assessments').insert({
          user_id: user.id,
          target_role: targetRole,
          assessed_skills: parsed.currentSkills || [],
          skill_gaps: parsed.gaps || [],
          recommendations: parsed.recommendations || [],
          ai_analysis: parsed.overallAnalysis
        });
      } catch {
        toast.error('Failed to parse analysis');
      }
    } catch (error) {
      console.error('Skill gap analysis failed:', error);
      toast.error('Failed to analyze skills');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getLevelProgress = (level: string) => {
    switch (level) {
      case 'advanced': return 100;
      case 'intermediate': return 66;
      case 'beginner': return 33;
      default: return 0;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          AI Skill Gap Analyzer
        </CardTitle>
        <CardDescription>
          Identify skill gaps and get personalized learning recommendations for your target role
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="targetRole">Target Role</Label>
            <Input
              id="targetRole"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Senior Frontend Developer, Data Scientist"
              className="mt-1"
            />
          </div>
          <Button
            onClick={analyzeSkillGap}
            disabled={isAnalyzing || !targetRole.trim()}
            className="mt-7"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Analyze Skills
              </>
            )}
          </Button>
        </div>

        {isAnalyzing && (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {analysis && !isAnalyzing && (
          <div className="space-y-6">
            {/* Overall Analysis */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{analysis.overallAnalysis}</p>
            </div>

            {/* Current Skills */}
            {analysis.currentSkills?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Your Current Skills
                </h4>
                <div className="grid gap-3">
                  {analysis.currentSkills.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">{skill.name}</span>
                        <p className="text-xs text-muted-foreground">{skill.evidence}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={getLevelProgress(skill.level)} className="w-20 h-2" />
                        <Badge variant="secondary">{skill.level}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skill Gaps */}
            {analysis.gaps?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Skill Gaps to Address
                </h4>
                <div className="space-y-2">
                  {analysis.gaps.map((gap, index) => (
                    <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">{gap.skill}</span>
                        <p className="text-sm text-muted-foreground">{gap.gap}</p>
                      </div>
                      <Badge variant={getPriorityColor(gap.priority)}>
                        {gap.priority} priority
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  Recommended Actions
                </h4>
                <div className="space-y-2">
                  {analysis.recommendations.map((rec, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-primary/5">
                      <div className="font-medium">{rec.action}</div>
                      <div className="text-sm text-muted-foreground">
                        Resource: {rec.resource} • Timeline: {rec.timeframe}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
