import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fromTable } from '@/lib/supabase-helpers';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Bell, Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import SessionManager from '@/components/security/SessionManager';
import TwoFactorSetup from '@/components/security/TwoFactorSetup';

export default function Settings() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    job_title: profile?.job_title || '',
    department: profile?.department || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsLoading(true);
    try {
      const { error } = await fromTable('profiles')
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
          job_title: formData.job_title,
          department: formData.department,
        } as any)
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account preferences and profile
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and public profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {getInitials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{profile?.full_name || 'User'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {profile?.job_title || 'No title set'}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="job_title">Job Title</Label>
                      <Input
                        id="job_title"
                        name="job_title"
                        value={formData.job_title}
                        onChange={handleInputChange}
                        placeholder="Software Engineer"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        placeholder="Engineering"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Tell us a bit about yourself..."
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-gradient-primary hover:opacity-90"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <NotificationSetting
                  title="Course Updates"
                  description="Get notified when a course you're enrolled in is updated"
                  defaultChecked={true}
                />
                <NotificationSetting
                  title="New Courses"
                  description="Get notified when new courses become available"
                  defaultChecked={true}
                />
                <NotificationSetting
                  title="Progress Reminders"
                  description="Receive reminders to continue your learning"
                  defaultChecked={false}
                />
                <NotificationSetting
                  title="Completion Certificates"
                  description="Get notified when you earn a certificate"
                  defaultChecked={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <div className="space-y-6">
              <TwoFactorSetup />
              <SessionManager />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function NotificationSetting({ 
  title, 
  description, 
  defaultChecked 
}: { 
  title: string; 
  description: string; 
  defaultChecked: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={setChecked} />
    </div>
  );
}
