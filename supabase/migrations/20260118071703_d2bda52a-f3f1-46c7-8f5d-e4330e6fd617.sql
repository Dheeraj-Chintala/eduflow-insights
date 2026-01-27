
-- Fix overly permissive RLS policy for payment_transactions UPDATE
DROP POLICY IF EXISTS "System can update payments" ON public.payment_transactions;

CREATE POLICY "Admins can update payments" ON public.payment_transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin', 'sub_admin')
    )
  );

-- Fix generate_invoice_number function search path
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT 
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(nextval('public.invoice_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;
