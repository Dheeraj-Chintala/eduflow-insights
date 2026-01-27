// Internship Management Module Types

export type InternshipStatus = 'draft' | 'active' | 'closed' | 'completed';
export type InternshipApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type OfferLetterStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';
export type InternshipTaskStatus = 'pending' | 'in_progress' | 'submitted' | 'approved' | 'revision_needed';

export interface Internship {
  id: string;
  org_id: string;
  title: string;
  description?: string;
  department?: string;
  location?: string;
  is_remote: boolean;
  duration_weeks?: number;
  stipend_amount?: number;
  stipend_currency: string;
  max_positions: number;
  skills_required?: string[];
  responsibilities?: string;
  eligibility?: string;
  start_date?: string;
  end_date?: string;
  application_deadline?: string;
  status: InternshipStatus;
  mentor_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InternshipApplication {
  id: string;
  internship_id: string;
  user_id: string;
  cover_letter?: string;
  resume_url?: string;
  portfolio_url?: string;
  status: InternshipApplicationStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  reviewer_notes?: string;
  applied_at: string;
  updated_at: string;
}

export interface InternshipEnrollment {
  id: string;
  internship_id: string;
  user_id: string;
  application_id?: string;
  start_date: string;
  expected_end_date?: string;
  actual_end_date?: string;
  progress: number;
  is_completed: boolean;
  completed_at?: string;
  enrolled_at: string;
}

export interface InternshipTask {
  id: string;
  internship_id: string;
  title: string;
  description?: string;
  instructions?: string;
  attachment_url?: string;
  due_date?: string;
  max_marks: number;
  passing_marks: number;
  sort_order: number;
  is_mandatory: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InternshipTaskSubmission {
  id: string;
  task_id: string;
  enrollment_id: string;
  user_id: string;
  submission_text?: string;
  attachment_url?: string;
  status: InternshipTaskStatus;
  marks_obtained?: number;
  mentor_feedback?: string;
  graded_by?: string;
  graded_at?: string;
  submitted_at: string;
  updated_at: string;
}

export interface InternshipOfferLetter {
  id: string;
  application_id: string;
  internship_id: string;
  user_id: string;
  offer_number: string;
  content: string;
  stipend_amount?: number;
  start_date: string;
  end_date?: string;
  terms_and_conditions?: string;
  status: OfferLetterStatus;
  sent_at?: string;
  responded_at?: string;
  expires_at?: string;
  pdf_url?: string;
  issued_by: string;
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface InternshipWithMentor extends Internship {
  mentor?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface InternshipApplicationWithUser extends InternshipApplication {
  user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  internship?: Internship;
}

export interface InternshipEnrollmentWithDetails extends InternshipEnrollment {
  user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  internship?: Internship;
}

export interface InternshipTaskWithSubmission extends InternshipTask {
  submission?: InternshipTaskSubmission;
}

export const INTERNSHIP_STATUS_LABELS: Record<InternshipStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  closed: 'Closed',
  completed: 'Completed',
};

export const APPLICATION_STATUS_LABELS: Record<InternshipApplicationStatus, string> = {
  pending: 'Pending Review',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const TASK_STATUS_LABELS: Record<InternshipTaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  approved: 'Approved',
  revision_needed: 'Needs Revision',
};

export const OFFER_STATUS_LABELS: Record<OfferLetterStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
};
