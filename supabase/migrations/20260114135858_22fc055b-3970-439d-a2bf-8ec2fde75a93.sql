-- Certificate Types Enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'certificate_type') THEN
    CREATE TYPE public.certificate_type AS ENUM ('course', 'internship', 'experience', 'lor');
  END IF;
END $$;

-- Certificate Templates Table
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  certificate_type certificate_type NOT NULL DEFAULT 'course',
  template_html TEXT NOT NULL,
  css_styles TEXT,
  logo_position TEXT DEFAULT 'top-center',
  signature_position TEXT DEFAULT 'bottom-right',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to certificates table
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS certificate_type certificate_type DEFAULT 'course',
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.certificate_templates(id),
ADD COLUMN IF NOT EXISTS qr_code_data TEXT,
ADD COLUMN IF NOT EXISTS verification_url TEXT,
ADD COLUMN IF NOT EXISTS recipient_name TEXT,
ADD COLUMN IF NOT EXISTS recipient_email TEXT,
ADD COLUMN IF NOT EXISTS course_duration TEXT,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS issued_by TEXT,
ADD COLUMN IF NOT EXISTS authorized_signature_url TEXT,
ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS revoked_reason TEXT,
ADD COLUMN IF NOT EXISTS additional_data JSONB DEFAULT '{}';

-- Letters of Recommendation Table
CREATE TABLE IF NOT EXISTS public.letters_of_recommendation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  certificate_id UUID REFERENCES public.certificates(id) ON DELETE SET NULL,
  lor_number TEXT NOT NULL UNIQUE,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  recommendation_type TEXT NOT NULL DEFAULT 'course', -- course, internship, experience
  skills_highlighted TEXT[],
  achievements TEXT[],
  performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
  recommender_name TEXT NOT NULL,
  recommender_title TEXT,
  recommender_signature_url TEXT,
  pdf_url TEXT,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_public BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, issued, revoked
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Certificate Verification Logs
CREATE TABLE IF NOT EXISTS public.certificate_verification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id UUID REFERENCES public.certificates(id) ON DELETE SET NULL,
  lor_id UUID REFERENCES public.letters_of_recommendation(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verification_method TEXT NOT NULL, -- 'qr_scan', 'id_lookup', 'url'
  verifier_ip TEXT,
  verifier_user_agent TEXT,
  verification_result TEXT NOT NULL -- 'valid', 'expired', 'revoked', 'not_found'
);

-- Enable RLS
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters_of_recommendation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_verification_logs ENABLE ROW LEVEL SECURITY;

-- Certificate Templates Policies
CREATE POLICY "templates_view" ON public.certificate_templates
  FOR SELECT USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "templates_manage" ON public.certificate_templates
  FOR ALL USING (
    org_id = get_user_org_id(auth.uid()) AND 
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  );

-- LOR Policies
CREATE POLICY "lor_view_own" ON public.letters_of_recommendation
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "lor_view_admin" ON public.letters_of_recommendation
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'trainer'::app_role)
  );

CREATE POLICY "lor_manage" ON public.letters_of_recommendation
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'trainer'::app_role)
  );

-- Verification logs - public insert for tracking, admin view
CREATE POLICY "verification_logs_insert" ON public.certificate_verification_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "verification_logs_view" ON public.certificate_verification_logs
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Update certificates RLS for admin management
CREATE POLICY "Admins can update certificates" ON public.certificates
  FOR UPDATE USING (
    has_permission(auth.uid(), 'certificates.issue'::text)
  );

CREATE POLICY "Admins can delete certificates" ON public.certificates
  FOR DELETE USING (
    has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_certificates_number ON public.certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_type ON public.certificates(certificate_type);
CREATE INDEX IF NOT EXISTS idx_lor_number ON public.letters_of_recommendation(lor_number);
CREATE INDEX IF NOT EXISTS idx_lor_user ON public.letters_of_recommendation(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_cert ON public.certificate_verification_logs(certificate_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_certificate_templates_updated_at ON public.certificate_templates;
CREATE TRIGGER update_certificate_templates_updated_at
  BEFORE UPDATE ON public.certificate_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lor_updated_at ON public.letters_of_recommendation;
CREATE TRIGGER update_lor_updated_at
  BEFORE UPDATE ON public.letters_of_recommendation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add permissions for certificate management
INSERT INTO public.permissions (name, description, category) VALUES
  ('certificates.view', 'View all certificates in organization', 'certificates'),
  ('certificates.issue', 'Issue new certificates', 'certificates'),
  ('certificates.revoke', 'Revoke certificates', 'certificates'),
  ('lor.view', 'View letters of recommendation', 'certificates'),
  ('lor.create', 'Create letters of recommendation', 'certificates'),
  ('lor.manage', 'Manage letters of recommendation', 'certificates'),
  ('templates.view', 'View certificate templates', 'certificates'),
  ('templates.manage', 'Manage certificate templates', 'certificates')
ON CONFLICT (name) DO NOTHING;

-- Grant permissions to roles
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'super_admin'::app_role, id FROM public.permissions 
WHERE name IN ('certificates.view', 'certificates.issue', 'certificates.revoke', 'lor.view', 'lor.create', 'lor.manage', 'templates.view', 'templates.manage')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions 
WHERE name IN ('certificates.view', 'certificates.issue', 'lor.view', 'lor.create', 'lor.manage', 'templates.view', 'templates.manage')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'trainer'::app_role, id FROM public.permissions 
WHERE name IN ('certificates.view', 'certificates.issue', 'lor.view', 'lor.create')
ON CONFLICT DO NOTHING;