import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Cookie, Shield, BarChart2, Megaphone, Settings } from 'lucide-react';

interface CookiePrefs {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export default function CookieConsentBanner() {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePrefs>({
    essential: true,
    analytics: false,
    marketing: false,
    functional: false
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkExistingPreferences();
  }, [user]);

  const checkExistingPreferences = async () => {
    // Check localStorage first
    const stored = localStorage.getItem('cookie_consent');
    if (stored) {
      setPreferences(JSON.parse(stored));
      return;
    }

    // Check database if user is logged in
    if (user) {
      const { data } = await supabase
        .from('cookie_preferences')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (data) {
        const prefs = {
          essential: true,
          analytics: data.analytics,
          marketing: data.marketing,
          functional: data.functional
        };
        setPreferences(prefs);
        localStorage.setItem('cookie_consent', JSON.stringify(prefs));
        return;
      }
    }

    // Show banner if no preferences found
    setShowBanner(true);
  };

  const savePreferences = async (prefs: CookiePrefs) => {
    try {
      setIsSaving(true);
      
      // Save to localStorage
      localStorage.setItem('cookie_consent', JSON.stringify(prefs));
      
      // Save to database if logged in
      if (user) {
        await supabase
          .from('cookie_preferences')
          .upsert([{
            user_id: user.id,
            essential: true,
            analytics: prefs.analytics,
            marketing: prefs.marketing,
            functional: prefs.functional
          }] as any);
      }

      setPreferences(prefs);
      setShowBanner(false);
      setShowSettings(false);
      toast.success('Cookie preferences saved');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const acceptAll = () => {
    savePreferences({
      essential: true,
      analytics: true,
      marketing: true,
      functional: true
    });
  };

  const acceptEssential = () => {
    savePreferences({
      essential: true,
      analytics: false,
      marketing: false,
      functional: false
    });
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur border-t shadow-lg">
      <div className="max-w-6xl mx-auto">
        {!showSettings ? (
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">We use cookies</h3>
                <p className="text-sm text-muted-foreground">
                  We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
                  You can choose your preferences or accept all cookies.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Customize
              </Button>
              <Button variant="outline" size="sm" onClick={acceptEssential}>
                Essential Only
              </Button>
              <Button size="sm" onClick={acceptAll}>
                Accept All
              </Button>
            </div>
          </div>
        ) : (
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5" />
                Cookie Preferences
              </CardTitle>
              <CardDescription>
                Choose which cookies you want to allow. You can change these settings at any time.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Essential */}
                <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/50">
                  <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <Label className="font-medium">Essential</Label>
                      <Switch checked disabled />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Required for the website to function properly. Cannot be disabled.
                    </p>
                  </div>
                </div>

                {/* Analytics */}
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <BarChart2 className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <Label className="font-medium">Analytics</Label>
                      <Switch
                        checked={preferences.analytics}
                        onCheckedChange={(checked) => 
                          setPreferences(prev => ({ ...prev, analytics: checked }))
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Help us understand how visitors interact with our website.
                    </p>
                  </div>
                </div>

                {/* Marketing */}
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Megaphone className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <Label className="font-medium">Marketing</Label>
                      <Switch
                        checked={preferences.marketing}
                        onCheckedChange={(checked) => 
                          setPreferences(prev => ({ ...prev, marketing: checked }))
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Used to deliver personalized advertisements.
                    </p>
                  </div>
                </div>

                {/* Functional */}
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Settings className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <Label className="font-medium">Functional</Label>
                      <Switch
                        checked={preferences.functional}
                        onCheckedChange={(checked) => 
                          setPreferences(prev => ({ ...prev, functional: checked }))
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enable enhanced functionality and personalization.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowSettings(false)}>
                  Cancel
                </Button>
                <Button onClick={() => savePreferences(preferences)} disabled={isSaving}>
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
