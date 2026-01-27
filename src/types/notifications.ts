export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'in_app' | 'push';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type ReminderType = 'class' | 'assignment' | 'payment' | 'deadline' | 'custom';

export interface NotificationTemplate {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  html_body?: string;
  available_variables: string[];
  category?: string;
  event_trigger?: string;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserNotification {
  id: string;
  user_id: string;
  org_id: string;
  title: string;
  message: string;
  notification_type: string;
  priority: string;
  action_url?: string;
  action_label?: string;
  related_type?: string;
  related_id?: string;
  is_read: boolean;
  read_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  category_preferences: Record<string, boolean>;
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  email_digest_enabled: boolean;
  email_digest_frequency: string;
  created_at: string;
  updated_at: string;
}

export interface DripCampaign {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  campaign_type: string;
  trigger_event?: string;
  trigger_conditions: Record<string, any>;
  target_roles: string[];
  target_courses: string[];
  status: CampaignStatus;
  total_enrolled: number;
  total_completed: number;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DripCampaignStep {
  id: string;
  campaign_id: string;
  step_number: number;
  name: string;
  delay_days: number;
  delay_hours: number;
  channel: NotificationChannel;
  template_id?: string;
  subject?: string;
  body?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduledReminder {
  id: string;
  org_id: string;
  user_id: string;
  reminder_type: ReminderType;
  title: string;
  message: string;
  channels: NotificationChannel[];
  scheduled_for: string;
  related_type?: string;
  related_id?: string;
  status: string;
  sent_at?: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  recurrence_end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface MessageLog {
  id: string;
  org_id: string;
  user_id: string;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  body: string;
  template_id?: string;
  campaign_id?: string;
  reminder_id?: string;
  status: NotificationStatus;
  provider?: string;
  provider_message_id?: string;
  error_message?: string;
  retry_count: number;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  org_id: string;
  title: string;
  content: string;
  target_roles: string[];
  target_courses: string[];
  priority: string;
  display_type: string;
  starts_at?: string;
  ends_at?: string;
  is_active: boolean;
  is_dismissible: boolean;
  created_at: string;
  updated_at: string;
}

export const CHANNEL_ICONS: Record<NotificationChannel, string> = {
  email: '📧',
  sms: '📱',
  whatsapp: '💬',
  in_app: '🔔',
  push: '📲',
};

export const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  error: 'bg-red-100 text-red-800 border-red-200',
};

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};
