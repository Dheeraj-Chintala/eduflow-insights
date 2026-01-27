import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, Bot, Target, Mic, FileText, Trophy, 
  Medal, Building2, Smartphone, Settings 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface FeatureSetting {
  feature_name: string;
  is_enabled: boolean;
  settings: Record<string, unknown>;
}

const FEATURES = [
  { 
    id: 'ai_recommendations', 
    name: 'AI Course Recommendations', 
    description: 'Personalized course suggestions based on learning history',
    icon: Sparkles,
    category: 'AI Features'
  },
  { 
    id: 'ai_chatbot', 
    name: 'AI Doubt Clearing Chatbot', 
    description: 'Instant AI-powered help for student questions',
    icon: Bot,
    category: 'AI Features'
  },
  { 
    id: 'skill_gap_analysis', 
    name: 'Skill Gap Analysis', 
    description: 'Analyze skills and recommend learning paths',
    icon: Target,
    category: 'AI Features'
  },
  { 
    id: 'mock_interviews', 
    name: 'Mock Interview Practice', 
    description: 'AI-powered interview preparation with feedback',
    icon: Mic,
    category: 'AI Features'
  },
  { 
    id: 'ats_scoring', 
    name: 'Resume ATS Scoring', 
    description: 'Analyze resume compatibility with job requirements',
    icon: FileText,
    category: 'AI Features'
  },
  { 
    id: 'gamification', 
    name: 'Gamification & Points', 
    description: 'Earn points and badges for learning activities',
    icon: Trophy,
    category: 'Engagement'
  },
  { 
    id: 'leaderboards', 
    name: 'Leaderboards', 
    description: 'Compete with other learners on rankings',
    icon: Medal,
    category: 'Engagement'
  },
  { 
    id: 'corporate_training', 
    name: 'Corporate Training Mode', 
    description: 'Manage training programs for organizations',
    icon: Building2,
    category: 'Corporate'
  },
  { 
    id: 'white_label', 
    name: 'White-Label Branding', 
    description: 'Custom branding for mobile apps',
    icon: Smartphone,
    category: 'Advanced'
  },
];

export const FeatureTogglePanel: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Map<string, boolean>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      // Get user's org
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('org_id')
        .eq('user_id', user?.id)
        .single();

      if (userRole?.org_id) {
        setOrgId(userRole.org_id);

        // Fetch feature settings
        const { data } = await supabase
          .from('org_feature_settings')
          .select('feature_name, is_enabled')
          .eq('org_id', userRole.org_id);

        const settingsMap = new Map<string, boolean>();
        // Default all features to enabled
        FEATURES.forEach(f => settingsMap.set(f.id, true));
        // Override with saved settings
        data?.forEach(s => settingsMap.set(s.feature_name, s.is_enabled));
        
        setSettings(settingsMap);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFeature = async (featureId: string, enabled: boolean) => {
    if (!orgId) return;

    setIsSaving(featureId);
    try {
      const { error } = await supabase
        .from('org_feature_settings')
        .upsert({
          org_id: orgId,
          feature_name: featureId,
          is_enabled: enabled
        }, { onConflict: 'org_id,feature_name' });

      if (error) throw error;

      setSettings(prev => new Map(prev).set(featureId, enabled));
      toast.success(`${enabled ? 'Enabled' : 'Disabled'} successfully`);
    } catch (error) {
      console.error('Failed to update setting:', error);
      toast.error('Failed to update setting');
    } finally {
      setIsSaving(null);
    }
  };

  const categories = [...new Set(FEATURES.map(f => f.category))];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Advanced Features
        </CardTitle>
        <CardDescription>
          Enable or disable advanced features for your organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map(category => (
          <div key={category}>
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
              {category}
            </h4>
            <div className="space-y-3">
              {FEATURES.filter(f => f.category === category).map(feature => {
                const Icon = feature.icon;
                const isEnabled = settings.get(feature.id) ?? true;
                
                return (
                  <div
                    key={feature.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{feature.name}</span>
                          {isEnabled && <Badge variant="secondary" className="text-xs">Active</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => toggleFeature(feature.id, checked)}
                      disabled={isSaving === feature.id}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
