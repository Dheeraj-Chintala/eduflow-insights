export type FranchiseType = 'franchise' | 'affiliate' | 'reseller' | 'super_distributor' | 'distributor';
export type FranchiseStatus = 'pending' | 'approved' | 'suspended' | 'rejected';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Franchise {
  id: string;
  user_id: string;
  org_id: string;
  parent_franchise_id?: string;
  franchise_type: FranchiseType;
  franchise_code: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  pincode?: string;
  gst_number?: string;
  pan_number?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  status: FranchiseStatus;
  approved_at?: string;
  approved_by?: string;
  suspended_at?: string;
  suspension_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  branding?: FranchiseBranding;
}

export interface FranchiseBranding {
  id: string;
  franchise_id: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  custom_domain?: string;
  tagline?: string;
  support_email?: string;
  support_phone?: string;
  footer_text?: string;
  social_facebook?: string;
  social_twitter?: string;
  social_linkedin?: string;
  social_instagram?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FranchiseStudent {
  id: string;
  franchise_id: string;
  student_user_id: string;
  referred_by_code?: string;
  enrolled_at: string;
  notes?: string;
  created_at: string;
}

export interface FranchiseLead {
  id: string;
  franchise_id: string;
  name: string;
  email?: string;
  phone?: string;
  course_interest?: string;
  source?: string;
  status: LeadStatus;
  notes?: string;
  converted_user_id?: string;
  converted_at?: string;
  follow_up_date?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface FranchiseSale {
  id: string;
  franchise_id: string;
  student_user_id: string;
  enrollment_id?: string;
  course_id?: string;
  sale_amount: number;
  currency: string;
  commission_rate: number;
  commission_amount: number;
  referral_code?: string;
  coupon_code?: string;
  sale_date: string;
  payment_status: string;
  notes?: string;
  created_at: string;
}

export interface ReferralCode {
  id: string;
  franchise_id: string;
  code: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  commission_bonus: number;
  usage_limit?: number;
  usage_count: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  org_id: string;
  franchise_id?: string;
  code: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount?: number;
  applicable_courses?: string[];
  usage_limit?: number;
  usage_count: number;
  per_user_limit: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CommissionRule {
  id: string;
  org_id: string;
  franchise_type?: FranchiseType;
  franchise_id?: string;
  course_id?: string;
  commission_type: string;
  commission_value: number;
  min_sale_amount: number;
  bonus_threshold?: number;
  bonus_amount: number;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface CommissionPayout {
  id: string;
  franchise_id: string;
  payout_period_start: string;
  payout_period_end: string;
  total_sales: number;
  total_commission: number;
  deductions: number;
  net_payout: number;
  currency: string;
  status: PayoutStatus;
  payment_method?: string;
  payment_reference?: string;
  paid_at?: string;
  processed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const FRANCHISE_TYPE_LABELS: Record<FranchiseType, string> = {
  franchise: 'Franchise',
  affiliate: 'Affiliate',
  reseller: 'Reseller',
  super_distributor: 'Super Distributor',
  distributor: 'Distributor',
};

export const FRANCHISE_STATUS_LABELS: Record<FranchiseStatus, string> = {
  pending: 'Pending Approval',
  approved: 'Approved',
  suspended: 'Suspended',
  rejected: 'Rejected',
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  converted: 'Converted',
  lost: 'Lost',
};
