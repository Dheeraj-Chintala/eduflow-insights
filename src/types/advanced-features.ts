// Gamification Types
export interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  level: number;
  streak_days: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  badge_type: 'achievement' | 'engagement' | 'streak' | 'points';
  points_required: number;
  criteria: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  points: number;
  transaction_type: string;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  rank: number;
  points: number;
  org_id: string | null;
  updated_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

// AI Features Types
export interface SkillAssessment {
  id: string;
  user_id: string;
  assessed_skills: AssessedSkill[];
  target_role: string | null;
  skill_gaps: SkillGap[] | null;
  recommendations: SkillRecommendation[] | null;
  ai_analysis: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssessedSkill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  evidence: string;
}

export interface SkillGap {
  skill: string;
  gap: string;
  priority: 'high' | 'medium' | 'low';
}

export interface SkillRecommendation {
  action: string;
  resource: string;
  timeframe: string;
}

export interface MockInterview {
  id: string;
  user_id: string;
  job_role: string;
  interview_type: 'behavioral' | 'technical' | 'case_study' | 'mixed';
  difficulty: 'easy' | 'medium' | 'hard';
  questions: InterviewQuestion[];
  responses: InterviewResponse[] | null;
  ai_feedback: InterviewFeedback | null;
  overall_score: number | null;
  status: 'pending' | 'in_progress' | 'completed';
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  tips?: string;
}

export interface InterviewResponse {
  question_id: string;
  response: string;
  time_taken_seconds: number;
}

export interface InterviewFeedback {
  question_id: string;
  score: number;
  strengths: string[];
  improvements: string[];
  suggestion: string;
}

export interface ResumeATSScore {
  id: string;
  user_id: string;
  resume_id: string | null;
  job_description: string | null;
  ats_score: number | null;
  keyword_matches: KeywordMatch[] | null;
  missing_keywords: string[] | null;
  format_issues: FormatIssue[] | null;
  improvement_suggestions: ATSSuggestion[] | null;
  ai_analysis: string | null;
  created_at: string;
}

export interface KeywordMatch {
  keyword: string;
  found: boolean;
  context: string;
}

export interface FormatIssue {
  issue: string;
  severity: 'high' | 'medium' | 'low';
  fix: string;
}

export interface ATSSuggestion {
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
  impact: string;
}

export interface AIRecommendation {
  id: string;
  user_id: string;
  recommendation_type: string;
  recommended_items: RecommendedItem[];
  reasoning: string | null;
  was_helpful: boolean | null;
  created_at: string;
}

export interface RecommendedItem {
  courseId: string | null;
  title: string;
  reason: string;
  matchScore: number;
}

export interface AIChatSession {
  id: string;
  user_id: string;
  session_type: string;
  course_id: string | null;
  messages: ChatMessage[];
  status: 'active' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

// Corporate LMS Types
export interface OrgFeatureSetting {
  id: string;
  org_id: string;
  feature_name: string;
  is_enabled: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CorporateTrainingProgram {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  course_ids: string[];
  target_departments: string[] | null;
  mandatory: boolean;
  deadline: string | null;
  created_by: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface CorporateTrainingEnrollment {
  id: string;
  program_id: string;
  user_id: string;
  progress: number;
  status: 'enrolled' | 'in_progress' | 'completed';
  enrolled_at: string;
  completed_at: string | null;
  program?: CorporateTrainingProgram;
}

// Feature Toggle Types
export type AdvancedFeature = 
  | 'ai_recommendations'
  | 'ai_chatbot'
  | 'skill_gap_analysis'
  | 'mock_interviews'
  | 'ats_scoring'
  | 'gamification'
  | 'leaderboards'
  | 'corporate_training'
  | 'white_label';
