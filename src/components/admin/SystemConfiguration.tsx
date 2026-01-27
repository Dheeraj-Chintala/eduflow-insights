import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Save, Settings, CreditCard, Bell, Shield, BookOpen, Palette } from 'lucide-react';
import type { SystemConfiguration as SystemConfigType } from '@/types/admin';

const defaultConfigs: Record<string, Record<string, { value: string; type: string; description: string }>> = {
  general: {
    platform_name: { value: 'Learning Platform', type: 'string', description: 'Platform display name' },
    support_email: { value: 'support@example.com', type: 'string', description: 'Support contact email' },
    max_file_upload_mb: { value: '50', type: 'number', description: 'Maximum file upload size in MB' },
    maintenance_mode: { value: 'false', type: 'boolean', description: 'Enable maintenance mode' }
  },
  payments: {
    currency: { value: 'INR', type: 'string', description: 'Default currency' },
    tax_rate: { value: '18', type: 'number', description: 'Tax rate percentage' },
    enable_emi: { value: 'true', type: 'boolean', description: 'Enable EMI payments' },
    min_emi_amount: { value: '5000', type: 'number', description: 'Minimum amount for EMI' }
  },
  notifications: {
    enable_email_notifications: { value: 'true', type: 'boolean', description: 'Enable email notifications' },
    enable_sms_notifications: { value: 'false', type: 'boolean', description: 'Enable SMS notifications' },
    digest_frequency: { value: 'daily', type: 'string', description: 'Email digest frequency' }
  },
  security: {
    session_timeout_hours: { value: '24', type: 'number', description: 'Session timeout in hours' },
    max_login_attempts: { value: '5', type: 'number', description: 'Max failed login attempts' },
    require_email_verification: { value: 'true', type: 'boolean', description: 'Require email verification' }
  },
  content: {
    auto_approve_courses: { value: 'false', type: 'boolean', description: 'Auto-approve new courses' },
    max_video_duration_mins: { value: '120', type: 'number', description: 'Max video duration in minutes' },
    enable_discussions: { value: 'true', type: 'boolean', description: 'Enable course discussions' }
  },
  branding: {
    primary_color: { value: '#3B82F6', type: 'string', description: 'Primary brand color' },
    logo_url: { value: '', type: 'string', description: 'Logo URL' },
    favicon_url: { value: '', type: 'string', description: 'Favicon URL' }
  }
};

export default function SystemConfiguration() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('system_configuration')
        .select('*');

      if (error) throw error;

      // Merge fetched configs with defaults
      const configMap: Record<string, Record<string, string>> = {};
      Object.keys(defaultConfigs).forEach(category => {
        configMap[category] = {};
        Object.entries(defaultConfigs[category]).forEach(([key, def]) => {
          const existing = (data || []).find(
            (c: any) => c.config_key === key && c.category === category
          );
          configMap[category][key] = existing?.config_value || def.value;
        });
      });

      setConfigs(configMap);
    } catch (error) {
      console.error('Error fetching configurations:', error);
      toast.error('Failed to load configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCategory = async (category: string) => {
    try {
      setIsSaving(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user?.id)
        .single();

      const updates = Object.entries(configs[category]).map(([key, value]) => ({
        org_id: profile?.org_id,
        config_key: key,
        config_value: value,
        value_type: defaultConfigs[category][key].type as any,
        category,
        description: defaultConfigs[category][key].description,
        updated_by: user?.id
      }));

      // Upsert each config
      for (const config of updates) {
        const { error } = await supabase
          .from('system_configuration')
          .upsert(config, { onConflict: 'org_id,config_key' });
        
        if (error) throw error;
      }

      await supabase.from('admin_activity_logs').insert({
        admin_id: user?.id,
        action_type: 'update_config',
        target_type: 'system_configuration',
        new_value: { category, configs: configs[category] }
      });

      toast.success(`${category} settings saved`);
    } catch (error) {
      console.error('Error saving configurations:', error);
      toast.error('Failed to save configurations');
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (category: string, key: string, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const renderConfigField = (category: string, key: string, config: { value: string; type: string; description: string }) => {
    const currentValue = configs[category]?.[key] || config.value;

    switch (config.type) {
      case 'boolean':
        return (
          <div key={key} className="flex items-center justify-between py-3 border-b last:border-0">
            <div>
              <Label>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
            <Switch
              checked={currentValue === 'true'}
              onCheckedChange={(checked) => updateConfig(category, key, checked.toString())}
            />
          </div>
        );
      case 'number':
        return (
          <div key={key} className="py-3 border-b last:border-0">
            <Label>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
            <p className="text-xs text-muted-foreground mb-2">{config.description}</p>
            <Input
              type="number"
              value={currentValue}
              onChange={(e) => updateConfig(category, key, e.target.value)}
              className="max-w-xs"
            />
          </div>
        );
      default:
        return (
          <div key={key} className="py-3 border-b last:border-0">
            <Label>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
            <p className="text-xs text-muted-foreground mb-2">{config.description}</p>
            <Input
              value={currentValue}
              onChange={(e) => updateConfig(category, key, e.target.value)}
              className="max-w-md"
            />
          </div>
        );
    }
  };

  const tabIcons: Record<string, any> = {
    general: Settings,
    payments: CreditCard,
    notifications: Bell,
    security: Shield,
    content: BookOpen,
    branding: Palette
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">System Configuration</h2>
        <p className="text-muted-foreground">Manage global platform settings and rules</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap">
          {Object.keys(defaultConfigs).map(category => {
            const Icon = tabIcons[category];
            return (
              <TabsTrigger key={category} value={category} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(defaultConfigs).map(([category, categoryConfigs]) => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = tabIcons[category];
                    return <Icon className="h-5 w-5" />;
                  })()}
                  {category.charAt(0).toUpperCase() + category.slice(1)} Settings
                </CardTitle>
                <CardDescription>
                  Configure {category} related settings for the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {Object.entries(categoryConfigs).map(([key, config]) =>
                    renderConfigField(category, key, config)
                  )}
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => handleSaveCategory(category)} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
