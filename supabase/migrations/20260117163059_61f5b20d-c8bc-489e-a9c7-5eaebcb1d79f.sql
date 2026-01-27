-- Internship Management Module Schema

-- Internship status enum
DO $$ BEGIN
  CREATE TYPE internship_status AS ENUM ('draft', 'active', 'closed', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Application status enum
DO $$ BEGIN
  CREATE TYPE internship_application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Offer letter status enum
DO $$ BEGIN
  CREATE TYPE offer_letter_status AS ENUM ('draft', 'sent', 'accepted', 'declined', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Internship task status enum
DO $$ BEGIN
  CREATE TYPE internship_task_status AS ENUM ('pending', 'in_progress', 'submitted', 'approved', 'revision_needed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Internships table
CREATE TABLE IF NOT EXISTS public.internships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  department TEXT,
  location TEXT,
  is_remote BOOLEAN DEFAULT false,
  duration_weeks INTEGER,
  stipend_amount NUMERIC(10,2),
  stipend_currency TEXT DEFAULT 'INR',
  max_positions INTEGER DEFAULT 1,
  skills_required TEXT[],
  responsibilities TEXT,
  eligibility TEXT,
  start_date DATE,
  end_date DATE,
  application_deadline DATE,
  status internship_status DEFAULT 'draft',
  mentor_id UUID REFERENCES auth.users(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Internship applications
CREATE TABLE IF NOT EXISTS public.internship_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_letter TEXT,
  resume_url TEXT,
  portfolio_url TEXT,
  status internship_application_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(internship_id, user_id)
);

-- Internship enrollments (accepted interns)
CREATE TABLE IF NOT EXISTS public.internship_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.internship_applications(id),
  start_date DATE NOT NULL,
  expected_end_date DATE,
  actual_end_date DATE,
  progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(internship_id, user_id)
);

-- Internship tasks/projects
CREATE TABLE IF NOT EXISTS public.internship_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  attachment_url TEXT,
  due_date DATE,
  max_marks INTEGER DEFAULT 100,
  passing_marks INTEGER DEFAULT 40,
  sort_order INTEGER DEFAULT 0,
  is_mandatory BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Task submissions
CREATE TABLE IF NOT EXISTS public.internship_task_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.internship_tasks(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.internship_enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_text TEXT,
  attachment_url TEXT,
  status internship_task_status DEFAULT 'submitted',
  marks_obtained INTEGER,
  mentor_feedback TEXT,
  graded_by UUID REFERENCES auth.users(id),
  graded_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Offer letters
CREATE TABLE IF NOT EXISTS public.internship_offer_letters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.internship_applications(id) ON DELETE CASCADE,
  internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_number TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  stipend_amount NUMERIC(10,2),
  start_date DATE NOT NULL,
  end_date DATE,
  terms_and_conditions TEXT,
  status offer_letter_status DEFAULT 'draft',
  sent_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  issued_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Internship certificates (extends existing certificate system)
-- We'll use the existing certificates table with certificate_type = 'internship'

-- Enable RLS
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_offer_letters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for internships
CREATE POLICY "Users can view active internships" ON public.internships
  FOR SELECT USING (status = 'active' OR mentor_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Mentors can create internships" ON public.internships
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Mentors can update their internships" ON public.internships
  FOR UPDATE USING (mentor_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Creators can delete draft internships" ON public.internships
  FOR DELETE USING (created_by = auth.uid() AND status = 'draft');

-- RLS Policies for applications
CREATE POLICY "Users can view their own applications" ON public.internship_applications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Mentors can view applications for their internships" ON public.internship_applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.internships WHERE id = internship_id AND (mentor_id = auth.uid() OR created_by = auth.uid()))
  );

CREATE POLICY "Users can apply to internships" ON public.internship_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending applications" ON public.internship_applications
  FOR UPDATE USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Mentors can review applications" ON public.internship_applications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.internships WHERE id = internship_id AND (mentor_id = auth.uid() OR created_by = auth.uid()))
  );

-- RLS Policies for enrollments
CREATE POLICY "Users can view their enrollments" ON public.internship_enrollments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Mentors can view enrollments for their internships" ON public.internship_enrollments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.internships WHERE id = internship_id AND (mentor_id = auth.uid() OR created_by = auth.uid()))
  );

CREATE POLICY "Mentors can create enrollments" ON public.internship_enrollments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.internships WHERE id = internship_id AND (mentor_id = auth.uid() OR created_by = auth.uid()))
  );

CREATE POLICY "Mentors can update enrollments" ON public.internship_enrollments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.internships WHERE id = internship_id AND (mentor_id = auth.uid() OR created_by = auth.uid()))
  );

-- RLS Policies for tasks
CREATE POLICY "Enrolled users can view tasks" ON public.internship_tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.internship_enrollments WHERE internship_id = internship_tasks.internship_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.internships WHERE id = internship_id AND (mentor_id = auth.uid() OR created_by = auth.uid()))
  );

CREATE POLICY "Mentors can manage tasks" ON public.internship_tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.internships WHERE id = internship_id AND (mentor_id = auth.uid() OR created_by = auth.uid()))
  );

-- RLS Policies for submissions
CREATE POLICY "Users can view their submissions" ON public.internship_task_submissions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Mentors can view submissions" ON public.internship_task_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.internship_tasks t
      JOIN public.internships i ON i.id = t.internship_id
      WHERE t.id = task_id AND (i.mentor_id = auth.uid() OR i.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can submit tasks" ON public.internship_task_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending submissions" ON public.internship_task_submissions
  FOR UPDATE USING (user_id = auth.uid() AND status IN ('pending', 'revision_needed'));

CREATE POLICY "Mentors can grade submissions" ON public.internship_task_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.internship_tasks t
      JOIN public.internships i ON i.id = t.internship_id
      WHERE t.id = task_id AND (i.mentor_id = auth.uid() OR i.created_by = auth.uid())
    )
  );

-- RLS Policies for offer letters
CREATE POLICY "Users can view their offer letters" ON public.internship_offer_letters
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Mentors can view offer letters for their internships" ON public.internship_offer_letters
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.internships WHERE id = internship_id AND (mentor_id = auth.uid() OR created_by = auth.uid()))
  );

CREATE POLICY "Mentors can create offer letters" ON public.internship_offer_letters
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.internships WHERE id = internship_id AND (mentor_id = auth.uid() OR created_by = auth.uid()))
  );

CREATE POLICY "Mentors can update offer letters" ON public.internship_offer_letters
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.internships WHERE id = internship_id AND (mentor_id = auth.uid() OR created_by = auth.uid()))
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_internships_org_id ON public.internships(org_id);
CREATE INDEX IF NOT EXISTS idx_internships_status ON public.internships(status);
CREATE INDEX IF NOT EXISTS idx_internships_mentor_id ON public.internships(mentor_id);
CREATE INDEX IF NOT EXISTS idx_internship_applications_internship_id ON public.internship_applications(internship_id);
CREATE INDEX IF NOT EXISTS idx_internship_applications_user_id ON public.internship_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_internship_enrollments_internship_id ON public.internship_enrollments(internship_id);
CREATE INDEX IF NOT EXISTS idx_internship_enrollments_user_id ON public.internship_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_internship_tasks_internship_id ON public.internship_tasks(internship_id);
CREATE INDEX IF NOT EXISTS idx_internship_task_submissions_task_id ON public.internship_task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_internship_task_submissions_user_id ON public.internship_task_submissions(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_internships_updated_at
  BEFORE UPDATE ON public.internships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_internship_applications_updated_at
  BEFORE UPDATE ON public.internship_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_internship_tasks_updated_at
  BEFORE UPDATE ON public.internship_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_internship_task_submissions_updated_at
  BEFORE UPDATE ON public.internship_task_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_internship_offer_letters_updated_at
  BEFORE UPDATE ON public.internship_offer_letters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();