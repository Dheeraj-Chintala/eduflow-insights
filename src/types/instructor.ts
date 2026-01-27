// Types for Instructor Panel

export interface LiveClass {
  id: string;
  course_id: string;
  batch_id: string | null;
  instructor_id: string;
  title: string;
  description: string | null;
  meeting_url: string | null;
  meeting_platform: string;
  scheduled_at: string;
  duration_minutes: number;
  status: LiveClassStatus;
  recording_url: string | null;
  max_attendees: number | null;
  notify_students: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  course?: { title: string };
  batch?: { title: string };
}

export type LiveClassStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

export interface LiveClassAttendance {
  id: string;
  live_class_id: string;
  user_id: string;
  joined_at: string | null;
  left_at: string | null;
  duration_minutes: number | null;
  status: 'invited' | 'attended' | 'absent';
  created_at: string;
  // Joined fields
  profile?: { full_name: string; avatar_url: string | null };
}

export interface Assignment {
  id: string;
  course_id: string;
  module_id: string | null;
  batch_id: string | null;
  instructor_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  due_date: string | null;
  max_marks: number;
  passing_marks: number;
  allow_late_submission: boolean;
  late_penalty_percent: number;
  allow_resubmission: boolean;
  max_resubmissions: number;
  attachment_url: string | null;
  status: AssignmentStatus;
  created_at: string;
  updated_at: string;
  // Joined fields
  course?: { title: string };
  module?: { title: string };
  batch?: { title: string };
  submissions_count?: number;
  graded_count?: number;
}

export type AssignmentStatus = 'draft' | 'published' | 'closed';

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  submission_text: string | null;
  attachment_url: string | null;
  submitted_at: string;
  is_late: boolean;
  submission_number: number;
  marks_obtained: number | null;
  feedback: string | null;
  graded_at: string | null;
  graded_by: string | null;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
  // Joined fields
  profile?: { full_name: string; avatar_url: string | null; user_id: string };
  assignment?: { title: string; max_marks: number };
}

export type SubmissionStatus = 'submitted' | 'graded' | 'returned' | 'resubmit_requested';

export interface InstructorRevenue {
  id: string;
  instructor_id: string;
  course_id: string | null;
  enrollment_id: string | null;
  total_amount: number;
  instructor_share_percent: number;
  instructor_amount: number;
  platform_amount: number;
  status: RevenueStatus;
  payout_date: string | null;
  transaction_ref: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  course?: { title: string };
}

export type RevenueStatus = 'pending' | 'processed' | 'paid' | 'cancelled';

export interface InstructorSettings {
  id: string;
  instructor_id: string;
  show_revenue: boolean;
  revenue_share_percent: number;
  can_schedule_live_classes: boolean;
  can_issue_certificates: boolean;
  max_courses: number | null;
  created_at: string;
  updated_at: string;
}

export interface InstructorStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalEnrollments: number;
  activeBatches: number;
  upcomingClasses: number;
  pendingAssignments: number;
  completionRate: number;
}

export interface BatchStudent {
  id: string;
  user_id: string;
  enrollment_id: string;
  batch_id: string | null;
  course_id: string;
  enrolled_at: string;
  progress: number;
  completed_at: string | null;
  profile: {
    full_name: string;
    avatar_url: string | null;
  };
  lessons_completed: number;
  total_lessons: number;
  assignments_submitted: number;
  assignments_total: number;
  attendance_rate: number;
}
