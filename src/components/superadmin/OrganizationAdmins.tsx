import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, Search, Shield, Trash2 } from 'lucide-react';
import { ROLE_LABELS, type AppRole, type Organization, type Profile } from '@/types/database';

interface AdminWithOrg {
  id: string;
  user_id: string;
  role: AppRole;
  org_id: string;
  created_at: string;
  profile?: Profile;
  organization?: Organization;
}

export default function OrganizationAdmins() {
  const [admins, setAdmins] = useState<AdminWithOrg[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOrg, setFilterOrg] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    org_id: '',
    role: 'admin' as AppRole,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch organizations
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (orgsError) throw orgsError;
      setOrganizations(orgs || []);

      // Fetch admins (admin and sub_admin roles)
      const { data: roleData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['admin', 'sub_admin'])
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Fetch profiles for all admin users
      const userIds = [...new Set((roleData || []).map((r) => r.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine data
      const adminsWithDetails: AdminWithOrg[] = (roleData || []).map((role) => ({
        ...role,
        profile: profiles?.find((p) => p.user_id === role.user_id),
        organization: orgs?.find((o) => o.id === role.org_id),
      }));

      setAdmins(adminsWithDetails);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load admins');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!formData.email || !formData.org_id) {
      toast.error('Email and organization are required');
      return;
    }

    setIsSaving(true);
    try {
      // Find user by email in profiles - we need to look up through auth.users
      // Since we can't access auth.users directly from client, we'll look for the user
      // by checking if they exist in the organization's profiles
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('org_id', formData.org_id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile lookup error:', profileError);
      }

      // For now, require using user_id directly or use an edge function
      // This is a simplified flow - in production, use an edge function to look up by email
      if (!userProfile) {
        toast.error('User not found in this organization. Please ensure the user exists first.');
        setIsSaving(false);
        return;
      }

      const userId = userProfile.user_id;

      // Check if user already has this role in this org
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('org_id', formData.org_id)
        .eq('role', formData.role)
        .maybeSingle();

      if (existingRole) {
        toast.error('User already has this role in the organization');
        setIsSaving(false);
        return;
      }

      // Add the role
      const { error: insertError } = await supabase.from('user_roles').insert({
        user_id: userId,
        org_id: formData.org_id,
        role: formData.role,
      });

      if (insertError) throw insertError;

      toast.success('Admin role assigned successfully');
      setIsAddOpen(false);
      setFormData({ email: '', org_id: '', role: 'admin' });
      fetchData();
    } catch (error: any) {
      console.error('Error adding admin:', error);
      toast.error(error.message || 'Failed to add admin');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAdmin = async (admin: AdminWithOrg) => {
    if (!confirm(`Remove ${admin.profile?.full_name || 'this user'} as ${ROLE_LABELS[admin.role]}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', admin.id);

      if (error) throw error;

      toast.success('Admin role removed');
      fetchData();
    } catch (error: any) {
      console.error('Error removing admin:', error);
      toast.error(error.message || 'Failed to remove admin');
    }
  };

  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.organization?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOrg = filterOrg === 'all' || admin.org_id === filterOrg;
    return matchesSearch && matchesOrg;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Organization Admins
              </CardTitle>
              <CardDescription>
                Manage admin users across all organizations
              </CardDescription>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Admin to Organization</DialogTitle>
                  <DialogDescription>
                    Assign an admin or sub-admin role to an existing user
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">User Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="admin@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org">Organization *</Label>
                    <Select
                      value={formData.org_id}
                      onValueChange={(value) => setFormData({ ...formData, org_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData({ ...formData, role: value as AppRole })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="sub_admin">Sub Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddAdmin} disabled={isSaving}>
                    {isSaving ? 'Adding...' : 'Add Admin'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search admins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterOrg} onValueChange={setFilterOrg}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by org" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No admins found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {admin.profile?.avatar_url ? (
                            <img
                              src={admin.profile.avatar_url}
                              alt={admin.profile.full_name || ''}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {admin.profile?.full_name?.charAt(0) || '?'}
                              </span>
                            </div>
                          )}
                          <span className="font-medium">
                            {admin.profile?.full_name || 'Unknown User'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{admin.organization?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant={admin.role === 'admin' ? 'default' : 'secondary'}>
                          {ROLE_LABELS[admin.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(admin.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAdmin(admin)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
