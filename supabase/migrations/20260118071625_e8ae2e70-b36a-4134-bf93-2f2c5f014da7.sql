
-- Payment Status Enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded');

-- Subscription Status Enum
CREATE TYPE public.subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired', 'past_due');

-- EMI Status Enum
CREATE TYPE public.emi_status AS ENUM ('pending', 'paid', 'overdue', 'defaulted');

-- Refund Status Enum
CREATE TYPE public.refund_status AS ENUM ('requested', 'processing', 'approved', 'rejected', 'completed');

-- Wallet Transaction Type Enum
CREATE TYPE public.wallet_transaction_type AS ENUM ('credit', 'debit', 'refund', 'reward', 'referral', 'purchase');

-- Invoice Status Enum
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'cancelled', 'overdue');

-- =====================
-- Payment Gateways Table
-- =====================
CREATE TABLE public.payment_gateways (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  gateway_name TEXT NOT NULL,
  gateway_type TEXT NOT NULL, -- razorpay, stripe, paypal, paytm, etc.
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  supported_currencies TEXT[] DEFAULT ARRAY['INR'],
  transaction_fee_percent NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- Payment Transactions Table
-- =====================
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  gateway_id UUID REFERENCES public.payment_gateways(id),
  
  -- Payment details
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status public.payment_status DEFAULT 'pending',
  payment_method TEXT, -- card, upi, netbanking, wallet, emi
  
  -- External references
  gateway_transaction_id TEXT,
  gateway_order_id TEXT,
  gateway_response JSONB,
  
  -- What was purchased
  purchase_type TEXT NOT NULL, -- course, bundle, subscription, emi_installment
  course_id UUID REFERENCES public.courses(id),
  bundle_id UUID REFERENCES public.course_bundles(id),
  subscription_id UUID,
  
  -- Discounts applied
  coupon_id UUID REFERENCES public.coupons(id),
  referral_code TEXT,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  
  -- Tax details
  subtotal NUMERIC(12,2),
  tax_amount NUMERIC(12,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 18, -- GST rate
  
  -- Franchise/affiliate commission
  franchise_id UUID REFERENCES public.franchises(id),
  commission_amount NUMERIC(12,2) DEFAULT 0,
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  notes TEXT,
  
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- Subscription Plans Table
-- =====================
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pricing
  price NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  billing_interval TEXT NOT NULL, -- monthly, quarterly, yearly
  billing_interval_count INTEGER DEFAULT 1,
  
  -- Trial
  trial_days INTEGER DEFAULT 0,
  
  -- Features
  features JSONB DEFAULT '[]',
  max_courses INTEGER, -- null means unlimited
  includes_all_courses BOOLEAN DEFAULT false,
  included_course_ids UUID[] DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- User Subscriptions Table
-- =====================
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  status public.subscription_status DEFAULT 'active',
  
  -- Dates
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- External references
  gateway_subscription_id TEXT,
  gateway_customer_id TEXT,
  
  -- Payment
  last_payment_id UUID REFERENCES public.payment_transactions(id),
  next_billing_date TIMESTAMP WITH TIME ZONE,
  
  auto_renew BOOLEAN DEFAULT true,
  cancellation_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- EMI Plans Table
-- =====================
CREATE TABLE public.emi_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- EMI config
  min_amount NUMERIC(12,2) NOT NULL DEFAULT 5000,
  max_amount NUMERIC(12,2),
  tenure_months INTEGER NOT NULL, -- 3, 6, 9, 12, etc.
  interest_rate NUMERIC(5,2) DEFAULT 0, -- 0 for no-cost EMI
  processing_fee NUMERIC(12,2) DEFAULT 0,
  
  -- Eligibility
  applicable_courses UUID[] DEFAULT '{}',
  applicable_bundles UUID[] DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- User EMI Table
-- =====================
CREATE TABLE public.user_emi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  emi_plan_id UUID NOT NULL REFERENCES public.emi_plans(id),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Purchase details
  course_id UUID REFERENCES public.courses(id),
  bundle_id UUID REFERENCES public.course_bundles(id),
  
  -- EMI details
  total_amount NUMERIC(12,2) NOT NULL,
  emi_amount NUMERIC(12,2) NOT NULL, -- per installment
  total_installments INTEGER NOT NULL,
  paid_installments INTEGER DEFAULT 0,
  remaining_amount NUMERIC(12,2) NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'active', -- active, completed, defaulted
  next_due_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- EMI Installments Table
-- =====================
CREATE TABLE public.emi_installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_emi_id UUID NOT NULL REFERENCES public.user_emi(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  
  amount NUMERIC(12,2) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  status public.emi_status DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_id UUID REFERENCES public.payment_transactions(id),
  
  late_fee NUMERIC(12,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- User Wallet Table
-- =====================
CREATE TABLE public.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  balance NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- Wallet Transactions Table
-- =====================
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.user_wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  transaction_type public.wallet_transaction_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  
  description TEXT,
  reference_id TEXT, -- payment_id, refund_id, etc.
  reference_type TEXT, -- payment, refund, reward, etc.
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- Invoices Table
-- =====================
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payment_transactions(id),
  
  -- Billing details
  billing_name TEXT,
  billing_email TEXT,
  billing_phone TEXT,
  billing_address TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_country TEXT DEFAULT 'India',
  billing_pincode TEXT,
  billing_gstin TEXT,
  
  -- Invoice details
  subtotal NUMERIC(12,2) NOT NULL,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  taxable_amount NUMERIC(12,2) NOT NULL,
  
  -- GST breakdown
  cgst_rate NUMERIC(5,2) DEFAULT 9,
  cgst_amount NUMERIC(12,2) DEFAULT 0,
  sgst_rate NUMERIC(5,2) DEFAULT 9,
  sgst_amount NUMERIC(12,2) DEFAULT 0,
  igst_rate NUMERIC(5,2) DEFAULT 18,
  igst_amount NUMERIC(12,2) DEFAULT 0,
  
  total_tax NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL,
  
  -- Line items
  line_items JSONB DEFAULT '[]',
  
  status public.invoice_status DEFAULT 'draft',
  issued_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  pdf_url TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- Refunds Table
-- =====================
CREATE TABLE public.refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES public.payment_transactions(id),
  user_id UUID NOT NULL,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  amount NUMERIC(12,2) NOT NULL,
  reason TEXT NOT NULL,
  
  status public.refund_status DEFAULT 'requested',
  
  -- Processing details
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  rejection_reason TEXT,
  
  -- Refund method
  refund_method TEXT, -- original_payment, wallet, bank_transfer
  gateway_refund_id TEXT,
  
  -- If refunded to wallet
  wallet_transaction_id UUID REFERENCES public.wallet_transactions(id),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- Enable RLS
-- =====================
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emi_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_emi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emi_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- =====================
-- RLS Policies
-- =====================

-- Payment Gateways (admin only)
CREATE POLICY "Admins can manage payment gateways" ON public.payment_gateways
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- Payment Transactions
CREATE POLICY "Users can view own payments" ON public.payment_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all payments" ON public.payment_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin', 'sub_admin')
    )
  );

CREATE POLICY "Users can create payments" ON public.payment_transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can update payments" ON public.payment_transactions
  FOR UPDATE USING (true);

-- Subscription Plans (public read, admin write)
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.subscription_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- User Subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin', 'sub_admin')
    )
  );

CREATE POLICY "Users can manage own subscriptions" ON public.user_subscriptions
  FOR ALL USING (user_id = auth.uid());

-- EMI Plans (public read)
CREATE POLICY "Anyone can view active EMI plans" ON public.emi_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage EMI plans" ON public.emi_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- User EMI
CREATE POLICY "Users can view own EMI" ON public.user_emi
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all EMI" ON public.user_emi
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin', 'sub_admin')
    )
  );

-- EMI Installments
CREATE POLICY "Users can view own installments" ON public.emi_installments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_emi ue
      WHERE ue.id = user_emi_id AND ue.user_id = auth.uid()
    )
  );

-- User Wallets
CREATE POLICY "Users can view own wallet" ON public.user_wallets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own wallet" ON public.user_wallets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all wallets" ON public.user_wallets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- Wallet Transactions
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
  FOR SELECT USING (user_id = auth.uid());

-- Invoices
CREATE POLICY "Users can view own invoices" ON public.invoices
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage invoices" ON public.invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin', 'sub_admin')
    )
  );

-- Refunds
CREATE POLICY "Users can view own refunds" ON public.refunds
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can request refunds" ON public.refunds
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage refunds" ON public.refunds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin', 'sub_admin')
    )
  );

-- =====================
-- Indexes
-- =====================
CREATE INDEX idx_payment_transactions_user ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_payment_transactions_created ON public.payment_transactions(created_at DESC);
CREATE INDEX idx_user_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_user_emi_user ON public.user_emi(user_id);
CREATE INDEX idx_wallet_transactions_wallet ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_invoices_user ON public.invoices(user_id);
CREATE INDEX idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX idx_refunds_payment ON public.refunds(payment_id);

-- =====================
-- Update Triggers
-- =====================
CREATE TRIGGER update_payment_gateways_updated_at
  BEFORE UPDATE ON public.payment_gateways
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emi_plans_updated_at
  BEFORE UPDATE ON public.emi_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_emi_updated_at
  BEFORE UPDATE ON public.user_emi
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emi_installments_updated_at
  BEFORE UPDATE ON public.emi_installments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_wallets_updated_at
  BEFORE UPDATE ON public.user_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- Invoice Number Sequence
-- =====================
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;
