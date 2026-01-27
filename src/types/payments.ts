export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired' | 'past_due';
export type EMIStatus = 'pending' | 'paid' | 'overdue' | 'defaulted';
export type RefundStatus = 'requested' | 'processing' | 'approved' | 'rejected' | 'completed';
export type WalletTransactionType = 'credit' | 'debit' | 'refund' | 'reward' | 'referral' | 'purchase';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue';

export interface PaymentGateway {
  id: string;
  org_id: string;
  gateway_name: string;
  gateway_type: string;
  is_active: boolean;
  is_default: boolean;
  supported_currencies: string[];
  transaction_fee_percent: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  org_id: string;
  gateway_id?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method?: string;
  gateway_transaction_id?: string;
  gateway_order_id?: string;
  purchase_type: string;
  course_id?: string;
  bundle_id?: string;
  subscription_id?: string;
  coupon_id?: string;
  referral_code?: string;
  discount_amount: number;
  subtotal?: number;
  tax_amount: number;
  tax_rate: number;
  franchise_id?: string;
  commission_amount: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billing_interval: string;
  billing_interval_count: number;
  trial_days: number;
  features: any[];
  max_courses?: number;
  includes_all_courses: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  org_id: string;
  status: SubscriptionStatus;
  started_at: string;
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  cancelled_at?: string;
  ended_at?: string;
  auto_renew: boolean;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

export interface EMIPlan {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  min_amount: number;
  max_amount?: number;
  tenure_months: number;
  interest_rate: number;
  processing_fee: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserEMI {
  id: string;
  user_id: string;
  emi_plan_id: string;
  org_id: string;
  course_id?: string;
  bundle_id?: string;
  total_amount: number;
  emi_amount: number;
  total_installments: number;
  paid_installments: number;
  remaining_amount: number;
  status: string;
  next_due_date?: string;
  created_at: string;
  updated_at: string;
  emi_plan?: EMIPlan;
}

export interface EMIInstallment {
  id: string;
  user_emi_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: EMIStatus;
  paid_at?: string;
  payment_id?: string;
  late_fee: number;
  created_at: string;
  updated_at: string;
}

export interface UserWallet {
  id: string;
  user_id: string;
  org_id: string;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  transaction_type: WalletTransactionType;
  amount: number;
  balance_after: number;
  description?: string;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  user_id: string;
  org_id: string;
  payment_id?: string;
  billing_name?: string;
  billing_email?: string;
  billing_phone?: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_country: string;
  billing_pincode?: string;
  billing_gstin?: string;
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total_tax: number;
  total_amount: number;
  line_items: any[];
  status: InvoiceStatus;
  issued_at?: string;
  due_date?: string;
  paid_at?: string;
  pdf_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Refund {
  id: string;
  payment_id: string;
  user_id: string;
  org_id: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  processed_by?: string;
  processed_at?: string;
  admin_notes?: string;
  rejection_reason?: string;
  refund_method?: string;
  gateway_refund_id?: string;
  wallet_transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-purple-100 text-purple-800',
  partially_refunded: 'bg-orange-100 text-orange-800',
};

export const SUBSCRIPTION_STATUS_COLORS: Record<SubscriptionStatus, string> = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
  past_due: 'bg-orange-100 text-orange-800',
};

export const REFUND_STATUS_COLORS: Record<RefundStatus, string> = {
  requested: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-purple-100 text-purple-800',
};
