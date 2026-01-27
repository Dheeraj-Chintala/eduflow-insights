-- Create enums for admin module
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE public.moderation_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');
CREATE TYPE public.config_value_type AS ENUM ('string', 'number', 'boolean', 'json', 'array');
CREATE TYPE public.backup_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');

-- User Approval Requests Table
CREATE TABLE public.user_approval_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  org_id UUID REFERENCES public.organizations(id),
  requested_role public.app_role NOT NULL,
  status public.approval_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  rejection_reason TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Content Moderation Queue Table
CREATE TABLE public.content_moderation_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id),
  content_type TEXT NOT NULL, -- 'course', 'lesson', 'assessment', 'assignment', 'discussion'
  content_id UUID NOT NULL,
  content_title TEXT,
  submitted_by UUID NOT NULL,
  status public.moderation_status NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  flagged_reason TEXT,
  moderator_id UUID,
  moderation_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System Configuration Table
CREATE TABLE public.system_configuration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id),
  config_key TEXT NOT NULL,
  config_value TEXT,
  value_type public.config_value_type NOT NULL DEFAULT 'string',
  category TEXT NOT NULL, -- 'general', 'payments', 'notifications', 'security', 'content', 'branding'
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  is_editable BOOLEAN DEFAULT true,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, config_key)
);

-- Pricing Rules Table
CREATE TABLE public.pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'discount', 'markup', 'commission', 'flat_rate'
  applies_to TEXT NOT NULL, -- 'course', 'bundle', 'subscription', 'affiliate', 'franchise'
  target_id UUID, -- specific course/bundle id, null for global
  value_type TEXT NOT NULL, -- 'percentage', 'fixed'
  value NUMERIC NOT NULL,
  min_amount NUMERIC,
  max_amount NUMERIC,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  conditions JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System Backup Logs Table
CREATE TABLE public.system_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id),
  backup_type TEXT NOT NULL, -- 'full', 'incremental', 'selective'
  status public.backup_status NOT NULL DEFAULT 'pending',
  file_size_bytes BIGINT,
  file_url TEXT,
  tables_included TEXT[],
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  initiated_by UUID,
  notes TEXT,
  retention_days INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Admin Activity Log (extends existing security_audit_logs)
CREATE TABLE public.admin_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  org_id UUID REFERENCES public.organizations(id),
  action_type TEXT NOT NULL, -- 'approve_user', 'reject_user', 'moderate_content', 'update_config', 'create_backup', etc.
  target_type TEXT, -- 'user', 'course', 'config', 'backup', etc.
  target_id UUID,
  previous_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_approval_requests
CREATE POLICY "Admins can manage approval requests"
  ON public.user_approval_requests FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('super_admin', 'admin', 'sub_admin')
  ));

CREATE POLICY "Users can view own approval requests"
  ON public.user_approval_requests FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policies for content_moderation_queue
CREATE POLICY "Admins can manage moderation queue"
  ON public.content_moderation_queue FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('super_admin', 'admin', 'sub_admin')
  ));

CREATE POLICY "Content owners can view their moderation status"
  ON public.content_moderation_queue FOR SELECT
  USING (submitted_by = auth.uid());

-- RLS Policies for system_configuration
CREATE POLICY "Super admins can manage all config"
  ON public.system_configuration FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'super_admin'
  ));

CREATE POLICY "Admins can view non-sensitive config"
  ON public.system_configuration FOR SELECT
  USING (
    is_sensitive = false 
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies for pricing_rules
CREATE POLICY "Admins can manage pricing rules"
  ON public.pricing_rules FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('super_admin', 'admin')
  ));

-- RLS Policies for system_backups
CREATE POLICY "Super admins can manage backups"
  ON public.system_backups FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'super_admin'
  ));

-- RLS Policies for admin_activity_logs
CREATE POLICY "Super admins can view all activity logs"
  ON public.admin_activity_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'super_admin'
  ));

CREATE POLICY "Admins can view their own activity logs"
  ON public.admin_activity_logs FOR SELECT
  USING (admin_id = auth.uid());

CREATE POLICY "Admins can insert activity logs"
  ON public.admin_activity_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('super_admin', 'admin', 'sub_admin')
  ));

-- Indexes for performance
CREATE INDEX idx_approval_requests_status ON public.user_approval_requests(status);
CREATE INDEX idx_approval_requests_user ON public.user_approval_requests(user_id);
CREATE INDEX idx_moderation_queue_status ON public.content_moderation_queue(status);
CREATE INDEX idx_moderation_queue_content ON public.content_moderation_queue(content_type, content_id);
CREATE INDEX idx_system_config_key ON public.system_configuration(config_key);
CREATE INDEX idx_pricing_rules_type ON public.pricing_rules(rule_type, applies_to);
CREATE INDEX idx_system_backups_status ON public.system_backups(status);
CREATE INDEX idx_admin_activity_admin ON public.admin_activity_logs(admin_id);
CREATE INDEX idx_admin_activity_type ON public.admin_activity_logs(action_type);

-- Triggers for updated_at
CREATE TRIGGER update_user_approval_requests_updated_at
  BEFORE UPDATE ON public.user_approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_moderation_queue_updated_at
  BEFORE UPDATE ON public.content_moderation_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_configuration_updated_at
  BEFORE UPDATE ON public.system_configuration
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at
  BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();