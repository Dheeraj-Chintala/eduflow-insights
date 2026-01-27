
-- Notification Channel Enum
CREATE TYPE public.notification_channel AS ENUM ('email', 'sms', 'whatsapp', 'in_app', 'push');

-- Notification Status Enum
CREATE TYPE public.notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'read');

-- Campaign Status Enum
CREATE TYPE public.campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');

-- Reminder Type Enum
CREATE TYPE public.reminder_type AS ENUM ('class', 'assignment', 'payment', 'deadline', 'custom');

-- =====================
-- Notification Templates Table
-- =====================
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  channel public.notification_channel NOT NULL,
  
  -- Template content
  subject TEXT, -- For email
  body TEXT NOT NULL,
  html_body TEXT, -- For email HTML
  
  -- Variables available in template
  available_variables TEXT[] DEFAULT '{}',
  
  -- Categorization
  category TEXT, -- onboarding, course, payment, reminder, marketing
  event_trigger TEXT, -- enrollment, course_complete, payment_due, etc.
  
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false, -- System templates can't be deleted
  
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- User Notifications Table (In-App)
-- =====================
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Notification type and priority
  notification_type TEXT DEFAULT 'info', -- info, success, warning, error
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Action link
  action_url TEXT,
  action_label TEXT,
  
  -- Related entity
  related_type TEXT, -- course, assignment, payment, class, etc.
  related_id UUID,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Expiry
  expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- Notification Preferences Table
-- =====================
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  
  -- Channel preferences
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  
  -- Category preferences (JSONB for flexibility)
  category_preferences JSONB DEFAULT '{
    "course_updates": true,
    "assignment_reminders": true,
    "payment_alerts": true,
    "class_reminders": true,
    "marketing": false,
    "announcements": true
  }',
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  -- Digest preferences
  email_digest_enabled BOOLEAN DEFAULT false,
  email_digest_frequency TEXT DEFAULT 'daily', -- daily, weekly
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- Drip Campaigns Table
-- =====================
CREATE TABLE public.drip_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Campaign type
  campaign_type TEXT NOT NULL, -- onboarding, engagement, course_progress, re_engagement
  
  -- Trigger conditions
  trigger_event TEXT, -- enrollment, course_start, inactivity, etc.
  trigger_conditions JSONB DEFAULT '{}',
  
  -- Target audience
  target_roles TEXT[] DEFAULT '{}',
  target_courses UUID[] DEFAULT '{}',
  
  status public.campaign_status DEFAULT 'draft',
  
  -- Stats
  total_enrolled INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- Drip Campaign Steps Table
-- =====================
CREATE TABLE public.drip_campaign_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.drip_campaigns(id) ON DELETE CASCADE,
  
  step_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  
  -- Delay from previous step or trigger
  delay_days INTEGER DEFAULT 0,
  delay_hours INTEGER DEFAULT 0,
  
  -- Message
  channel public.notification_channel NOT NULL,
  template_id UUID REFERENCES public.notification_templates(id),
  
  -- Or custom content
  subject TEXT,
  body TEXT,
  
  -- Conditions to skip this step
  skip_conditions JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- Campaign Enrollments Table
-- =====================
CREATE TABLE public.campaign_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.drip_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  current_step INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- active, completed, unsubscribed, paused
  
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  
  next_step_scheduled_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(campaign_id, user_id)
);

-- =====================
-- Scheduled Reminders Table
-- =====================
CREATE TABLE public.scheduled_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  reminder_type public.reminder_type NOT NULL,
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Channels to send on
  channels public.notification_channel[] DEFAULT ARRAY['in_app']::public.notification_channel[],
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Related entity
  related_type TEXT,
  related_id UUID,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, sent, cancelled
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Repeat settings
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT, -- daily, weekly, monthly
  recurrence_end_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- Message Logs Table
-- =====================
CREATE TABLE public.message_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  channel public.notification_channel NOT NULL,
  
  -- Message details
  recipient TEXT NOT NULL, -- email, phone number, user_id
  subject TEXT,
  body TEXT NOT NULL,
  
  -- Template used
  template_id UUID REFERENCES public.notification_templates(id),
  
  -- Related campaign/reminder
  campaign_id UUID REFERENCES public.drip_campaigns(id),
  reminder_id UUID REFERENCES public.scheduled_reminders(id),
  
  -- Status
  status public.notification_status DEFAULT 'pending',
  
  -- External provider response
  provider TEXT, -- sendgrid, twilio, etc.
  provider_message_id TEXT,
  provider_response JSONB,
  
  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- Announcements Table
-- =====================
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Targeting
  target_roles TEXT[] DEFAULT '{}', -- Empty means all
  target_courses UUID[] DEFAULT '{}',
  
  -- Display settings
  priority TEXT DEFAULT 'normal', -- low, normal, high
  display_type TEXT DEFAULT 'banner', -- banner, modal, toast
  
  -- Scheduling
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  
  is_active BOOLEAN DEFAULT true,
  is_dismissible BOOLEAN DEFAULT true,
  
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- Enable RLS
-- =====================
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drip_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drip_campaign_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- =====================
-- RLS Policies
-- =====================

-- Notification Templates (admin only)
CREATE POLICY "Admins can manage templates" ON public.notification_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- User Notifications
CREATE POLICY "Users can view own notifications" ON public.user_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.user_notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.user_notifications
  FOR INSERT WITH CHECK (true);

-- Notification Preferences
CREATE POLICY "Users can manage own preferences" ON public.notification_preferences
  FOR ALL USING (user_id = auth.uid());

-- Drip Campaigns (admin only)
CREATE POLICY "Admins can manage campaigns" ON public.drip_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- Drip Campaign Steps (admin only)
CREATE POLICY "Admins can manage campaign steps" ON public.drip_campaign_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- Campaign Enrollments
CREATE POLICY "Users can view own enrollments" ON public.campaign_enrollments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage enrollments" ON public.campaign_enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- Scheduled Reminders
CREATE POLICY "Users can view own reminders" ON public.scheduled_reminders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own reminders" ON public.scheduled_reminders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all reminders" ON public.scheduled_reminders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- Message Logs (admin only view)
CREATE POLICY "Admins can view message logs" ON public.message_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "System can create message logs" ON public.message_logs
  FOR INSERT WITH CHECK (true);

-- Announcements
CREATE POLICY "Users can view active announcements" ON public.announcements
  FOR SELECT USING (
    is_active = true 
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

CREATE POLICY "Admins can manage announcements" ON public.announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- =====================
-- Indexes
-- =====================
CREATE INDEX idx_user_notifications_user ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_unread ON public.user_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_user_notifications_created ON public.user_notifications(created_at DESC);
CREATE INDEX idx_scheduled_reminders_pending ON public.scheduled_reminders(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_message_logs_user ON public.message_logs(user_id);
CREATE INDEX idx_message_logs_created ON public.message_logs(created_at DESC);
CREATE INDEX idx_campaign_enrollments_user ON public.campaign_enrollments(user_id);
CREATE INDEX idx_announcements_active ON public.announcements(starts_at, ends_at) WHERE is_active = true;

-- =====================
-- Update Triggers
-- =====================
CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drip_campaigns_updated_at
  BEFORE UPDATE ON public.drip_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drip_campaign_steps_updated_at
  BEFORE UPDATE ON public.drip_campaign_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_enrollments_updated_at
  BEFORE UPDATE ON public.campaign_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_reminders_updated_at
  BEFORE UPDATE ON public.scheduled_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
