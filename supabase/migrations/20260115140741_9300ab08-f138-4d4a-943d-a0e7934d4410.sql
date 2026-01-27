-- =====================================================
-- INSTRUCTOR PANEL DATABASE SCHEMA
-- =====================================================

-- 1. Create live_classes table for live class scheduling
CREATE TABLE public.live_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.course_batches(id) ON DELETE SET NULL,
  instructor_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  meeting_url TEXT,
  meeting_platform TEXT DEFAULT 'zoom',
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  recording_url TEXT,
  max_attendees INTEGER,
  notify_students BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Create live_class_attendance table
CREATE TABLE public.live_class_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  live_class_id UUID NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'attended', 'absent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES public.course_batches(id) ON DELETE SET NULL,
  instructor_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  max_marks INTEGER DEFAULT 100,
  passing_marks INTEGER DEFAULT 40,
  allow_late_submission BOOLEAN DEFAULT false,
  late_penalty_percent INTEGER DEFAULT 0,
  allow_resubmission BOOLEAN DEFAULT true,
  max_resubmissions INTEGER DEFAULT 2,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create assignment_submissions table
CREATE TABLE public.assignment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  submission_text TEXT,
  attachment_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_late BOOLEAN DEFAULT false,
  submission_number INTEGER DEFAULT 1,
  marks_obtained INTEGER,
  feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned', 'resubmit_requested')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create instructor_revenue table (optional, admin-controlled visibility)
CREATE TABLE public.instructor_revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  instructor_share_percent NUMERIC(5,2) DEFAULT 50,
  instructor_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  platform_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid', 'cancelled')),
  payout_date TIMESTAMP WITH TIME ZONE,
  transaction_ref TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create instructor_settings table for admin-controlled features
CREATE TABLE public.instructor_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL UNIQUE,
  show_revenue BOOLEAN DEFAULT false,
  revenue_share_percent NUMERIC(5,2) DEFAULT 50,
  can_schedule_live_classes BOOLEAN DEFAULT true,
  can_issue_certificates BOOLEAN DEFAULT false,
  max_courses INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- ENABLE RLS ON ALL NEW TABLES
-- =====================================================

ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_class_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES FOR LIVE_CLASSES
-- =====================================================

-- Instructors can manage their own live classes
CREATE POLICY "Instructors can manage their live classes"
ON public.live_classes
FOR ALL
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

-- Students can view live classes for their enrolled courses
CREATE POLICY "Students can view enrolled course live classes"
ON public.live_classes
FOR SELECT
USING (
  course_id IN (
    SELECT course_id FROM public.enrollments WHERE user_id = auth.uid()
  )
);

-- Admins can view all live classes
CREATE POLICY "Admins can view all live classes"
ON public.live_classes
FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

-- =====================================================
-- RLS POLICIES FOR LIVE_CLASS_ATTENDANCE
-- =====================================================

-- Instructors can manage attendance for their classes
CREATE POLICY "Instructors can manage class attendance"
ON public.live_class_attendance
FOR ALL
USING (
  live_class_id IN (
    SELECT id FROM public.live_classes WHERE instructor_id = auth.uid()
  )
);

-- Students can view their own attendance
CREATE POLICY "Students can view their own attendance"
ON public.live_class_attendance
FOR SELECT
USING (user_id = auth.uid());

-- =====================================================
-- RLS POLICIES FOR ASSIGNMENTS
-- =====================================================

-- Instructors can manage their assignments
CREATE POLICY "Instructors can manage their assignments"
ON public.assignments
FOR ALL
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

-- Students can view published assignments for enrolled courses
CREATE POLICY "Students can view published assignments"
ON public.assignments
FOR SELECT
USING (
  status = 'published' AND
  course_id IN (
    SELECT course_id FROM public.enrollments WHERE user_id = auth.uid()
  )
);

-- Admins can view all assignments
CREATE POLICY "Admins can view all assignments"
ON public.assignments
FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

-- =====================================================
-- RLS POLICIES FOR ASSIGNMENT_SUBMISSIONS
-- =====================================================

-- Students can submit and view their own submissions
CREATE POLICY "Students can manage their submissions"
ON public.assignment_submissions
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Instructors can view and grade submissions for their assignments
CREATE POLICY "Instructors can manage submissions for their assignments"
ON public.assignment_submissions
FOR ALL
USING (
  assignment_id IN (
    SELECT id FROM public.assignments WHERE instructor_id = auth.uid()
  )
);

-- =====================================================
-- RLS POLICIES FOR INSTRUCTOR_REVENUE
-- =====================================================

-- Instructors can view their own revenue only if show_revenue is enabled
CREATE POLICY "Instructors can view their revenue if enabled"
ON public.instructor_revenue
FOR SELECT
USING (
  instructor_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.instructor_settings 
    WHERE instructor_id = auth.uid() AND show_revenue = true
  )
);

-- Admins can manage all revenue records
CREATE POLICY "Admins can manage all revenue"
ON public.instructor_revenue
FOR ALL
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

-- =====================================================
-- RLS POLICIES FOR INSTRUCTOR_SETTINGS
-- =====================================================

-- Instructors can view their own settings
CREATE POLICY "Instructors can view their settings"
ON public.instructor_settings
FOR SELECT
USING (instructor_id = auth.uid());

-- Admins can manage all instructor settings
CREATE POLICY "Admins can manage instructor settings"
ON public.instructor_settings
FOR ALL
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_live_classes_instructor ON public.live_classes(instructor_id);
CREATE INDEX idx_live_classes_course ON public.live_classes(course_id);
CREATE INDEX idx_live_classes_batch ON public.live_classes(batch_id);
CREATE INDEX idx_live_classes_scheduled ON public.live_classes(scheduled_at);
CREATE INDEX idx_live_class_attendance_class ON public.live_class_attendance(live_class_id);
CREATE INDEX idx_live_class_attendance_user ON public.live_class_attendance(user_id);
CREATE INDEX idx_assignments_instructor ON public.assignments(instructor_id);
CREATE INDEX idx_assignments_course ON public.assignments(course_id);
CREATE INDEX idx_assignments_due_date ON public.assignments(due_date);
CREATE INDEX idx_assignment_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_user ON public.assignment_submissions(user_id);
CREATE INDEX idx_instructor_revenue_instructor ON public.instructor_revenue(instructor_id);

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================

CREATE TRIGGER update_live_classes_updated_at
BEFORE UPDATE ON public.live_classes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignment_submissions_updated_at
BEFORE UPDATE ON public.assignment_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instructor_revenue_updated_at
BEFORE UPDATE ON public.instructor_revenue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instructor_settings_updated_at
BEFORE UPDATE ON public.instructor_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- NEW PERMISSIONS FOR INSTRUCTOR PANEL
-- =====================================================

INSERT INTO public.permissions (name, description, category) VALUES
  ('live_classes.view', 'View live classes', 'instructor'),
  ('live_classes.manage', 'Create and manage live classes', 'instructor'),
  ('assignments.view', 'View assignments', 'instructor'),
  ('assignments.manage', 'Create and manage assignments', 'instructor'),
  ('assignments.grade', 'Grade assignment submissions', 'instructor'),
  ('students.view', 'View student lists and progress', 'instructor'),
  ('revenue.view', 'View revenue and earnings', 'instructor')
ON CONFLICT DO NOTHING;

-- Assign permissions to trainer role
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'trainer', id FROM public.permissions 
WHERE name IN (
  'live_classes.view', 'live_classes.manage',
  'assignments.view', 'assignments.manage', 'assignments.grade',
  'students.view'
)
ON CONFLICT DO NOTHING;

-- Assign view permission to mentor role
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'mentor', id FROM public.permissions 
WHERE name IN ('live_classes.view', 'assignments.view', 'students.view')
ON CONFLICT DO NOTHING;