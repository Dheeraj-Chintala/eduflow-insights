import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageSquare, Smartphone, Moon, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (preferences) {
        const { error } = await supabase
          .from('notification_preferences')
          .update(updates)
          .eq('id', preferences.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_preferences')
          .insert({ user_id: user?.id, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Preferences updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update preferences');
    },
  });

  const handleToggle = (field: string, value: boolean) => {
    updateMutation.mutate({ [field]: value });
  };

  const handleCategoryToggle = (category: string, value: boolean) => {
    const currentPrefs = (preferences?.category_preferences as Record<string, boolean>) || {};
    updateMutation.mutate({
      category_preferences: { ...currentPrefs, [category]: value },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const categoryPrefs = preferences?.category_preferences || {
    course_updates: true,
    assignment_reminders: true,
    payment_alerts: true,
    class_reminders: true,
    marketing: false,
    announcements: true,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how and when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Channel Preferences */}
        <div>
          <h4 className="font-medium mb-4">Notification Channels</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.email_enabled ?? true}
                onCheckedChange={(checked) => handleToggle('email_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get text messages for urgent updates
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.sms_enabled ?? true}
                onCheckedChange={(checked) => handleToggle('sms_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>WhatsApp Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive messages on WhatsApp
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.whatsapp_enabled ?? false}
                onCheckedChange={(checked) => handleToggle('whatsapp_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>In-App Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    See notifications inside the platform
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.in_app_enabled ?? true}
                onCheckedChange={(checked) => handleToggle('in_app_enabled', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Category Preferences */}
        <div>
          <h4 className="font-medium mb-4">Notification Categories</h4>
          <div className="space-y-4">
            {[
              { key: 'course_updates', label: 'Course Updates', desc: 'New content, announcements' },
              { key: 'assignment_reminders', label: 'Assignment Reminders', desc: 'Due dates, submissions' },
              { key: 'payment_alerts', label: 'Payment Alerts', desc: 'Invoices, receipts, due payments' },
              { key: 'class_reminders', label: 'Class Reminders', desc: 'Upcoming live classes' },
              { key: 'announcements', label: 'Announcements', desc: 'Platform announcements' },
              { key: 'marketing', label: 'Marketing & Promotions', desc: 'Offers, new courses' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <Label>{item.label}</Label>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={categoryPrefs[item.key] ?? true}
                  onCheckedChange={(checked) => handleCategoryToggle(item.key, checked)}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Quiet Hours */}
        <div>
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Quiet Hours
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Quiet Hours</Label>
                <p className="text-sm text-muted-foreground">
                  Pause notifications during specific hours
                </p>
              </div>
              <Switch
                checked={preferences?.quiet_hours_enabled ?? false}
                onCheckedChange={(checked) => handleToggle('quiet_hours_enabled', checked)}
              />
            </div>

            {preferences?.quiet_hours_enabled && (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-sm">From</Label>
                  <Input
                    type="time"
                    value={preferences?.quiet_hours_start || '22:00'}
                    onChange={(e) =>
                      updateMutation.mutate({ quiet_hours_start: e.target.value })
                    }
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-sm">To</Label>
                  <Input
                    type="time"
                    value={preferences?.quiet_hours_end || '08:00'}
                    onChange={(e) =>
                      updateMutation.mutate({ quiet_hours_end: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Email Digest */}
        <div>
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Email Digest
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Receive Email Digest</Label>
                <p className="text-sm text-muted-foreground">
                  Get a summary instead of individual emails
                </p>
              </div>
              <Switch
                checked={preferences?.email_digest_enabled ?? false}
                onCheckedChange={(checked) => handleToggle('email_digest_enabled', checked)}
              />
            </div>

            {preferences?.email_digest_enabled && (
              <div>
                <Label className="text-sm">Frequency</Label>
                <Select
                  value={preferences?.email_digest_frequency || 'daily'}
                  onValueChange={(value) =>
                    updateMutation.mutate({ email_digest_frequency: value })
                  }
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
