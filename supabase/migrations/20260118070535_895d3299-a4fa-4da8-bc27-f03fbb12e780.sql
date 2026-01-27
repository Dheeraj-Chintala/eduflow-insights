-- Create enums for franchise module
CREATE TYPE public.franchise_type AS ENUM ('franchise', 'affiliate', 'reseller', 'super_distributor', 'distributor');
CREATE TYPE public.franchise_status AS ENUM ('pending', 'approved', 'suspended', 'rejected');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'lost');
CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create franchises table (main entity for franchise/affiliate/reseller)
CREATE TABLE public.franchises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  parent_franchise_id UUID REFERENCES public.franchises(id),
  franchise_type public.franchise_type NOT NULL DEFAULT 'affiliate',
  franchise_code TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  pincode TEXT,
  gst_number TEXT,
  pan_number TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  status public.franchise_status DEFAULT 'pending',
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  suspended_at TIMESTAMP WITH TIME ZONE,
  suspension_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create franchise_branding table (white-label settings)
CREATE TABLE public.franchise_branding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#1E40AF',
  accent_color TEXT DEFAULT '#F59E0B',
  custom_domain TEXT,
  tagline TEXT,
  support_email TEXT,
  support_phone TEXT,
  footer_text TEXT,
  social_facebook TEXT,
  social_twitter TEXT,
  social_linkedin TEXT,
  social_instagram TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create franchise_students table (student-to-franchise mapping)
CREATE TABLE public.franchise_students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL,
  referred_by_code TEXT,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create franchise_leads table
CREATE TABLE public.franchise_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  course_interest TEXT,
  source TEXT,
  status public.lead_status DEFAULT 'new',
  notes TEXT,
  converted_user_id UUID,
  converted_at TIMESTAMP WITH TIME ZONE,
  follow_up_date DATE,
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create franchise_sales table
CREATE TABLE public.franchise_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL,
  enrollment_id UUID REFERENCES public.enrollments(id),
  course_id UUID REFERENCES public.courses(id),
  sale_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  commission_rate NUMERIC DEFAULT 0,
  commission_amount NUMERIC DEFAULT 0,
  referral_code TEXT,
  coupon_code TEXT,
  sale_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payment_status TEXT DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referral_codes table
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT DEFAULT 'percentage',
  discount_value NUMERIC DEFAULT 0,
  commission_bonus NUMERIC DEFAULT 0,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE SET NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL,
  min_purchase_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  applicable_courses UUID[],
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create commission_rules table
CREATE TABLE public.commission_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  franchise_type public.franchise_type,
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  commission_type TEXT DEFAULT 'percentage',
  commission_value NUMERIC NOT NULL DEFAULT 0,
  min_sale_amount NUMERIC DEFAULT 0,
  bonus_threshold INTEGER,
  bonus_amount NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create commission_payouts table
CREATE TABLE public.commission_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  payout_period_start DATE NOT NULL,
  payout_period_end DATE NOT NULL,
  total_sales NUMERIC DEFAULT 0,
  total_commission NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  net_payout NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  status public.payout_status DEFAULT 'pending',
  payment_method TEXT,
  payment_reference TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchise_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchise_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchise_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchise_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_payouts ENABLE ROW LEVEL SECURITY;

-- Franchises policies
CREATE POLICY "Users can view their own franchise"
ON public.franchises FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own franchise"
ON public.franchises FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own franchise"
ON public.franchises FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all franchises"
ON public.franchises FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin', 'sub_admin')
  )
);

-- Franchise branding policies
CREATE POLICY "Franchise owners can view their branding"
ON public.franchise_branding FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.franchises f
    WHERE f.id = franchise_id AND f.user_id = auth.uid()
  )
);

CREATE POLICY "Franchise owners can manage their branding"
ON public.franchise_branding FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.franchises f
    WHERE f.id = franchise_id AND f.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all branding"
ON public.franchise_branding FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin')
  )
);

-- Franchise students policies
CREATE POLICY "Franchise owners can view their students"
ON public.franchise_students FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.franchises f
    WHERE f.id = franchise_id AND f.user_id = auth.uid()
  )
);

CREATE POLICY "Franchise owners can manage their students"
ON public.franchise_students FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.franchises f
    WHERE f.id = franchise_id AND f.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all franchise students"
ON public.franchise_students FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin', 'sub_admin')
  )
);

-- Franchise leads policies
CREATE POLICY "Franchise owners can view their leads"
ON public.franchise_leads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.franchises f
    WHERE f.id = franchise_id AND f.user_id = auth.uid()
  )
);

CREATE POLICY "Franchise owners can manage their leads"
ON public.franchise_leads FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.franchises f
    WHERE f.id = franchise_id AND f.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all leads"
ON public.franchise_leads FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin', 'sub_admin')
  )
);

-- Franchise sales policies
CREATE POLICY "Franchise owners can view their sales"
ON public.franchise_sales FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.franchises f
    WHERE f.id = franchise_id AND f.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all sales"
ON public.franchise_sales FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin', 'sub_admin')
  )
);

-- Referral codes policies
CREATE POLICY "Franchise owners can view their referral codes"
ON public.referral_codes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.franchises f
    WHERE f.id = franchise_id AND f.user_id = auth.uid()
  )
);

CREATE POLICY "Franchise owners can manage their referral codes"
ON public.referral_codes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.franchises f
    WHERE f.id = franchise_id AND f.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all referral codes"
ON public.referral_codes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin')
  )
);

-- Coupons policies
CREATE POLICY "Anyone can view active coupons"
ON public.coupons FOR SELECT
USING (is_active = true);

CREATE POLICY "Franchise owners can view their coupons"
ON public.coupons FOR SELECT
USING (
  franchise_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.franchises f
    WHERE f.id = franchise_id AND f.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all coupons"
ON public.coupons FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin')
  )
);

-- Commission rules policies
CREATE POLICY "Franchise owners can view their commission rules"
ON public.commission_rules FOR SELECT
USING (
  franchise_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.franchises f
    WHERE f.id = franchise_id AND f.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage commission rules"
ON public.commission_rules FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin')
  )
);

-- Commission payouts policies
CREATE POLICY "Franchise owners can view their payouts"
ON public.commission_payouts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.franchises f
    WHERE f.id = franchise_id AND f.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all payouts"
ON public.commission_payouts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin')
  )
);

-- Create indexes
CREATE INDEX idx_franchises_user ON public.franchises(user_id);
CREATE INDEX idx_franchises_org ON public.franchises(org_id);
CREATE INDEX idx_franchises_status ON public.franchises(status);
CREATE INDEX idx_franchises_code ON public.franchises(franchise_code);
CREATE INDEX idx_franchise_students_franchise ON public.franchise_students(franchise_id);
CREATE INDEX idx_franchise_leads_franchise ON public.franchise_leads(franchise_id);
CREATE INDEX idx_franchise_leads_status ON public.franchise_leads(status);
CREATE INDEX idx_franchise_sales_franchise ON public.franchise_sales(franchise_id);
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_commission_payouts_franchise ON public.commission_payouts(franchise_id);

-- Create update triggers
CREATE TRIGGER update_franchises_updated_at
BEFORE UPDATE ON public.franchises
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_franchise_branding_updated_at
BEFORE UPDATE ON public.franchise_branding
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_franchise_leads_updated_at
BEFORE UPDATE ON public.franchise_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referral_codes_updated_at
BEFORE UPDATE ON public.referral_codes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commission_rules_updated_at
BEFORE UPDATE ON public.commission_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commission_payouts_updated_at
BEFORE UPDATE ON public.commission_payouts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();