
-- Fix overly permissive INSERT policies by restricting to admin users
DROP POLICY IF EXISTS "System can create notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "System can create message logs" ON public.message_logs;

-- User notifications can be created by admins or system (service role)
CREATE POLICY "Admins can create notifications" ON public.user_notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin', 'sub_admin', 'trainer', 'mentor')
    )
  );

-- Message logs can be created by admins
CREATE POLICY "Admins can create message logs" ON public.message_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );
