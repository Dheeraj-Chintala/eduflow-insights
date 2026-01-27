export type JobStatus = 'draft' | 'open' | 'closed' | 'filled';
export type JobApplicationStatus = 'pending' | 'shortlisted' | 'interview_scheduled' | 'selected' | 'rejected' | 'withdrawn';
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';

export interface Employer {
  id: string;
  user_id: string;
  company_name: string;
  company_description?: string;
  company_logo_url?: string;
  website_url?: string;
  industry?: string;
  company_size?: string;
  location?: string;
  contact_email?: string;
  contact_phone?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobPosting {
  id: string;
  employer_id: string;
  org_id: string;
  title: string;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  skills_required?: string[];
  employment_type: EmploymentType;
  experience_min_years: number;
  experience_max_years?: number;
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  location?: string;
  is_remote: boolean;
  eligibility_criteria?: string;
  application_deadline?: string;
  max_applications?: number;
  status: JobStatus;
  posted_at?: string;
  created_at: string;
  updated_at: string;
  employer?: Employer;
}

export interface StudentResume {
  id: string;
  user_id: string;
  resume_url?: string;
  resume_data?: Record<string, unknown>;
  full_name?: string;
  email?: string;
  phone?: string;
  headline?: string;
  summary?: string;
  skills?: string[];
  education?: EducationEntry[];
  experience?: ExperienceEntry[];
  projects?: ProjectEntry[];
  certifications?: CertificationEntry[];
  languages?: string[];
  linkedin_url?: string;
  portfolio_url?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  start_year: string;
  end_year?: string;
  grade?: string;
}

export interface ExperienceEntry {
  company: string;
  title: string;
  location?: string;
  start_date: string;
  end_date?: string;
  current: boolean;
  description?: string;
}

export interface ProjectEntry {
  name: string;
  description?: string;
  url?: string;
  technologies?: string[];
}

export interface CertificationEntry {
  name: string;
  issuer: string;
  date?: string;
  url?: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  user_id: string;
  resume_id?: string;
  cover_letter?: string;
  status: JobApplicationStatus;
  employer_notes?: string;
  applied_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  updated_at: string;
  job?: JobPosting;
  resume?: StudentResume;
}

export interface Interview {
  id: string;
  application_id: string;
  job_id: string;
  user_id: string;
  interviewer_name?: string;
  interview_type: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url?: string;
  location?: string;
  status: InterviewStatus;
  feedback?: string;
  rating?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  job?: JobPosting;
  application?: JobApplication;
}

export interface Placement {
  id: string;
  application_id: string;
  job_id: string;
  user_id: string;
  employer_id: string;
  offer_letter_url?: string;
  offered_salary?: number;
  salary_currency: string;
  joining_date?: string;
  status: string;
  accepted_at?: string;
  joined_at?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  job?: JobPosting;
  employer?: Employer;
}
