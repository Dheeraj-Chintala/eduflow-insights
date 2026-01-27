// Admin & Super Admin Controls Module Types

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type ConfigValueType = 'string' | 'number' | 'boolean' | 'json' | 'array';
export type BackupStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface UserApprovalRequest {
  id: string;
  user_id: string;
  org_id: string | null;
  requested_role: string;
  status: ApprovalStatus;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined fields
  user_email?: string;
  user_name?: string;
}

export interface ContentModerationItem {
  id: string;
  org_id: string | null;
  content_type: 'course' | 'lesson' | 'assessment' | 'assignment' | 'discussion';
  content_id: string;
  content_title: string | null;
  submitted_by: string;
  status: ModerationStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  flagged_reason: string | null;
  moderator_id: string | null;
  moderation_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  submitter_email?: string;
  submitter_name?: string;
}

export interface SystemConfiguration {
  id: string;
  org_id: string | null;
  config_key: string;
  config_value: string | null;
  value_type: ConfigValueType;
  category: 'general' | 'payments' | 'notifications' | 'security' | 'content' | 'branding';
  description: string | null;
  is_sensitive: boolean;
  is_editable: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PricingRule {
  id: string;
  org_id: string;
  rule_name: string;
  rule_type: 'discount' | 'markup' | 'commission' | 'flat_rate';
  applies_to: 'course' | 'bundle' | 'subscription' | 'affiliate' | 'franchise';
  target_id: string | null;
  value_type: 'percentage' | 'fixed';
  value: number;
  min_amount: number | null;
  max_amount: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  priority: number;
  conditions: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemBackup {
  id: string;
  org_id: string | null;
  backup_type: 'full' | 'incremental' | 'selective';
  status: BackupStatus;
  file_size_bytes: number | null;
  file_url: string | null;
  tables_included: string[] | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  initiated_by: string | null;
  notes: string | null;
  retention_days: number;
  created_at: string;
}

export interface AdminActivityLog {
  id: string;
  admin_id: string;
  org_id: string | null;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  notes: string | null;
  created_at: string;
  // Joined fields
  admin_email?: string;
  admin_name?: string;
}

export interface SystemStats {
  totalUsers: number;
  pendingApprovals: number;
  totalCourses: number;
  pendingModeration: number;
  totalRevenue: number;
  activeEnrollments: number;
  totalFranchises: number;
  totalEmployers: number;
}
