import React, { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { fromTable } from '@/lib/supabase-helpers';
import { 
  UserPlus, 
  Upload, 
  Mail, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import type { AppRole } from '@/types/database';

interface InvitationResult {
  email: string;
  success: boolean;
  error?: string;
}

interface PendingInvite {
  email: string;
  role: AppRole;
}

interface Invitation {
  id: string;
  email: string;
  role: AppRole;
  status: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

const INVITABLE_ROLES: { value: AppRole; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'trainer', label: 'Trainer' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'sub_admin', label: 'Sub Admin' },
];

export default function InviteUsersPage() {
  const { isLoading: authLoading, primaryRole, orgId, user } = useAuth();
  const [activeTab, setActiveTab] = useState('single');
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  
  // Single invite state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AppRole>('student');
  
  // Bulk invite state
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [bulkRole, setBulkRole] = useState<AppRole>('student');
  const [results, setResults] = useState<InvitationResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchInvitations = async () => {
    if (!orgId) return;
    
    setLoadingInvitations(true);
    try {
      const { data, error } = await fromTable('user_invitations')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInvitations((data || []) as Invitation[]);
    } catch (err: any) {
      console.error('Error fetching invitations:', err);
    } finally {
      setLoadingInvitations(false);
    }
  };

  // Fetch invitations on mount
  React.useEffect(() => {
    if (orgId) {
      fetchInvitations();
    }
  }, [orgId]);

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!primaryRole || !['super_admin', 'admin', 'sub_admin'].includes(primaryRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSingleInvite = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    if (!orgId) {
      toast.error('Organization not found');
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      // Get the current session to ensure we have a valid token
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        toast.error('You must be logged in to invite users');
        console.error('Session error:', sessionError);
        return;
      }

      console.log('Invoking invite-user function with:', {
        email: email.trim().toLowerCase(),
        role,
        org_id: orgId,
        hasSession: !!sessionData.session,
        userId: sessionData.session.user.id
      });

      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          invitations: [{ email: email.trim().toLowerCase(), role, org_id: orgId }],
        },
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error details:', {
          message: error.message,
          name: error.name,
          context: error.context
        });
        throw error;
      }

      if (data.successCount > 0) {
        toast.success(`Invitation sent to ${email}`);
        setEmail('');
        fetchInvitations();
      } else if (data.results?.[0]?.error) {
        toast.error(data.results[0].error);
      }

      setResults(data.results || []);
    } catch (err: any) {
      console.error('Invite error:', err);
      
      // Provide more specific error messages
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        toast.error('Authentication failed. Please try logging out and back in.');
      } else if (err.message?.includes('403') || err.message?.includes('permission')) {
        toast.error("You don't have permission to invite users");
      } else {
        toast.error(err.message || 'Failed to send invitation');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header if present
      const startIndex = lines[0]?.toLowerCase().includes('email') ? 1 : 0;
      
      const emails: PendingInvite[] = [];
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Handle CSV format: email,role or just email
        const parts = line.split(',').map(p => p.trim());
        const emailPart = parts[0];
        
        // Basic email validation
        if (emailPart && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailPart)) {
          // Check if role is specified in CSV
          const roleFromCsv = parts[1]?.toLowerCase();
          const validRole = INVITABLE_ROLES.find(r => r.value === roleFromCsv)?.value;
          
          emails.push({
            email: emailPart.toLowerCase(),
            role: validRole || bulkRole,
          });
        }
      }
      
      if (emails.length === 0) {
        toast.error('No valid emails found in file');
        return;
      }
      
      setPendingInvites(emails);
      toast.success(`Found ${emails.length} email(s) to invite`);
    };
    
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddEmail = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Invalid email format');
      return;
    }

    if (pendingInvites.some(p => p.email === trimmed)) {
      toast.error('Email already in list');
      return;
    }

    setPendingInvites([...pendingInvites, { email: trimmed, role: bulkRole }]);
    setEmail('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setPendingInvites(pendingInvites.filter(p => p.email !== emailToRemove));
  };

  const handleBulkInvite = async () => {
    if (pendingInvites.length === 0) {
      toast.error('No emails to invite');
      return;
    }

    if (!orgId) {
      toast.error('Organization not found');
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      // Get the current session to ensure we have a valid token
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        toast.error('You must be logged in to invite users');
        console.error('Session error:', sessionError);
        return;
      }

      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          invitations: pendingInvites.map(p => ({
            email: p.email,
            role: p.role,
            org_id: orgId,
          })),
        },
      });

      if (error) {
        console.error('Bulk invite edge function error:', error);
        throw error;
      }

      toast.success(data.message);
      setResults(data.results || []);
      
      // Remove successful invites from pending
      const successfulEmails = (data.results || [])
        .filter((r: InvitationResult) => r.success)
        .map((r: InvitationResult) => r.email);
      
      setPendingInvites(pendingInvites.filter(p => !successfulEmails.includes(p.email)));
      fetchInvitations();
    } catch (err: any) {
      console.error('Bulk invite error:', err);
      
      // Provide more specific error messages
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        toast.error('Authentication failed. Please try logging out and back in.');
      } else if (err.message?.includes('403') || err.message?.includes('permission')) {
        toast.error("You don't have permission to invite users");
      } else {
        toast.error(err.message || 'Failed to send invitations');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async (id: string) => {
    try {
      const { error } = await fromTable('user_invitations')
        .update({ status: 'cancelled' })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Invitation cancelled');
      fetchInvitations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel invitation');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'accepted':
        return <Badge className="gap-1 bg-primary text-primary-foreground"><CheckCircle className="h-3 w-3" /> Accepted</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Expired</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Invite Users</h1>
            <p className="text-muted-foreground">
              Invite new users to join your organization
            </p>
          </div>
          <Button variant="outline" onClick={fetchInvitations} disabled={loadingInvitations}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingInvitations ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="single" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Single Invite
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2">
              <Upload className="h-4 w-4" />
              Bulk Invite
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Mail className="h-4 w-4" />
              Invitation History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invite a User</CardTitle>
                <CardDescription>
                  Send an invitation email to a new user with their assigned role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSingleInvite()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INVITABLE_ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSingleInvite} disabled={loading || !email.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Invite Users</CardTitle>
                <CardDescription>
                  Upload a CSV file or add multiple emails to invite many users at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* CSV Upload */}
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a CSV file with emails (optionally with roles)
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Format: email or email,role (one per line)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>

                {/* Manual Entry */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                    />
                  </div>
                  <Select value={bulkRole} onValueChange={(v) => setBulkRole(v as AppRole)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INVITABLE_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={handleAddEmail}>
                    Add
                  </Button>
                </div>

                {/* Pending List */}
                {pendingInvites.length > 0 && (
                  <div className="border rounded-lg">
                    <div className="p-3 bg-muted/50 border-b flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {pendingInvites.length} email(s) to invite
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setPendingInvites([])}
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-2 space-y-1">
                      {pendingInvites.map((item) => (
                        <div 
                          key={item.email}
                          className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{item.email}</span>
                            <Badge variant="outline" className="text-xs">
                              {INVITABLE_ROLES.find(r => r.value === item.role)?.label}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveEmail(item.email)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleBulkInvite} 
                  disabled={loading || pendingInvites.length === 0}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending Invitations...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send {pendingInvites.length} Invitation(s)
                    </>
                  )}
                </Button>

                {/* Results */}
                {results.length > 0 && (
                  <div className="border rounded-lg p-4 space-y-2">
                    <h4 className="font-medium">Results</h4>
                    {results.map((result, i) => (
                      <div 
                        key={i}
                        className={`flex items-center gap-2 text-sm p-2 rounded ${
                          result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {result.success ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <span>{result.email}</span>
                        {result.error && (
                          <span className="text-xs">- {result.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Invitation History</CardTitle>
                <CardDescription>
                  View and manage all sent invitations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingInvitations ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : invitations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No invitations sent yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">{inv.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {INVITABLE_ROLES.find(r => r.value === inv.role)?.label || inv.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(inv.status)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(inv.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(inv.expires_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            {inv.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleCancelInvitation(inv.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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

        {/* Info Card */}
        <Card className="bg-muted/50 border-border">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1 text-foreground">How User Invitations Work</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Invited users receive an email with a link to set their password</li>
                  <li>Once they complete registration, they're automatically assigned the selected role</li>
                  <li>Invitations expire after 7 days if not accepted</li>
                  <li>Users will be added to your organization automatically</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
