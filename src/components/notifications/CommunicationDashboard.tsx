import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Plus, Edit, Trash2, Send, Mail, MessageSquare, Smartphone, Bell, Megaphone, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { CAMPAIGN_STATUS_COLORS, CampaignStatus } from '@/types/notifications';

export default function CommunicationDashboard() {
  const queryClient = useQueryClient();
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch campaigns
  const { data: campaigns } = useQuery({
    queryKey: ['drip-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drip_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch message logs
  const { data: messageLogs } = useQuery({
    queryKey: ['message-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_logs')
        .select(`
          *,
          profiles!message_logs_user_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  // Fetch announcements
  const { data: announcements } = useQuery({
    queryKey: ['all-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const channelIcons: Record<string, any> = {
    email: Mail,
    sms: Smartphone,
    whatsapp: MessageSquare,
    in_app: Bell,
    push: Bell,
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    sent: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    read: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="logs">Message Logs</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Notification Templates</CardTitle>
                  <CardDescription>Manage email, SMS, and WhatsApp templates</CardDescription>
                </div>
                <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedTemplate ? 'Edit Template' : 'Create Template'}
                      </DialogTitle>
                      <DialogDescription>
                        Create reusable notification templates
                      </DialogDescription>
                    </DialogHeader>
                    <TemplateForm
                      template={selectedTemplate}
                      onSuccess={() => {
                        setIsTemplateDialogOpen(false);
                        setSelectedTemplate(null);
                        queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates?.map((template: any) => {
                    const ChannelIcon = channelIcons[template.channel] || Mail;
                    return (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{template.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {template.subject || template.body.substring(0, 50)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <ChannelIcon className="h-3 w-3" />
                            {template.channel}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{template.category || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={template.is_active ? 'default' : 'secondary'}>
                            {template.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedTemplate(template);
                                setIsTemplateDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Drip Campaigns</CardTitle>
                  <CardDescription>Automated messaging sequences</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns?.map((campaign: any) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {campaign.description?.substring(0, 50) || 'No description'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{campaign.campaign_type}</TableCell>
                      <TableCell>{campaign.total_enrolled}</TableCell>
                      <TableCell>{campaign.total_completed}</TableCell>
                      <TableCell>
                        <Badge className={CAMPAIGN_STATUS_COLORS[campaign.status as CampaignStatus]}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {campaign.status === 'active' ? (
                            <Button variant="ghost" size="icon" title="Pause">
                              <Pause className="h-4 w-4" />
                            </Button>
                          ) : campaign.status === 'draft' || campaign.status === 'paused' ? (
                            <Button variant="ghost" size="icon" title="Start">
                              <Play className="h-4 w-4" />
                            </Button>
                          ) : null}
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!campaigns || campaigns.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No campaigns created yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Announcements</CardTitle>
                  <CardDescription>Platform-wide announcements and banners</CardDescription>
                </div>
                <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Megaphone className="h-4 w-4 mr-2" />
                      New Announcement
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Announcement</DialogTitle>
                      <DialogDescription>
                        Create a platform-wide announcement
                      </DialogDescription>
                    </DialogHeader>
                    <AnnouncementForm
                      onSuccess={() => {
                        setIsAnnouncementDialogOpen(false);
                        queryClient.invalidateQueries({ queryKey: ['all-announcements'] });
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements?.map((announcement: any) => (
                    <TableRow key={announcement.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{announcement.title}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                            {announcement.content}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {announcement.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {announcement.starts_at && format(new Date(announcement.starts_at), 'dd MMM')}
                        {announcement.ends_at && ` - ${format(new Date(announcement.ends_at), 'dd MMM')}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={announcement.is_active ? 'default' : 'secondary'}>
                          {announcement.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Message Logs Tab */}
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Message Logs</CardTitle>
              <CardDescription>Track all sent notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messageLogs?.map((log: any) => {
                    const ChannelIcon = channelIcons[log.channel] || Mail;
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          {format(new Date(log.created_at), 'dd MMM yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{log.profiles?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{log.recipient}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <ChannelIcon className="h-3 w-3" />
                            {log.channel}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {log.subject || log.body.substring(0, 40)}...
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[log.status]}>
                            {log.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!messageLogs || messageLogs.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No messages sent yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Template Form Component
function TemplateForm({ template, onSuccess }: { template?: any; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    channel: template?.channel || 'email',
    subject: template?.subject || '',
    body: template?.body || '',
    category: template?.category || '',
    is_active: template?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (template) {
        const { error } = await supabase
          .from('notification_templates')
          .update(formData)
          .eq('id', template.id);
        if (error) throw error;
      } else {
        // Get org_id from user's context (simplified for now)
        const { data: userData } = await supabase.auth.getUser();
        const { data: profile } = await supabase
          .from('profiles')
          .select('org_id')
          .eq('id', userData.user?.id)
          .single();

        const { error } = await supabase
          .from('notification_templates')
          .insert({ ...formData, org_id: profile?.org_id, created_by: userData.user?.id });
        if (error) throw error;
      }

      toast.success(template ? 'Template updated' : 'Template created');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Template Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Channel</Label>
          <Select
            value={formData.channel}
            onValueChange={(value) => setFormData({ ...formData, channel: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="in_app">In-App</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="course">Course</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.channel === 'email' && (
        <div>
          <Label>Subject</Label>
          <Input
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Email subject line"
          />
        </div>
      )}

      <div>
        <Label>Message Body</Label>
        <Textarea
          value={formData.body}
          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          rows={6}
          placeholder="Use {{variable}} for dynamic content"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Available variables: {'{{name}}'}, {'{{course_title}}'}, {'{{due_date}}'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label>Active</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit">{template ? 'Update' : 'Create'} Template</Button>
      </div>
    </form>
  );
}

// Announcement Form Component
function AnnouncementForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    is_dismissible: true,
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', userData.user?.id)
        .single();

      const { error } = await supabase
        .from('announcements')
        .insert({ ...formData, org_id: profile?.org_id, created_by: userData.user?.id });

      if (error) throw error;

      toast.success('Announcement created');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create announcement');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <Label>Content</Label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={4}
          required
        />
      </div>

      <div>
        <Label>Priority</Label>
        <Select
          value={formData.priority}
          onValueChange={(value) => setFormData({ ...formData, priority: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_dismissible}
            onCheckedChange={(checked) => setFormData({ ...formData, is_dismissible: checked })}
          />
          <Label>Dismissible</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label>Active</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit">Create Announcement</Button>
      </div>
    </form>
  );
}
