import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Target, AlertTriangle, CheckCircle, XCircle, Loader2, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { KeywordMatch, FormatIssue, ATSSuggestion } from '@/types/advanced-features';

interface ATSAnalysis {
  atsScore: number;
  keywordMatches: KeywordMatch[];
  missingKeywords: string[];
  formatIssues: FormatIssue[];
  suggestions: ATSSuggestion[];
  summary: string;
}

export const ResumeATSScorer: React.FC = () => {
  const { user } = useAuth();
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);

  const analyzeResume = async () => {
    if (!user || !resumeText.trim() || !jobDescription.trim()) {
      toast.error('Please provide both your resume and the job description');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'ats_scoring',
          messages: [
            {
              role: 'user',
              content: `Analyze this resume against the job description.\n\nRESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`
            }
          ]
        }
      });

      if (response.error) throw response.error;

      try {
        const parsed = JSON.parse(response.data.content);
        setAnalysis(parsed);

        // Save the analysis
        await supabase.from('resume_ats_scores').insert({
          user_id: user.id,
          job_description: jobDescription,
          ats_score: parsed.atsScore,
          keyword_matches: parsed.keywordMatches || [],
          missing_keywords: parsed.missingKeywords || [],
          format_issues: parsed.formatIssues || [],
          improvement_suggestions: parsed.suggestions || [],
          ai_analysis: parsed.summary
        });

        toast.success('Resume analyzed successfully!');
      } catch {
        toast.error('Failed to parse analysis results');
      }
    } catch (error) {
      console.error('ATS analysis failed:', error);
      toast.error('Failed to analyze resume');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          AI Resume ATS Scorer
        </CardTitle>
        <CardDescription>
          Check how well your resume matches job requirements and get improvement suggestions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="resume">Your Resume (paste text)</Label>
            <Textarea
              id="resume"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume content here..."
              className="mt-1 min-h-[200px]"
            />
          </div>
          <div>
            <Label htmlFor="jobDesc">Job Description</Label>
            <Textarea
              id="jobDesc"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="mt-1 min-h-[200px]"
            />
          </div>
        </div>

        <Button
          onClick={analyzeResume}
          disabled={isAnalyzing || !resumeText.trim() || !jobDescription.trim()}
          className="w-full"
        >
          {isAnalyzing ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
          ) : (
            <><Target className="h-4 w-4 mr-2" /> Analyze Resume</>
          )}
        </Button>

        {isAnalyzing && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {analysis && !isAnalyzing && (
          <div className="space-y-6 pt-4 border-t">
            {/* Score Display */}
            <div className="text-center p-6 bg-muted rounded-lg">
              <div className={`text-6xl font-bold ${getScoreColor(analysis.atsScore)}`}>
                {analysis.atsScore}%
              </div>
              <p className="text-muted-foreground mt-2">ATS Compatibility Score</p>
              <Progress value={analysis.atsScore} className="mt-4 h-3" />
            </div>

            {/* Summary */}
            <div className="p-4 bg-primary/5 rounded-lg">
              <p className="text-sm">{analysis.summary}</p>
            </div>

            {/* Keyword Matches */}
            {analysis.keywordMatches?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Keyword Matches
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywordMatches.filter(k => k.found).map((match, i) => (
                    <Badge key={i} variant="default" className="bg-green-100 text-green-800">
                      ✓ {match.keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Keywords */}
            {analysis.missingKeywords?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Missing Keywords
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingKeywords.map((keyword, i) => (
                    <Badge key={i} variant="outline" className="text-red-600 border-red-200">
                      + {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Format Issues */}
            {analysis.formatIssues?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Format Issues
                </h4>
                <div className="space-y-2">
                  {analysis.formatIssues.map((issue, i) => (
                    <div key={i} className="flex items-start justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">{issue.issue}</span>
                        <p className="text-sm text-muted-foreground">Fix: {issue.fix}</p>
                      </div>
                      <Badge variant={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {analysis.suggestions?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  Improvement Suggestions
                </h4>
                <div className="space-y-2">
                  {analysis.suggestions.map((sug, i) => (
                    <div key={i} className="p-3 border rounded-lg bg-blue-50/50">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{sug.suggestion}</span>
                        <Badge variant={getSeverityColor(sug.priority)}>{sug.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Impact: {sug.impact}</p>
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
