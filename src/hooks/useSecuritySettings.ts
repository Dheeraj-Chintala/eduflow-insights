import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { SecuritySettings } from '@/types/security';

const DEFAULT_SETTINGS: Partial<SecuritySettings> = {
  max_devices_per_user: 3,
  max_concurrent_sessions: 2,
  session_timeout_minutes: 1440,
  enable_2fa: false,
  require_2fa_for_roles: [],
  enable_ip_restriction: false,
  enable_device_restriction: true,
  enable_watermark: true,
  watermark_text_template: '{{user_email}} - {{timestamp}}',
  enable_screen_capture_prevention: true,
  enable_right_click_prevention: true,
  video_protection_level: 'standard',
  download_restriction_roles: [],
};

export function useSecuritySettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('security_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setSettings(data as unknown as SecuritySettings);
      } else {
        // Return default settings if none exist
        setSettings(DEFAULT_SETTINGS as SecuritySettings);
      }
    } catch (err) {
      console.error('Error fetching security settings:', err);
      setError('Failed to load security settings');
      setSettings(DEFAULT_SETTINGS as SecuritySettings);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates: Partial<SecuritySettings>) => {
    if (!settings?.id) {
      // Create new settings
      const { data, error } = await supabase
        .from('security_settings')
        .insert([{ ...DEFAULT_SETTINGS, ...updates }])
        .select()
        .single();

      if (error) throw error;
      setSettings(data as unknown as SecuritySettings);
      return data;
    }

    // Update existing settings
    const { data, error } = await supabase
      .from('security_settings')
      .update(updates)
      .eq('id', settings.id)
      .select()
      .single();

    if (error) throw error;
    setSettings(data as unknown as SecuritySettings);
    return data;
  };

  return {
    settings,
    isLoading,
    error,
    refetch: fetchSettings,
    updateSettings,
  };
}
