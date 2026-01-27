// Security & Anti-Piracy Module Types

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  device_fingerprint: string | null;
  device_name: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  location: string | null;
  is_active: boolean;
  last_active_at: string;
  created_at: string;
  expires_at: string | null;
}

export interface DeviceRestriction {
  id: string;
  user_id: string;
  device_fingerprint: string;
  device_name: string | null;
  is_trusted: boolean;
  is_blocked: boolean;
  blocked_reason: string | null;
  blocked_at: string | null;
  blocked_by: string | null;
  first_seen_at: string;
  last_seen_at: string;
}

export interface IPRestriction {
  id: string;
  org_id: string | null;
  user_id: string | null;
  ip_address: string;
  ip_range_start: string | null;
  ip_range_end: string | null;
  restriction_type: 'allow' | 'block';
  reason: string | null;
  created_by: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface SecuritySettings {
  id: string;
  org_id: string | null;
  max_devices_per_user: number;
  max_concurrent_sessions: number;
  session_timeout_minutes: number;
  enable_2fa: boolean;
  require_2fa_for_roles: string[];
  enable_ip_restriction: boolean;
  enable_device_restriction: boolean;
  enable_watermark: boolean;
  watermark_text_template: string;
  enable_screen_capture_prevention: boolean;
  enable_right_click_prevention: boolean;
  video_protection_level: 'none' | 'standard' | 'high';
  download_restriction_roles: string[];
  created_at: string;
  updated_at: string;
}

export interface SecurityAuditLog {
  id: string;
  user_id: string | null;
  event_type: string;
  event_category: 'auth' | 'access' | 'content' | 'admin' | 'system';
  severity: 'info' | 'warning' | 'critical';
  description: string | null;
  ip_address: string | null;
  device_fingerprint: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface User2FASettings {
  id: string;
  user_id: string;
  is_enabled: boolean;
  method: 'totp' | 'sms' | 'email';
  totp_secret: string | null;
  backup_codes: string[] | null;
  phone_number: string | null;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentAccessLog {
  id: string;
  user_id: string;
  content_type: 'video' | 'document' | 'audio' | 'assessment';
  content_id: string;
  course_id: string | null;
  lesson_id: string | null;
  access_type: 'view' | 'download' | 'stream';
  ip_address: string | null;
  device_fingerprint: string | null;
  duration_seconds: number | null;
  watermark_applied: boolean;
  created_at: string;
}

// Utility types
export type SecurityEventType = 
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'session_expired'
  | 'device_blocked'
  | 'device_trusted'
  | 'ip_blocked'
  | '2fa_enabled'
  | '2fa_disabled'
  | '2fa_verified'
  | '2fa_failed'
  | 'password_changed'
  | 'content_accessed'
  | 'download_attempt'
  | 'screen_capture_attempt'
  | 'suspicious_activity';

export interface DeviceInfo {
  fingerprint: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
}
