-- Gamification: User Points
CREATE TABLE public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Gamification: Badges
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  badge_type VARCHAR(50) NOT NULL DEFAULT 'achievement',
  points_required INTEGER DEFAULT 0,
  criteria JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Gamification: User Badges (earned)
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Gamification: Point Transactions
CREATE TABLE public.point_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  description TEXT,
  reference_type VARCHAR(50),
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Gamification: Leaderboard Cache
CREATE TABLE public.leaderboard_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period VARCHAR(20) NOT NULL DEFAULT 'all_time',
  rank INTEGER NOT NULL,
  points INTEGER NOT NULL,
  org_id UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period, org_id)
);

-- AI Features: Skill Gap Analysis
CREATE TABLE public.skill_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assessed_skills JSONB NOT NULL DEFAULT '[]',
  target_role VARCHAR(255),
  skill_gaps JSONB,
  recommendations JSONB,
  ai_analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Features: Mock Interviews
CREATE TABLE public.mock_interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_role VARCHAR(255) NOT NULL,
  interview_type VARCHAR(50) NOT NULL DEFAULT 'behavioral',
  difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',
  questions JSONB NOT NULL DEFAULT '[]',
  responses JSONB,
  ai_feedback JSONB,
  overall_score INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Features: Resume ATS Scores
CREATE TABLE public.resume_ats_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resume_id UUID REFERENCES public.student_resumes(id) ON DELETE SET NULL,
  job_description TEXT,
  ats_score INTEGER,
  keyword_matches JSONB,
  missing_keywords JSONB,
  format_issues JSONB,
  improvement_suggestions JSONB,
  ai_analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Features: Course Recommendations Log
CREATE TABLE public.ai_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recommendation_type VARCHAR(50) NOT NULL,
  recommended_items JSONB NOT NULL DEFAULT '[]',
  reasoning TEXT,
  was_helpful BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Features: Chatbot Conversations
CREATE TABLE public.ai_chatbot_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_type VARCHAR(50) NOT NULL DEFAULT 'doubt_clearing',
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Corporate LMS: Organization Settings
CREATE TABLE public.org_feature_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, feature_name)
);

-- Corporate LMS: Training Programs
CREATE TABLE public.corporate_training_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  course_ids UUID[] DEFAULT '{}',
  target_departments TEXT[],
  mandatory BOOLEAN DEFAULT false,
  deadline DATE,
  created_by UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Corporate LMS: Training Enrollments
CREATE TABLE public.corporate_training_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.corporate_training_programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  progress INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'enrolled',
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(program_id, user_id)
);

-- Enable RLS
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_ats_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chatbot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_feature_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_training_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_points
CREATE POLICY "Users can view their own points" ON public.user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view leaderboard points" ON public.user_points FOR SELECT USING (true);
CREATE POLICY "System can manage points" ON public.user_points FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for badges
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage badges" ON public.badges FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
);

-- RLS Policies for user_badges
CREATE POLICY "Users can view their own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view all earned badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "System can award badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for point_transactions
CREATE POLICY "Users can view their own transactions" ON public.point_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create transactions" ON public.point_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for leaderboard_cache
CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard_cache FOR SELECT USING (true);

-- RLS Policies for skill_assessments
CREATE POLICY "Users can manage their skill assessments" ON public.skill_assessments FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for mock_interviews
CREATE POLICY "Users can manage their mock interviews" ON public.mock_interviews FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for resume_ats_scores
CREATE POLICY "Users can manage their ATS scores" ON public.resume_ats_scores FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for ai_recommendations
CREATE POLICY "Users can view their recommendations" ON public.ai_recommendations FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for ai_chatbot_sessions
CREATE POLICY "Users can manage their chat sessions" ON public.ai_chatbot_sessions FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for org_feature_settings
CREATE POLICY "Users can view their org settings" ON public.org_feature_settings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND org_id = org_feature_settings.org_id)
);
CREATE POLICY "Admins can manage org settings" ON public.org_feature_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND org_id = org_feature_settings.org_id AND role IN ('super_admin', 'admin'))
);

-- RLS Policies for corporate_training_programs
CREATE POLICY "Users can view their org programs" ON public.corporate_training_programs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND org_id = corporate_training_programs.org_id)
);
CREATE POLICY "Admins can manage programs" ON public.corporate_training_programs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND org_id = corporate_training_programs.org_id AND role IN ('super_admin', 'admin', 'corporate_hr'))
);

-- RLS Policies for corporate_training_enrollments
CREATE POLICY "Users can view their enrollments" ON public.corporate_training_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their enrollment progress" ON public.corporate_training_enrollments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage enrollments" ON public.corporate_training_enrollments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.corporate_training_programs p
    JOIN public.user_roles ur ON ur.org_id = p.org_id
    WHERE p.id = corporate_training_enrollments.program_id
    AND ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin', 'corporate_hr')
  )
);

-- Indexes for performance
CREATE INDEX idx_user_points_user ON public.user_points(user_id);
CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX idx_point_transactions_user ON public.point_transactions(user_id);
CREATE INDEX idx_leaderboard_cache_period ON public.leaderboard_cache(period, rank);
CREATE INDEX idx_skill_assessments_user ON public.skill_assessments(user_id);
CREATE INDEX idx_mock_interviews_user ON public.mock_interviews(user_id);
CREATE INDEX idx_resume_ats_scores_user ON public.resume_ats_scores(user_id);
CREATE INDEX idx_ai_recommendations_user ON public.ai_recommendations(user_id);
CREATE INDEX idx_ai_chatbot_sessions_user ON public.ai_chatbot_sessions(user_id);

-- Update triggers
CREATE TRIGGER update_user_points_updated_at BEFORE UPDATE ON public.user_points FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_skill_assessments_updated_at BEFORE UPDATE ON public.skill_assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ai_chatbot_sessions_updated_at BEFORE UPDATE ON public.ai_chatbot_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_org_feature_settings_updated_at BEFORE UPDATE ON public.org_feature_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_corporate_training_programs_updated_at BEFORE UPDATE ON public.corporate_training_programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default badges
INSERT INTO public.badges (name, description, badge_type, points_required) VALUES
('First Steps', 'Complete your first lesson', 'achievement', 0),
('Quick Learner', 'Complete 5 lessons in one day', 'achievement', 0),
('Course Champion', 'Complete your first course', 'achievement', 0),
('Knowledge Seeker', 'Complete 10 courses', 'achievement', 0),
('Perfect Score', 'Score 100% on an assessment', 'achievement', 0),
('Discussion Starter', 'Create your first discussion topic', 'engagement', 0),
('Helpful Hand', 'Answer 10 questions in discussions', 'engagement', 0),
('7-Day Streak', 'Learn for 7 consecutive days', 'streak', 0),
('30-Day Streak', 'Learn for 30 consecutive days', 'streak', 0),
('Rising Star', 'Earn 1000 points', 'points', 1000),
('Expert', 'Earn 5000 points', 'points', 5000),
('Master', 'Earn 10000 points', 'points', 10000);