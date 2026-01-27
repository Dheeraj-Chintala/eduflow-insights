-- Create enums for job module
CREATE TYPE public.job_status AS ENUM ('draft', 'open', 'closed', 'filled');
CREATE TYPE public.job_application_status AS ENUM ('pending', 'shortlisted', 'interview_scheduled', 'selected', 'rejected', 'withdrawn');
CREATE TYPE public.interview_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.employment_type AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'freelance');

-- Create employers table
CREATE TABLE public.employers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  company_description TEXT,
  company_logo_url TEXT,
  website_url TEXT,
  industry TEXT,
  company_size TEXT,
  location TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_postings table
CREATE TABLE public.job_postings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID NOT NULL REFERENCES public.employers(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  responsibilities TEXT,
  requirements TEXT,
  skills_required TEXT[],
  employment_type public.employment_type DEFAULT 'full_time',
  experience_min_years INTEGER DEFAULT 0,
  experience_max_years INTEGER,
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_currency TEXT DEFAULT 'INR',
  location TEXT,
  is_remote BOOLEAN DEFAULT false,
  eligibility_criteria TEXT,
  application_deadline TIMESTAMP WITH TIME ZONE,
  max_applications INTEGER,
  status public.job_status DEFAULT 'draft',
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_resumes table
CREATE TABLE public.student_resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resume_url TEXT,
  resume_data JSONB,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  headline TEXT,
  summary TEXT,
  skills TEXT[],
  education JSONB,
  experience JSONB,
  projects JSONB,
  certifications JSONB,
  languages TEXT[],
  linkedin_url TEXT,
  portfolio_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create job_applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  resume_id UUID REFERENCES public.student_resumes(id),
  cover_letter TEXT,
  status public.job_application_status DEFAULT 'pending',
  employer_notes TEXT,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_id, user_id)
);

-- Create interviews table
CREATE TABLE public.interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  interviewer_name TEXT,
  interview_type TEXT DEFAULT 'video',
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  meeting_url TEXT,
  location TEXT,
  status public.interview_status DEFAULT 'scheduled',
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create placements table for tracking final outcomes
CREATE TABLE public.placements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  employer_id UUID NOT NULL REFERENCES public.employers(id) ON DELETE CASCADE,
  offer_letter_url TEXT,
  offered_salary NUMERIC,
  salary_currency TEXT DEFAULT 'INR',
  joining_date DATE,
  status TEXT DEFAULT 'offered',
  accepted_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;

-- Employers policies
CREATE POLICY "Users can view their own employer profile"
ON public.employers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own employer profile"
ON public.employers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own employer profile"
ON public.employers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all employers"
ON public.employers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin', 'sub_admin')
  )
);

CREATE POLICY "Admins can manage employers"
ON public.employers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin')
  )
);

-- Job postings policies
CREATE POLICY "Anyone can view open job postings"
ON public.job_postings FOR SELECT
USING (status = 'open');

CREATE POLICY "Employers can view their own job postings"
ON public.job_postings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.employers e
    WHERE e.id = employer_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Employers can create job postings"
ON public.job_postings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employers e
    WHERE e.id = employer_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Employers can update their own job postings"
ON public.job_postings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.employers e
    WHERE e.id = employer_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Employers can delete their own job postings"
ON public.job_postings FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.employers e
    WHERE e.id = employer_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all job postings"
ON public.job_postings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin', 'sub_admin')
  )
);

-- Student resumes policies
CREATE POLICY "Users can view their own resume"
ON public.student_resumes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resume"
ON public.student_resumes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resume"
ON public.student_resumes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Employers can view public resumes"
ON public.student_resumes FOR SELECT
USING (is_public = true);

CREATE POLICY "Employers can view applicant resumes"
ON public.student_resumes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.job_applications ja
    JOIN public.job_postings jp ON ja.job_id = jp.id
    JOIN public.employers e ON jp.employer_id = e.id
    WHERE ja.resume_id = student_resumes.id
    AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all resumes"
ON public.student_resumes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin', 'sub_admin')
  )
);

-- Job applications policies
CREATE POLICY "Users can view their own applications"
ON public.job_applications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create applications"
ON public.job_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
ON public.job_applications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Employers can view applications for their jobs"
ON public.job_applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.job_postings jp
    JOIN public.employers e ON jp.employer_id = e.id
    WHERE jp.id = job_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Employers can update applications for their jobs"
ON public.job_applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.job_postings jp
    JOIN public.employers e ON jp.employer_id = e.id
    WHERE jp.id = job_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all applications"
ON public.job_applications FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin', 'sub_admin')
  )
);

-- Interviews policies
CREATE POLICY "Users can view their own interviews"
ON public.interviews FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Employers can view interviews for their jobs"
ON public.interviews FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.job_postings jp
    JOIN public.employers e ON jp.employer_id = e.id
    WHERE jp.id = job_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Employers can manage interviews for their jobs"
ON public.interviews FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.job_postings jp
    JOIN public.employers e ON jp.employer_id = e.id
    WHERE jp.id = job_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all interviews"
ON public.interviews FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin', 'sub_admin')
  )
);

-- Placements policies
CREATE POLICY "Users can view their own placements"
ON public.placements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Employers can view placements for their company"
ON public.placements FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.employers e
    WHERE e.id = employer_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Employers can manage placements for their company"
ON public.placements FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.employers e
    WHERE e.id = employer_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all placements"
ON public.placements FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin', 'sub_admin')
  )
);

-- Create indexes for performance
CREATE INDEX idx_job_postings_employer ON public.job_postings(employer_id);
CREATE INDEX idx_job_postings_status ON public.job_postings(status);
CREATE INDEX idx_job_postings_org ON public.job_postings(org_id);
CREATE INDEX idx_job_applications_job ON public.job_applications(job_id);
CREATE INDEX idx_job_applications_user ON public.job_applications(user_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);
CREATE INDEX idx_interviews_application ON public.interviews(application_id);
CREATE INDEX idx_interviews_scheduled ON public.interviews(scheduled_at);
CREATE INDEX idx_placements_job ON public.placements(job_id);
CREATE INDEX idx_placements_employer ON public.placements(employer_id);

-- Create update triggers
CREATE TRIGGER update_employers_updated_at
BEFORE UPDATE ON public.employers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at
BEFORE UPDATE ON public.job_postings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_resumes_updated_at
BEFORE UPDATE ON public.student_resumes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at
BEFORE UPDATE ON public.interviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_placements_updated_at
BEFORE UPDATE ON public.placements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();