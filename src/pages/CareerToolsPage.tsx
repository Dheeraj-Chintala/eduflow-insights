import React from 'react';
import AppLayout from '@/layouts/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIChatbot } from '@/components/ai/AIChatbot';
import { CourseRecommendations } from '@/components/ai/CourseRecommendations';
import { SkillGapAnalyzer } from '@/components/ai/SkillGapAnalyzer';
import { MockInterviewPractice } from '@/components/ai/MockInterviewPractice';
import { ResumeATSScorer } from '@/components/ai/ResumeATSScorer';
import { Leaderboard } from '@/components/gamification/Leaderboard';
import { BadgesDisplay } from '@/components/gamification/BadgesDisplay';
import { PointsDisplay } from '@/components/gamification/PointsDisplay';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Trophy, Bot, Target, Mic, FileText } from 'lucide-react';

const CareerToolsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-yellow-500" />
            AI Career Tools & Gamification
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered tools to accelerate your career and track your learning achievements
          </p>
        </div>

        {/* Points Display */}
        <div className="mb-6">
          <PointsDisplay />
        </div>

        <Tabs defaultValue="recommendations" className="space-y-6">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
            <TabsTrigger value="recommendations" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Courses</span>
            </TabsTrigger>
            <TabsTrigger value="chatbot" className="flex items-center gap-1">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">AI Tutor</span>
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Skills</span>
            </TabsTrigger>
            <TabsTrigger value="interview" className="flex items-center gap-1">
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Interview</span>
            </TabsTrigger>
            <TabsTrigger value="resume" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Resume</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Achievements</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations">
            <CourseRecommendations onCourseClick={(id) => navigate(`/courses/${id}`)} />
          </TabsContent>

          <TabsContent value="chatbot">
            <div className="max-w-2xl mx-auto">
              <AIChatbot />
            </div>
          </TabsContent>

          <TabsContent value="skills">
            <SkillGapAnalyzer />
          </TabsContent>

          <TabsContent value="interview">
            <div className="max-w-2xl mx-auto">
              <MockInterviewPractice />
            </div>
          </TabsContent>

          <TabsContent value="resume">
            <ResumeATSScorer />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <BadgesDisplay />
              <Leaderboard />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default CareerToolsPage;
