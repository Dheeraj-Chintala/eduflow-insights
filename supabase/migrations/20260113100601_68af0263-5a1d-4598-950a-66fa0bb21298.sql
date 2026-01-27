
-- Drop tables if they exist from partial creation
DROP TABLE IF EXISTS public.question_bank_options CASCADE;
DROP TABLE IF EXISTS public.question_bank CASCADE;
DROP TABLE IF EXISTS public.assessment_answers CASCADE;
DROP TABLE IF EXISTS public.assessment_submissions CASCADE;
DROP TABLE IF EXISTS public.question_options CASCADE;
DROP TABLE IF EXISTS public.assessment_questions CASCADE;
DROP TABLE IF EXISTS public.assessments CASCADE;

-- Drop types
DROP TYPE IF EXISTS question_type CASCADE;
DROP TYPE IF EXISTS assessment_status CASCADE;
DROP TYPE IF EXISTS submission_status CASCADE;

-- Create enum for question types
CREATE TYPE question_type AS ENUM ('mcq', 'descriptive', 'case_study', 'file_upload', 'true_false', 'fill_blank');

-- Create enum for assessment status
CREATE TYPE assessment_status AS ENUM ('draft', 'published', 'closed', 'archived');

-- Create enum for submission status
CREATE TYPE submission_status AS ENUM ('in_progress', 'submitted', 'graded', 'retake_allowed');

-- Assessments table
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  assessment_type TEXT NOT NULL DEFAULT 'quiz',
  status assessment_status NOT NULL DEFAULT 'draft',
  duration_minutes INTEGER,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  total_marks NUMERIC(10,2) NOT NULL DEFAULT 100,
  passing_marks NUMERIC(10,2) NOT NULL DEFAULT 40,
  negative_marking BOOLEAN NOT NULL DEFAULT false,
  negative_mark_value NUMERIC(5,2) DEFAULT 0,
  randomize_questions BOOLEAN NOT NULL DEFAULT false,
  randomize_options BOOLEAN NOT NULL DEFAULT false,
  questions_per_attempt INTEGER,
  show_correct_answers BOOLEAN NOT NULL DEFAULT false,
  show_score_immediately BOOLEAN NOT NULL DEFAULT true,
  max_attempts INTEGER NOT NULL DEFAULT 1,
  retake_delay_hours INTEGER DEFAULT 0,
  allow_resume BOOLEAN NOT NULL DEFAULT true,
  instructions TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Assessment questions
CREATE TABLE public.assessment_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_type question_type NOT NULL DEFAULT 'mcq',
  question_text TEXT NOT NULL,
  question_media_url TEXT,
  explanation TEXT,
  marks NUMERIC(10,2) NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  case_study_content TEXT,
  allowed_file_types TEXT[],
  max_file_size_mb INTEGER DEFAULT 10,
  auto_gradable BOOLEAN NOT NULL DEFAULT true,
  grading_rubric TEXT,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- MCQ options
CREATE TABLE public.question_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_media_url TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Student submissions
CREATE TABLE public.assessment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status submission_status NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  time_spent_seconds INTEGER DEFAULT 0,
  total_score NUMERIC(10,2),
  percentage NUMERIC(5,2),
  passed BOOLEAN,
  auto_graded_at TIMESTAMP WITH TIME ZONE,
  manually_graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID,
  grader_comments TEXT,
  question_order UUID[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, user_id, attempt_number)
);

-- Individual answers
CREATE TABLE public.assessment_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.assessment_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.question_options(id),
  selected_option_ids UUID[],
  text_answer TEXT,
  file_url TEXT,
  marks_obtained NUMERIC(10,2),
  is_correct BOOLEAN,
  auto_graded BOOLEAN DEFAULT false,
  grader_feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(submission_id, question_id)
);

-- Question bank
CREATE TABLE public.question_bank (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  category TEXT,
  tags TEXT[],
  question_type question_type NOT NULL DEFAULT 'mcq',
  question_text TEXT NOT NULL,
  question_media_url TEXT,
  explanation TEXT,
  difficulty TEXT DEFAULT 'medium',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Question bank options
CREATE TABLE public.question_bank_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_bank_id UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_media_url TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank_options ENABLE ROW LEVEL SECURITY;

-- Assessments policies (corrected parameter order: user_id first, then role)
CREATE POLICY "assessments_select" ON public.assessments FOR SELECT
USING (
  (status = 'published' AND EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE enrollments.course_id = assessments.course_id 
    AND enrollments.user_id = auth.uid()
  ))
  OR has_role(auth.uid(), 'trainer'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR created_by = auth.uid()
);

CREATE POLICY "assessments_insert" ON public.assessments FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'trainer'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "assessments_update" ON public.assessments FOR UPDATE
USING (
  created_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "assessments_delete" ON public.assessments FOR DELETE
USING (
  created_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Questions policies
CREATE POLICY "questions_select" ON public.assessment_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assessments a
    WHERE a.id = assessment_questions.assessment_id
    AND (
      (a.status = 'published' AND EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.course_id = a.course_id AND e.user_id = auth.uid()
      ))
      OR has_role(auth.uid(), 'trainer'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR a.created_by = auth.uid()
    )
  )
);

CREATE POLICY "questions_manage" ON public.assessment_questions FOR ALL
USING (
  has_role(auth.uid(), 'trainer'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Options policies
CREATE POLICY "options_select" ON public.question_options FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assessment_questions q
    JOIN public.assessments a ON a.id = q.assessment_id
    WHERE q.id = question_options.question_id
    AND (
      (a.status = 'published' AND EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.course_id = a.course_id AND e.user_id = auth.uid()
      ))
      OR has_role(auth.uid(), 'trainer'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

CREATE POLICY "options_manage" ON public.question_options FOR ALL
USING (
  has_role(auth.uid(), 'trainer'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Submissions policies
CREATE POLICY "submissions_select" ON public.assessment_submissions FOR SELECT
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'trainer'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'mentor'::app_role)
);

CREATE POLICY "submissions_insert" ON public.assessment_submissions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "submissions_update" ON public.assessment_submissions FOR UPDATE
USING (
  (user_id = auth.uid() AND status = 'in_progress')
  OR has_role(auth.uid(), 'trainer'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'mentor'::app_role)
);

-- Answers policies
CREATE POLICY "answers_select" ON public.assessment_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assessment_submissions s
    WHERE s.id = assessment_answers.submission_id
    AND (s.user_id = auth.uid() OR has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'mentor'::app_role))
  )
);

CREATE POLICY "answers_manage" ON public.assessment_answers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.assessment_submissions s
    WHERE s.id = assessment_answers.submission_id
    AND (
      (s.user_id = auth.uid() AND s.status = 'in_progress')
      OR has_role(auth.uid(), 'trainer'::app_role)
      OR has_role(auth.uid(), 'mentor'::app_role)
    )
  )
);

-- Question bank policies
CREATE POLICY "qbank_select" ON public.question_bank FOR SELECT
USING (
  has_role(auth.uid(), 'trainer'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "qbank_manage" ON public.question_bank FOR ALL
USING (
  has_role(auth.uid(), 'trainer'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "qbank_options_select" ON public.question_bank_options FOR SELECT
USING (
  has_role(auth.uid(), 'trainer'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "qbank_options_manage" ON public.question_bank_options FOR ALL
USING (
  has_role(auth.uid(), 'trainer'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Indexes
CREATE INDEX idx_assessments_course ON public.assessments(course_id);
CREATE INDEX idx_assessments_status ON public.assessments(status);
CREATE INDEX idx_questions_assessment ON public.assessment_questions(assessment_id);
CREATE INDEX idx_options_question ON public.question_options(question_id);
CREATE INDEX idx_submissions_assessment ON public.assessment_submissions(assessment_id);
CREATE INDEX idx_submissions_user ON public.assessment_submissions(user_id);
CREATE INDEX idx_answers_submission ON public.assessment_answers(submission_id);
CREATE INDEX idx_question_bank_org ON public.question_bank(org_id);

-- Update triggers
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON public.assessments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessment_questions_updated_at BEFORE UPDATE ON public.assessment_questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessment_submissions_updated_at BEFORE UPDATE ON public.assessment_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessment_answers_updated_at BEFORE UPDATE ON public.assessment_answers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-grade function
CREATE OR REPLACE FUNCTION public.auto_grade_submission(submission_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  answer_record RECORD;
  correct_option_id UUID;
  assessment_record RECORD;
  total_score NUMERIC := 0;
  total_marks NUMERIC := 0;
BEGIN
  SELECT a.* INTO assessment_record
  FROM assessments a
  JOIN assessment_submissions s ON s.assessment_id = a.id
  WHERE s.id = submission_uuid;

  FOR answer_record IN 
    SELECT aa.*, aq.question_type, aq.marks
    FROM assessment_answers aa
    JOIN assessment_questions aq ON aq.id = aa.question_id
    WHERE aa.submission_id = submission_uuid
  LOOP
    IF answer_record.question_type = 'mcq' OR answer_record.question_type = 'true_false' THEN
      SELECT id INTO correct_option_id
      FROM question_options
      WHERE question_id = answer_record.question_id AND is_correct = true
      LIMIT 1;
      
      IF answer_record.selected_option_id = correct_option_id THEN
        UPDATE assessment_answers
        SET is_correct = true, marks_obtained = answer_record.marks, auto_graded = true
        WHERE id = answer_record.id;
        total_score := total_score + answer_record.marks;
      ELSE
        IF assessment_record.negative_marking AND answer_record.selected_option_id IS NOT NULL THEN
          UPDATE assessment_answers
          SET is_correct = false, marks_obtained = -assessment_record.negative_mark_value, auto_graded = true
          WHERE id = answer_record.id;
          total_score := total_score - COALESCE(assessment_record.negative_mark_value, 0);
        ELSE
          UPDATE assessment_answers
          SET is_correct = false, marks_obtained = 0, auto_graded = true
          WHERE id = answer_record.id;
        END IF;
      END IF;
      total_marks := total_marks + answer_record.marks;
    END IF;
  END LOOP;

  UPDATE assessment_submissions
  SET 
    total_score = GREATEST(total_score, 0),
    percentage = CASE WHEN total_marks > 0 THEN (GREATEST(total_score, 0) / total_marks) * 100 ELSE 0 END,
    passed = (GREATEST(total_score, 0) >= assessment_record.passing_marks),
    auto_graded_at = now()
  WHERE id = submission_uuid;
END;
$$;

-- Add permissions
INSERT INTO public.permissions (name, category, description) VALUES
('assessments.view', 'assessments', 'View assessments'),
('assessments.create', 'assessments', 'Create assessments'),
('assessments.edit', 'assessments', 'Edit assessments'),
('assessments.delete', 'assessments', 'Delete assessments'),
('assessments.grade', 'assessments', 'Grade student submissions'),
('question_bank.view', 'assessments', 'View question bank'),
('question_bank.manage', 'assessments', 'Manage question bank')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'trainer'::app_role, id FROM public.permissions WHERE name IN ('assessments.view', 'assessments.create', 'assessments.edit', 'assessments.delete', 'assessments.grade', 'question_bank.view', 'question_bank.manage')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'mentor'::app_role, id FROM public.permissions WHERE name IN ('assessments.view', 'assessments.grade')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions WHERE name IN ('assessments.view', 'assessments.create', 'assessments.edit', 'assessments.delete', 'assessments.grade', 'question_bank.view', 'question_bank.manage')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'super_admin'::app_role, id FROM public.permissions WHERE name IN ('assessments.view', 'assessments.create', 'assessments.edit', 'assessments.delete', 'assessments.grade', 'question_bank.view', 'question_bank.manage')
ON CONFLICT DO NOTHING;
