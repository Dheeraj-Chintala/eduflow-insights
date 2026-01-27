-- Security & Anti-Piracy Module Tables

-- User sessions tracking table
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_fingerprint TEXT,
  device_name TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Device restrictions table
CREATE TABLE public.device_restrictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  is_trusted BOOLEAN DEFAULT false,
  is_blocked BOOLEAN DEFAULT false,
  blocked_reason TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE,
  blocked_by UUID,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, device_fingerprint)
);

-- IP restrictions table
CREATE TABLE public.ip_restrictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  ip_range_start TEXT,
  ip_range_end TEXT,
  restriction_type TEXT NOT NULL CHECK (restriction_type IN ('allow', 'block')),
  reason TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Security settings table (per-org or global)
CREATE TABLE public.security_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  max_devices_per_user INTEGER DEFAULT 3,
  max_concurrent_sessions INTEGER DEFAULT 2,
  session_timeout_minutes INTEGER DEFAULT 1440,
  enable_2fa BOOLEAN DEFAULT false,
  require_2fa_for_roles TEXT[] DEFAULT '{}',
  enable_ip_restriction BOOLEAN DEFAULT false,
  enable_device_restriction BOOLEAN DEFAULT true,
  enable_watermark BOOLEAN DEFAULT true,
  watermark_text_template TEXT DEFAULT '{{user_email}} - {{timestamp}}',
  enable_screen_capture_prevention BOOLEAN DEFAULT true,
  enable_right_click_prevention BOOLEAN DEFAULT true,
  video_protection_level TEXT DEFAULT 'standard' CHECK (video_protection_level IN ('none', 'standard', 'high')),
  download_restriction_roles TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Security audit logs
CREATE TABLE public.security_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL CHECK (event_category IN ('auth', 'access', 'content', 'admin', 'system')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  description TEXT,
  ip_address TEXT,
  device_fingerprint TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Two-factor authentication settings
CREATE TABLE public.user_2fa_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  method TEXT DEFAULT 'totp' CHECK (method IN ('totp', 'sms', 'email')),
  totp_secret TEXT,
  backup_codes TEXT[],
  phone_number TEXT,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Content access logs (for DRM tracking)
CREATE TABLE public.content_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'document', 'audio', 'assessment')),
  content_id TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'stream')),
  ip_address TEXT,
  device_fingerprint TEXT,
  duration_seconds INTEGER,
  watermark_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_2fa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.user_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage sessions"
  ON public.user_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies for device_restrictions
CREATE POLICY "Users can view their own device restrictions"
  ON public.device_restrictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage device restrictions"
  ON public.device_restrictions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies for ip_restrictions
CREATE POLICY "Admins can manage IP restrictions"
  ON public.ip_restrictions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies for security_settings
CREATE POLICY "Admins can manage security settings"
  ON public.security_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Authenticated users can view security settings"
  ON public.security_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for security_audit_logs
CREATE POLICY "Users can view their own audit logs"
  ON public.security_audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs"
  ON public.security_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "System can insert audit logs"
  ON public.security_audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for user_2fa_settings
CREATE POLICY "Users can manage their own 2FA settings"
  ON public.user_2fa_settings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view 2FA settings"
  ON public.user_2fa_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies for content_access_logs
CREATE POLICY "Users can view their own content access logs"
  ON public.content_access_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content access logs"
  ON public.content_access_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all content access logs"
  ON public.content_access_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'trainer')
    )
  );

-- Indexes for performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(is_active, last_active_at);
CREATE INDEX idx_device_restrictions_user_id ON public.device_restrictions(user_id);
CREATE INDEX idx_ip_restrictions_ip ON public.ip_restrictions(ip_address);
CREATE INDEX idx_security_audit_logs_user_id ON public.security_audit_logs(user_id, created_at);
CREATE INDEX idx_security_audit_logs_event ON public.security_audit_logs(event_type, event_category);
CREATE INDEX idx_content_access_logs_user ON public.content_access_logs(user_id, created_at);
CREATE INDEX idx_content_access_logs_content ON public.content_access_logs(content_id, content_type);

-- Update triggers
CREATE TRIGGER update_security_settings_updated_at
  BEFORE UPDATE ON public.security_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_2fa_settings_updated_at
  BEFORE UPDATE ON public.user_2fa_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();