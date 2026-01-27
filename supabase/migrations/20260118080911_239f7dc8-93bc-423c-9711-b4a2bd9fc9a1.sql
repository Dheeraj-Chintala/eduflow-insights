-- Legal Documents Table
CREATE TABLE public.legal_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id),
  document_type TEXT NOT NULL, -- 'terms', 'privacy', 'refund', 'cookie', 'gdpr'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  effective_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, document_type, version)
);

-- User Consent Records Table
CREATE TABLE public.user_consent_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_id UUID NOT NULL REFERENCES public.legal_documents(id),
  document_type TEXT NOT NULL,
  document_version TEXT NOT NULL,
  consent_given BOOLEAN NOT NULL DEFAULT true,
  consent_method TEXT NOT NULL DEFAULT 'click', -- 'click', 'checkbox', 'signature'
  ip_address TEXT,
  user_agent TEXT,
  consented_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  withdrawal_reason TEXT
);

-- GDPR Data Requests Table
CREATE TABLE public.gdpr_data_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL, -- 'access', 'export', 'delete', 'rectify'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  data_export_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cookie Preferences Table
CREATE TABLE public.cookie_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  essential BOOLEAN NOT NULL DEFAULT true,
  analytics BOOLEAN NOT NULL DEFAULT false,
  marketing BOOLEAN NOT NULL DEFAULT false,
  functional BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdpr_data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cookie_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for legal_documents
CREATE POLICY "Anyone can view active legal documents"
  ON public.legal_documents FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage legal documents"
  ON public.legal_documents FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('super_admin', 'admin')
  ));

-- RLS Policies for user_consent_records
CREATE POLICY "Users can view their own consent records"
  ON public.user_consent_records FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own consent"
  ON public.user_consent_records FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all consent records"
  ON public.user_consent_records FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('super_admin', 'admin')
  ));

-- RLS Policies for gdpr_data_requests
CREATE POLICY "Users can manage their own GDPR requests"
  ON public.gdpr_data_requests FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all GDPR requests"
  ON public.gdpr_data_requests FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('super_admin', 'admin')
  ));

-- RLS Policies for cookie_preferences
CREATE POLICY "Users can manage their cookie preferences"
  ON public.cookie_preferences FOR ALL
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Indexes
CREATE INDEX idx_legal_documents_type ON public.legal_documents(document_type, is_active);
CREATE INDEX idx_consent_records_user ON public.user_consent_records(user_id);
CREATE INDEX idx_consent_records_document ON public.user_consent_records(document_id);
CREATE INDEX idx_gdpr_requests_user ON public.gdpr_data_requests(user_id);
CREATE INDEX idx_gdpr_requests_status ON public.gdpr_data_requests(status);

-- Triggers
CREATE TRIGGER update_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gdpr_data_requests_updated_at
  BEFORE UPDATE ON public.gdpr_data_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cookie_preferences_updated_at
  BEFORE UPDATE ON public.cookie_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();