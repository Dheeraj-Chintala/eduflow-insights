import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Shield, Monitor, Globe, Lock, Eye, Video, 
  AlertTriangle, CheckCircle, XCircle, Loader2,
  Users, Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSecuritySettings } from '@/hooks/useSecuritySettings';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import type { SecurityAuditLog, ContentAccessLog } from '@/types/security';

export default function AdminSecurityDashboard() {
  const { settings, isLoading, updateSettings } = useSecuritySettings();
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [accessLogs, setAccessLogs] = useState<ContentAccessLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);

      const [auditResult, accessResult] = await Promise.all([
        supabase
          .from('security_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('content_access_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (auditResult.data) {
        setAuditLogs(auditResult.data as unknown as SecurityAuditLog[]);
      }
      if (accessResult.data) {
        setAccessLogs(accessResult.data as unknown as ContentAccessLog[]);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!localSettings) return;

    try {
      setSaving(true);
      await updateSettings(localSettings);
      toast.success('Security settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">{severity}</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-warning/10 text-warning">{severity}</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          Security & Anti-Piracy
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure security settings and monitor platform safety
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Across all users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Security Events</CardTitle>
            <Activity className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.filter(l => l.severity === 'warning' || l.severity === 'critical').length}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Content Access</CardTitle>
            <Video className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accessLogs.length}</div>
            <p className="text-xs text-muted-foreground">Recent streams</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">2FA Enabled</CardTitle>
            <Lock className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {settings?.enable_2fa ? (
                <><CheckCircle className="h-5 w-5 text-success" /> Active</>
              ) : (
                <><XCircle className="h-5 w-5 text-muted-foreground" /> Inactive</>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
          <TabsTrigger value="content">Content Protection</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="access">Access Logs</TabsTrigger>
        </TabsList>

        {/* Security Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Authentication & Session Settings</CardTitle>
              <CardDescription>Configure login security and session management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Max Devices Per User</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={localSettings?.max_devices_per_user || 3}
                    onChange={(e) => setLocalSettings(prev => prev ? {...prev, max_devices_per_user: parseInt(e.target.value)} : prev)}
                  />
                  <p className="text-xs text-muted-foreground">Maximum number of devices a user can log in from</p>
                </div>

                <div className="space-y-2">
                  <Label>Max Concurrent Sessions</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={localSettings?.max_concurrent_sessions || 2}
                    onChange={(e) => setLocalSettings(prev => prev ? {...prev, max_concurrent_sessions: parseInt(e.target.value)} : prev)}
                  />
                  <p className="text-xs text-muted-foreground">Maximum simultaneous active sessions</p>
                </div>

                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    min={15}
                    max={10080}
                    value={localSettings?.session_timeout_minutes || 1440}
                    onChange={(e) => setLocalSettings(prev => prev ? {...prev, session_timeout_minutes: parseInt(e.target.value)} : prev)}
                  />
                  <p className="text-xs text-muted-foreground">Auto-logout after inactivity (1440 = 24 hours)</p>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium">Security Features</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                  </div>
                  <Switch
                    checked={localSettings?.enable_2fa || false}
                    onCheckedChange={(checked) => setLocalSettings(prev => prev ? {...prev, enable_2fa: checked} : prev)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Device Restriction</p>
                    <p className="text-sm text-muted-foreground">Limit login to trusted devices</p>
                  </div>
                  <Switch
                    checked={localSettings?.enable_device_restriction || false}
                    onCheckedChange={(checked) => setLocalSettings(prev => prev ? {...prev, enable_device_restriction: checked} : prev)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">IP Restriction</p>
                    <p className="text-sm text-muted-foreground">Restrict access by IP address</p>
                  </div>
                  <Switch
                    checked={localSettings?.enable_ip_restriction || false}
                    onCheckedChange={(checked) => setLocalSettings(prev => prev ? {...prev, enable_ip_restriction: checked} : prev)}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveSettings} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Protection Tab */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content Protection & DRM</CardTitle>
              <CardDescription>Configure video protection and anti-piracy measures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Video Protection Level</Label>
                <Select 
                  value={localSettings?.video_protection_level || 'standard'}
                  onValueChange={(value) => setLocalSettings(prev => prev ? {...prev, video_protection_level: value as any} : prev)}
                >
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None - No protection</SelectItem>
                    <SelectItem value="standard">Standard - Basic protection</SelectItem>
                    <SelectItem value="high">High - Maximum protection</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Higher levels may affect playback performance</p>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium">Anti-Piracy Features</h4>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Video Watermarking</p>
                    <p className="text-sm text-muted-foreground">Display user info on videos</p>
                  </div>
                  <Switch
                    checked={localSettings?.enable_watermark || false}
                    onCheckedChange={(checked) => setLocalSettings(prev => prev ? {...prev, enable_watermark: checked} : prev)}
                  />
                </div>

                {localSettings?.enable_watermark && (
                  <div className="ml-4 space-y-2">
                    <Label>Watermark Text Template</Label>
                    <Input
                      value={localSettings?.watermark_text_template || ''}
                      onChange={(e) => setLocalSettings(prev => prev ? {...prev, watermark_text_template: e.target.value} : prev)}
                      placeholder="{{user_email}} - {{timestamp}}"
                    />
                    <p className="text-xs text-muted-foreground">
                      Variables: {"{{user_email}}, {{user_id}}, {{timestamp}}"}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Screen Capture Prevention</p>
                    <p className="text-sm text-muted-foreground">Blur video when screen capture is detected</p>
                  </div>
                  <Switch
                    checked={localSettings?.enable_screen_capture_prevention || false}
                    onCheckedChange={(checked) => setLocalSettings(prev => prev ? {...prev, enable_screen_capture_prevention: checked} : prev)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Right-Click Prevention</p>
                    <p className="text-sm text-muted-foreground">Disable right-click menu on videos</p>
                  </div>
                  <Switch
                    checked={localSettings?.enable_right_click_prevention || false}
                    onCheckedChange={(checked) => setLocalSettings(prev => prev ? {...prev, enable_right_click_prevention: checked} : prev)}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveSettings} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Security Audit Logs</CardTitle>
              <CardDescription>Track security-related events across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <Skeleton className="h-64 w-full" />
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No security events recorded</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{log.event_type}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {log.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.event_category}</Badge>
                        </TableCell>
                        <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.ip_address || '--'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Access Logs Tab */}
        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Content Access Logs</CardTitle>
              <CardDescription>Monitor how content is being accessed</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <Skeleton className="h-64 w-full" />
              ) : accessLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No content access recorded</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead>Watermark</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm truncate max-w-[150px]">
                          {log.content_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.content_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{log.access_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {log.watermark_applied ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.duration_seconds ? `${Math.round(log.duration_seconds / 60)}m` : '--'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
