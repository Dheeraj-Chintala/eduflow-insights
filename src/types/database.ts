export type AppRole = 
  | 'super_admin'
  | 'admin'
  | 'sub_admin'
  | 'trainer'
  | 'mentor'
  | 'student'
  | 'franchise'
  | 'distributor'
  | 'super_distributor'
  | 'affiliate'
  | 'corporate_hr';

export type CourseStatus = 'draft' | 'published' | 'archived';
export type CourseVisibility = 'public' | 'org_only' | 'private';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type LessonType = 'video' | 'text' | 'quiz' | 'file';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  org_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio?: string | null;
  job_title?: string | null;
  department?: string | null;
  timezone?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  org_id: string;
  role: AppRole;
  created_at: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  category: string;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role: AppRole;
  permission_id: string;
  created_at: string;
}

export interface CustomRole {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomRolePermission {
  id: string;
  custom_role_id: string;
  permission_id: string;
  created_at: string;
}

export interface UserCustomRole {
  id: string;
  user_id: string;
  custom_role_id: string;
  created_at: string;
}

// Course types
export type CourseType = 'free' | 'paid' | 'demo';
export type EnrollmentType = 'open' | 'batch' | 'approval';
export type BatchStatus = 'upcoming' | 'enrolling' | 'active' | 'completed' | 'cancelled';

export interface Course {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  instructor_id: string;
  status: CourseStatus;
  category: string | null;
  duration: string | null;
  visibility?: CourseVisibility;
  difficulty?: DifficultyLevel;
  estimated_duration?: number;
  estimated_hours?: number;
  price?: number;
  currency?: string;
  course_type?: CourseType;
  is_free?: boolean;
  is_featured?: boolean;
  max_students?: number;
  enrollment_type?: EnrollmentType;
  access_days?: number | null;
  published_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoursePrerequisite {
  id: string;
  course_id: string;
  prerequisite_course_id: string;
  is_required: boolean;
  created_at: string;
  prerequisite_course?: Course;
}

export interface CourseBundle {
  id: string;
  org_id: string;
  created_by: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  currency: string;
  discount_percent: number;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
  courses?: Course[];
}

export interface BundleCourse {
  id: string;
  bundle_id: string;
  course_id: string;
  sort_order: number;
  created_at: string;
  course?: Course;
}

export interface CourseBatch {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  batch_code: string | null;
  max_students: number | null;
  enrollment_start: string;
  enrollment_end: string;
  course_start: string;
  course_end: string | null;
  status: BatchStatus;
  created_at: string;
  updated_at: string;
  enrollment_count?: number;
}

export interface CourseAccessRule {
  id: string;
  course_id: string;
  rule_type: 'role' | 'department' | 'completion' | 'date' | 'custom';
  rule_value: Record<string, unknown>;
  is_required: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  order_index?: number;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content_type: LessonType;
  content_url: string | null;
  content_text: string | null;
  content?: Record<string, unknown> | null;
  duration: number | null;
  sort_order: number;
  order_index?: number;
  lesson_type?: LessonType;
  is_preview?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  enrolled_at: string;
  completed_at: string | null;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  time_spent?: number;
  last_position?: number;
  created_at: string;
  updated_at?: string;
}

// Notification types
export type NotificationType = 'info' | 'success' | 'warning' | 'course' | 'certificate';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

// Certificate types
export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_id: string | null;
  certificate_number: string;
  issued_at: string;
  expires_at: string | null;
  pdf_url: string | null;
  created_at: string;
  course?: Course;
}

// Discussion forum types
export interface DiscussionTopic {
  id: string;
  course_id: string;
  user_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_locked: boolean;
  reply_count: number;
  last_reply_at: string | null;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface DiscussionReply {
  id: string;
  topic_id: string;
  user_id: string;
  content: string;
  is_solution: boolean;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

// Doubt types
export type DoubtStatus = 'open' | 'answered' | 'resolved';
export type DoubtPriority = 'low' | 'normal' | 'high';

export interface Doubt {
  id: string;
  course_id: string;
  lesson_id: string | null;
  user_id: string;
  title: string;
  description: string;
  status: DoubtStatus;
  priority: DoubtPriority;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  author?: Profile;
  lesson?: Lesson;
}

export interface DoubtResponse {
  id: string;
  doubt_id: string;
  user_id: string;
  content: string;
  is_solution: boolean;
  created_at: string;
  author?: Profile;
}

// Poll types
export interface Poll {
  id: string;
  course_id: string;
  created_by: string;
  title: string;
  description: string | null;
  is_active: boolean;
  ends_at: string | null;
  created_at: string;
  options?: PollOption[];
  user_vote?: PollVote;
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  vote_count: number;
  sort_order: number;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

// Course rating types
export interface CourseRating {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  review: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

// Mentor chat types
export type ChatSessionStatus = 'active' | 'closed';

export interface MentorChatSession {
  id: string;
  student_id: string;
  mentor_id: string;
  course_id: string | null;
  status: ChatSessionStatus;
  created_at: string;
  closed_at: string | null;
  mentor?: Profile;
  student?: Profile;
  course?: Course;
}

export interface MentorChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

export interface CourseWithInstructor extends Course {
  instructor?: Profile;
}

export interface EnrollmentWithCourse extends Enrollment {
  course?: Course;
}

// Assessment types
export type QuestionType = 'mcq' | 'descriptive' | 'case_study' | 'file_upload' | 'true_false' | 'fill_blank';
export type AssessmentStatus = 'draft' | 'published' | 'closed' | 'archived';
export type SubmissionStatus = 'in_progress' | 'submitted' | 'graded' | 'retake_allowed';
export type AssessmentType = 'quiz' | 'exam' | 'assignment' | 'case_study';

export interface Assessment {
  id: string;
  course_id: string;
  module_id: string | null;
  lesson_id: string | null;
  title: string;
  description: string | null;
  assessment_type: AssessmentType;
  status: AssessmentStatus;
  duration_minutes: number | null;
  start_time: string | null;
  end_time: string | null;
  total_marks: number;
  passing_marks: number;
  negative_marking: boolean;
  negative_mark_value: number;
  randomize_questions: boolean;
  randomize_options: boolean;
  questions_per_attempt: number | null;
  show_correct_answers: boolean;
  show_score_immediately: boolean;
  max_attempts: number;
  retake_delay_hours: number;
  allow_resume: boolean;
  instructions: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  questions?: AssessmentQuestion[];
  course?: Course;
}

export interface AssessmentQuestion {
  id: string;
  assessment_id: string;
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
  created_at: string;
  updated_at: string;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  option_media_url: string | null;
  is_correct: boolean;
  sort_order: number;
  created_at: string;
}

export interface AssessmentSubmission {
  id: string;
  assessment_id: string;
  user_id: string;
  attempt_number: number;
  status: SubmissionStatus;
  started_at: string;
  submitted_at: string | null;
  time_spent_seconds: number;
  total_score: number | null;
  percentage: number | null;
  passed: boolean | null;
  auto_graded_at: string | null;
  manually_graded_at: string | null;
  graded_by: string | null;
  grader_comments: string | null;
  question_order: string[] | null;
  created_at: string;
  updated_at: string;
  assessment?: Assessment;
  answers?: AssessmentAnswer[];
}

export interface AssessmentAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  selected_option_id: string | null;
  selected_option_ids: string[] | null;
  text_answer: string | null;
  file_url: string | null;
  marks_obtained: number | null;
  is_correct: boolean | null;
  auto_graded: boolean;
  grader_feedback: string | null;
  graded_at: string | null;
  graded_by: string | null;
  answered_at: string;
  time_spent_seconds: number;
  created_at: string;
  updated_at: string;
  question?: AssessmentQuestion;
}

export interface QuestionBank {
  id: string;
  org_id: string;
  course_id: string | null;
  category: string | null;
  tags: string[] | null;
  question_type: QuestionType;
  question_text: string;
  question_media_url: string | null;
  explanation: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  created_by: string;
  created_at: string;
  updated_at: string;
  options?: QuestionBankOption[];
}

export interface QuestionBankOption {
  id: string;
  question_bank_id: string;
  option_text: string;
  option_media_url: string | null;
  is_correct: boolean;
  sort_order: number;
  created_at: string;
}

// Role display helpers
export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  sub_admin: 'Sub Admin',
  trainer: 'Trainer',
  mentor: 'Mentor',
  student: 'Student',
  franchise: 'Franchise',
  distributor: 'Distributor',
  super_distributor: 'Super Distributor',
  affiliate: 'Affiliate',
  corporate_hr: 'Corporate HR',
};

export const ALL_ROLES: AppRole[] = [
  'super_admin',
  'admin',
  'sub_admin',
  'trainer',
  'mentor',
  'student',
  'franchise',
  'distributor',
  'super_distributor',
  'affiliate',
  'corporate_hr',
];
