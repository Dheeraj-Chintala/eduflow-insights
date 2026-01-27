-- ============================================
-- ENHANCED COURSE MANAGEMENT MIGRATION
-- ============================================

-- 1. Add pricing and course type fields to courses table
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS course_type TEXT NOT NULL DEFAULT 'free' CHECK (course_type IN ('free', 'paid', 'demo')),
  ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS estimated_hours INTEGER,
  ADD COLUMN IF NOT EXISTS max_students INTEGER,
  ADD COLUMN IF NOT EXISTS enrollment_type TEXT DEFAULT 'open' CHECK (enrollment_type IN ('open', 'batch', 'approval')),
  ADD COLUMN IF NOT EXISTS access_days INTEGER, -- null means lifetime access
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- 2. Course Prerequisites Table
CREATE TABLE IF NOT EXISTS public.course_prerequisites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  prerequisite_course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, prerequisite_course_id),
  CHECK (course_id != prerequisite_course_id)
);

ALTER TABLE public.course_prerequisites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view prerequisites of accessible courses"
  ON public.course_prerequisites FOR SELECT
  USING (
    course_id IN (
      SELECT id FROM courses WHERE org_id = get_user_org_id(auth.uid()) AND status = 'published'
    ) OR
    course_id IN (SELECT id FROM courses WHERE instructor_id = auth.uid())
  );

CREATE POLICY "Instructors can manage prerequisites of their courses"
  ON public.course_prerequisites FOR ALL
  USING (course_id IN (SELECT id FROM courses WHERE instructor_id = auth.uid()));

CREATE INDEX idx_course_prerequisites_course ON public.course_prerequisites(course_id);

-- 3. Course Bundles Table
CREATE TABLE IF NOT EXISTS public.course_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  price DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  discount_percent INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.course_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active bundles in their org"
  ON public.course_bundles FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()) AND is_active = true);

CREATE POLICY "Admins can manage bundles"
  ON public.course_bundles FOR ALL
  USING (
    org_id = get_user_org_id(auth.uid()) AND 
    has_permission(auth.uid(), 'courses.create')
  );

CREATE INDEX idx_course_bundles_org ON public.course_bundles(org_id);

-- 4. Bundle Courses Junction Table
CREATE TABLE IF NOT EXISTS public.bundle_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES public.course_bundles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bundle_id, course_id)
);

ALTER TABLE public.bundle_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bundle courses"
  ON public.bundle_courses FOR SELECT
  USING (
    bundle_id IN (SELECT id FROM course_bundles WHERE org_id = get_user_org_id(auth.uid()))
  );

CREATE POLICY "Admins can manage bundle courses"
  ON public.bundle_courses FOR ALL
  USING (
    bundle_id IN (
      SELECT id FROM course_bundles 
      WHERE org_id = get_user_org_id(auth.uid()) 
      AND has_permission(auth.uid(), 'courses.create')
    )
  );

CREATE INDEX idx_bundle_courses_bundle ON public.bundle_courses(bundle_id);

-- 5. Course Batches Table
CREATE TABLE IF NOT EXISTS public.course_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  batch_code TEXT,
  max_students INTEGER,
  enrollment_start TIMESTAMP WITH TIME ZONE NOT NULL,
  enrollment_end TIMESTAMP WITH TIME ZONE NOT NULL,
  course_start TIMESTAMP WITH TIME ZONE NOT NULL,
  course_end TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'enrolling', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.course_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view batches of accessible courses"
  ON public.course_batches FOR SELECT
  USING (
    course_id IN (
      SELECT id FROM courses WHERE org_id = get_user_org_id(auth.uid())
    )
  );

CREATE POLICY "Instructors can manage batches of their courses"
  ON public.course_batches FOR ALL
  USING (course_id IN (SELECT id FROM courses WHERE instructor_id = auth.uid()));

CREATE INDEX idx_course_batches_course ON public.course_batches(course_id);
CREATE INDEX idx_course_batches_status ON public.course_batches(status);

-- 6. Add batch_id to enrollments
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.course_batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS access_revoked BOOLEAN DEFAULT false;

CREATE INDEX idx_enrollments_batch ON public.enrollments(batch_id);

-- 7. Course Access Rules Table
CREATE TABLE IF NOT EXISTS public.course_access_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('role', 'department', 'completion', 'date', 'custom')),
  rule_value JSONB NOT NULL, -- flexible storage for different rule types
  is_required BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.course_access_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view access rules of accessible courses"
  ON public.course_access_rules FOR SELECT
  USING (
    course_id IN (SELECT id FROM courses WHERE org_id = get_user_org_id(auth.uid()))
  );

CREATE POLICY "Instructors can manage access rules of their courses"
  ON public.course_access_rules FOR ALL
  USING (course_id IN (SELECT id FROM courses WHERE instructor_id = auth.uid()));

CREATE INDEX idx_course_access_rules_course ON public.course_access_rules(course_id);

-- 8. Bundle Purchases Table
CREATE TABLE IF NOT EXISTS public.bundle_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES public.course_bundles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  amount_paid DECIMAL(10, 2),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(bundle_id, user_id)
);

ALTER TABLE public.bundle_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bundle purchases"
  ON public.bundle_purchases FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can purchase bundles"
  ON public.bundle_purchases FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_bundle_purchases_user ON public.bundle_purchases(user_id);

-- 9. Add permissions for new features
INSERT INTO public.permissions (name, description, category) VALUES
  ('bundles.view', 'View course bundles', 'courses'),
  ('bundles.create', 'Create course bundles', 'courses'),
  ('bundles.edit', 'Edit course bundles', 'courses'),
  ('batches.view', 'View course batches', 'courses'),
  ('batches.create', 'Create course batches', 'courses'),
  ('batches.manage', 'Manage batch enrollments', 'courses'),
  ('access_rules.view', 'View access rules', 'courses'),
  ('access_rules.manage', 'Manage access rules', 'courses')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'trainer', id FROM permissions WHERE name IN (
  'batches.view', 'batches.create', 'batches.manage', 'access_rules.view', 'access_rules.manage'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions WHERE name IN (
  'bundles.view', 'bundles.create', 'bundles.edit', 'batches.view', 'batches.create', 
  'batches.manage', 'access_rules.view', 'access_rules.manage'
)
ON CONFLICT DO NOTHING;

-- 10. Function to check if user meets course prerequisites
CREATE OR REPLACE FUNCTION public.check_course_prerequisites(
  _course_id UUID,
  _user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  unmet_required INTEGER;
BEGIN
  SELECT COUNT(*) INTO unmet_required
  FROM course_prerequisites cp
  WHERE cp.course_id = _course_id
    AND cp.is_required = true
    AND cp.prerequisite_course_id NOT IN (
      SELECT e.course_id 
      FROM enrollments e 
      WHERE e.user_id = _user_id 
        AND e.completed_at IS NOT NULL
    );
  
  RETURN unmet_required = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11. Function to check course access based on rules
CREATE OR REPLACE FUNCTION public.check_course_access(
  _course_id UUID,
  _user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  course_record RECORD;
  enrollment_record RECORD;
BEGIN
  -- Get course details
  SELECT * INTO course_record FROM courses WHERE id = _course_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if user has enrollment
  SELECT * INTO enrollment_record 
  FROM enrollments 
  WHERE course_id = _course_id AND user_id = _user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if access is revoked
  IF enrollment_record.access_revoked THEN
    RETURN false;
  END IF;
  
  -- Check expiry
  IF enrollment_record.expires_at IS NOT NULL AND enrollment_record.expires_at < now() THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;