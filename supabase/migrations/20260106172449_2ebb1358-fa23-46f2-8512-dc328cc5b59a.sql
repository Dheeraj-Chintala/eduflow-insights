-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration TEXT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  instructor_id UUID NOT NULL,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_modules table
CREATE TABLE public.course_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'video' CHECK (content_type IN ('video', 'text', 'quiz', 'file')),
  content_url TEXT,
  content_text TEXT,
  duration INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  progress INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, course_id)
);

-- Create lesson_progress table
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Courses policies
CREATE POLICY "Users can view published courses in their org"
ON public.courses FOR SELECT
USING (
  org_id = get_user_org_id(auth.uid()) 
  AND (status = 'published' OR instructor_id = auth.uid())
);

CREATE POLICY "Instructors can create courses"
ON public.courses FOR INSERT
WITH CHECK (
  instructor_id = auth.uid() 
  AND org_id = get_user_org_id(auth.uid())
  AND (has_role(auth.uid(), 'instructor') OR has_role(auth.uid(), 'content_creator') OR has_role(auth.uid(), 'org_admin') OR has_role(auth.uid(), 'super_admin'))
);

CREATE POLICY "Instructors can update their own courses"
ON public.courses FOR UPDATE
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Instructors can delete their own courses"
ON public.courses FOR DELETE
USING (instructor_id = auth.uid());

-- Course modules policies
CREATE POLICY "Users can view modules of accessible courses"
ON public.course_modules FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.courses c 
    WHERE c.id = course_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND (c.status = 'published' OR c.instructor_id = auth.uid())
  )
);

CREATE POLICY "Instructors can manage modules of their courses"
ON public.course_modules FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid())
);

CREATE POLICY "Instructors can update modules of their courses"
ON public.course_modules FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid()));

CREATE POLICY "Instructors can delete modules of their courses"
ON public.course_modules FOR DELETE
USING (EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid()));

-- Lessons policies
CREATE POLICY "Users can view lessons of accessible modules"
ON public.lessons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.course_modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = module_id
    AND c.org_id = get_user_org_id(auth.uid())
    AND (c.status = 'published' OR c.instructor_id = auth.uid())
  )
);

CREATE POLICY "Instructors can manage lessons"
ON public.lessons FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.course_modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = module_id AND c.instructor_id = auth.uid()
  )
);

CREATE POLICY "Instructors can update lessons"
ON public.lessons FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.course_modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = module_id AND c.instructor_id = auth.uid()
  )
);

CREATE POLICY "Instructors can delete lessons"
ON public.lessons FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.course_modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = module_id AND c.instructor_id = auth.uid()
  )
);

-- Enrollments policies
CREATE POLICY "Users can view their own enrollments"
ON public.enrollments FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Instructors can view enrollments for their courses"
ON public.enrollments FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid())
);

CREATE POLICY "Users can enroll in published courses"
ON public.enrollments FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.courses c 
    WHERE c.id = course_id 
    AND c.status = 'published' 
    AND c.org_id = get_user_org_id(auth.uid())
  )
);

CREATE POLICY "Users can update their own enrollment progress"
ON public.enrollments FOR UPDATE
USING (user_id = auth.uid());

-- Lesson progress policies
CREATE POLICY "Users can view their own lesson progress"
ON public.lesson_progress FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can track their own progress"
ON public.lesson_progress FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own progress"
ON public.lesson_progress FOR UPDATE
USING (user_id = auth.uid());

-- Add updated_at triggers
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_modules_updated_at
BEFORE UPDATE ON public.course_modules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add admin/manager policies for monitoring
CREATE POLICY "Admins can view all courses in their org"
ON public.courses FOR SELECT
USING (
  org_id = get_user_org_id(auth.uid())
  AND (has_role(auth.uid(), 'org_admin') OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins can view all enrollments in their org"
ON public.enrollments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.courses c 
    WHERE c.id = course_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(), 'org_admin') OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager'))
  )
);