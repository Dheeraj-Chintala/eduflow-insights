-- Fix overly permissive RLS policies for notifications and certificates
-- These tables need system-level inserts, so we use service role for that
-- But for regular users, they can't insert directly

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert certificates" ON public.certificates;

-- Create more restrictive policies that still allow authenticated users to receive notifications
-- Notifications will be inserted via edge functions using service role
-- For now, allow admins to insert notifications
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (has_permission(auth.uid(), 'users.view'));

-- Certificates will be inserted via edge functions using service role
-- Allow trainers/admins to issue certificates
CREATE POLICY "Authorized users can insert certificates"
  ON public.certificates FOR INSERT
  WITH CHECK (has_permission(auth.uid(), 'certificates.issue'));