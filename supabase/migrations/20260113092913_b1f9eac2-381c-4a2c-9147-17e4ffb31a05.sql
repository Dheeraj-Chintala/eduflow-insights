-- Step 1: Drop dependent policies first
DROP POLICY IF EXISTS "Instructors can create courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can view all courses in their org" ON public.courses;
DROP POLICY IF EXISTS "Admins can view all enrollments in their org" ON public.enrollments;

-- Step 2: Drop the old has_role function
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- Step 3: Clean up any partial migration state
DROP TABLE IF EXISTS public.user_custom_roles CASCADE;
DROP TABLE IF EXISTS public.custom_role_permissions CASCADE;
DROP TABLE IF EXISTS public.custom_roles CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TYPE IF EXISTS public.app_role_new CASCADE;

-- Step 4: Update the user_roles table - add temp column
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS role_text TEXT;

-- Copy existing roles to text column
UPDATE public.user_roles SET role_text = role::text WHERE role_text IS NULL;

-- Drop the role column
ALTER TABLE public.user_roles DROP COLUMN role;

-- Step 5: Drop the old enum
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Step 6: Create new enum with all roles
CREATE TYPE public.app_role AS ENUM (
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
  'corporate_hr'
);

-- Step 7: Add the new role column with the new enum type
ALTER TABLE public.user_roles ADD COLUMN role public.app_role;

-- Step 8: Migrate existing roles to new enum values
UPDATE public.user_roles SET role = CASE role_text
  WHEN 'super_admin' THEN 'super_admin'::public.app_role
  WHEN 'org_admin' THEN 'admin'::public.app_role
  WHEN 'instructor' THEN 'trainer'::public.app_role
  WHEN 'content_creator' THEN 'trainer'::public.app_role
  WHEN 'manager' THEN 'corporate_hr'::public.app_role
  WHEN 'learner' THEN 'student'::public.app_role
  WHEN 'guest' THEN 'student'::public.app_role
  ELSE 'student'::public.app_role
END;

-- Step 9: Make role NOT NULL and drop temp column
ALTER TABLE public.user_roles ALTER COLUMN role SET NOT NULL;
ALTER TABLE public.user_roles DROP COLUMN role_text;

-- Step 10: Create permissions table
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 11: Create role_permissions junction table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- Step 12: Create custom_roles table for admin-defined roles
CREATE TABLE public.custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, name)
);

-- Step 13: Create custom_role_permissions junction
CREATE TABLE public.custom_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_role_id UUID NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(custom_role_id, permission_id)
);

-- Step 14: Create user_custom_roles for assigning custom roles to users
CREATE TABLE public.user_custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  custom_role_id UUID NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, custom_role_id)
);

-- Step 15: Insert default permissions
INSERT INTO public.permissions (name, description, category) VALUES
  ('courses.view', 'View courses', 'courses'),
  ('courses.create', 'Create courses', 'courses'),
  ('courses.edit', 'Edit courses', 'courses'),
  ('courses.delete', 'Delete courses', 'courses'),
  ('courses.publish', 'Publish/unpublish courses', 'courses'),
  ('users.view', 'View users', 'users'),
  ('users.create', 'Create users', 'users'),
  ('users.edit', 'Edit users', 'users'),
  ('users.delete', 'Delete users', 'users'),
  ('users.assign_roles', 'Assign roles to users', 'users'),
  ('enrollments.view', 'View enrollments', 'enrollments'),
  ('enrollments.create', 'Enroll users in courses', 'enrollments'),
  ('enrollments.delete', 'Remove enrollments', 'enrollments'),
  ('org.view', 'View organization settings', 'organization'),
  ('org.edit', 'Edit organization settings', 'organization'),
  ('org.manage_roles', 'Manage custom roles', 'organization'),
  ('reports.view', 'View reports and analytics', 'reports'),
  ('reports.export', 'Export reports', 'reports');

-- Step 16: Assign permissions to roles
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'super_admin'::public.app_role, id FROM public.permissions;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::public.app_role, id FROM public.permissions 
WHERE name NOT IN ('org.manage_roles');

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'sub_admin'::public.app_role, id FROM public.permissions 
WHERE name IN ('courses.view', 'courses.create', 'courses.edit', 'users.view', 'users.create', 'users.edit', 'enrollments.view', 'enrollments.create', 'reports.view');

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'trainer'::public.app_role, id FROM public.permissions 
WHERE name IN ('courses.view', 'courses.create', 'courses.edit', 'courses.publish', 'enrollments.view', 'reports.view');

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'mentor'::public.app_role, id FROM public.permissions 
WHERE name IN ('courses.view', 'users.view', 'enrollments.view', 'reports.view');

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'student'::public.app_role, id FROM public.permissions 
WHERE name IN ('courses.view', 'enrollments.view');

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'corporate_hr'::public.app_role, id FROM public.permissions 
WHERE name IN ('courses.view', 'users.view', 'users.create', 'enrollments.view', 'enrollments.create', 'reports.view', 'reports.export');

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'franchise'::public.app_role, id FROM public.permissions 
WHERE name IN ('courses.view', 'users.view', 'users.create', 'enrollments.view', 'enrollments.create', 'reports.view');

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'distributor'::public.app_role, id FROM public.permissions 
WHERE name IN ('courses.view', 'users.view', 'enrollments.view', 'reports.view');

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'super_distributor'::public.app_role, id FROM public.permissions 
WHERE name IN ('courses.view', 'users.view', 'users.create', 'enrollments.view', 'enrollments.create', 'reports.view', 'reports.export');

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'affiliate'::public.app_role, id FROM public.permissions 
WHERE name IN ('courses.view', 'enrollments.view', 'reports.view');

-- Step 17: Create has_role function with new enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Step 18: Create has_permission function
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id AND p.name = _permission
    UNION
    SELECT 1 FROM public.user_custom_roles ucr
    JOIN public.custom_role_permissions crp ON crp.custom_role_id = ucr.custom_role_id
    JOIN public.permissions p ON p.id = crp.permission_id
    WHERE ucr.user_id = _user_id AND p.name = _permission
  )
$$;

-- Step 19: Create has_any_permission function
CREATE OR REPLACE FUNCTION public.has_any_permission(_user_id uuid, _permissions text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id AND p.name = ANY(_permissions)
    UNION
    SELECT 1 FROM public.user_custom_roles ucr
    JOIN public.custom_role_permissions crp ON crp.custom_role_id = ucr.custom_role_id
    JOIN public.permissions p ON p.id = crp.permission_id
    WHERE ucr.user_id = _user_id AND p.name = ANY(_permissions)
  )
$$;

-- Step 20: Enable RLS on new tables
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_roles ENABLE ROW LEVEL SECURITY;

-- Step 21: RLS Policies
CREATE POLICY "Authenticated users can view permissions"
  ON public.permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view role permissions"
  ON public.role_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view custom roles in their org"
  ON public.custom_roles FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage custom roles"
  ON public.custom_roles FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid()) AND public.has_permission(auth.uid(), 'org.manage_roles'))
  WITH CHECK (org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid()) AND public.has_permission(auth.uid(), 'org.manage_roles'));

CREATE POLICY "Users can view custom role permissions in their org"
  ON public.custom_role_permissions FOR SELECT TO authenticated
  USING (custom_role_id IN (SELECT id FROM public.custom_roles WHERE org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid())));

CREATE POLICY "Admins can manage custom role permissions"
  ON public.custom_role_permissions FOR ALL TO authenticated
  USING (custom_role_id IN (SELECT id FROM public.custom_roles WHERE org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid())) AND public.has_permission(auth.uid(), 'org.manage_roles'))
  WITH CHECK (custom_role_id IN (SELECT id FROM public.custom_roles WHERE org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid())) AND public.has_permission(auth.uid(), 'org.manage_roles'));

CREATE POLICY "Users can view their own custom roles"
  ON public.user_custom_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user custom roles in org"
  ON public.user_custom_roles FOR SELECT TO authenticated
  USING (user_id IN (SELECT user_id FROM public.profiles WHERE org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid())) AND public.has_permission(auth.uid(), 'users.view'));

CREATE POLICY "Admins can manage user custom roles"
  ON public.user_custom_roles FOR ALL TO authenticated
  USING (user_id IN (SELECT user_id FROM public.profiles WHERE org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid())) AND public.has_permission(auth.uid(), 'users.assign_roles'))
  WITH CHECK (user_id IN (SELECT user_id FROM public.profiles WHERE org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid())) AND public.has_permission(auth.uid(), 'users.assign_roles'));

-- Step 22: Recreate policies on courses with new enum
CREATE POLICY "Trainers can create courses"
  ON public.courses FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(auth.uid(), 'courses.create'));

CREATE POLICY "Admins can view all courses in their org"
  ON public.courses FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid())
    AND public.has_permission(auth.uid(), 'courses.view')
  );

-- Step 23: Recreate policies on enrollments with new enum
CREATE POLICY "Admins can view all enrollments in their org"
  ON public.enrollments FOR SELECT TO authenticated
  USING (
    course_id IN (SELECT id FROM public.courses WHERE org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid()))
    AND public.has_permission(auth.uid(), 'enrollments.view')
  );