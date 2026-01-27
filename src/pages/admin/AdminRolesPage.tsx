import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, Shield, Plus, Edit, Trash2, Users, Key } from 'lucide-react';
import { ROLE_LABELS, type AppRole } from '@/types/database';

interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  org_id: string;
  created_at: string;
  updated_at: string;
}

interface Permission {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
}

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  org_id: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
  };
}

export default function AdminRolesPage() {
  const { isLoading: authLoading, primaryRole } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('roles');
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create role dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Edit role dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDescription, setEditRoleDescription] = useState('');
  const [editSelectedPermissions, setEditSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && primaryRole !== 'super_admin') {
      navigate('/dashboard');
      return;
    }
    
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, primaryRole, navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch custom roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('custom_roles')
        .select('*')
        .order('name');
      
      if (rolesError) throw rolesError;
      setCustomRoles(rolesData || []);

      // Fetch permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      if (permissionsError) throw permissionsError;
      setPermissions(permissionsData || []);

      // Fetch user roles
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (userRolesError) throw userRolesError;

      // Fetch profiles for these users
      if (userRolesData && userRolesData.length > 0) {
        const userIds = [...new Set(userRolesData.map(ur => ur.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        const profilesMap = (profilesData || []).reduce((acc, p) => {
          acc[p.user_id] = { full_name: p.full_name };
          return acc;
        }, {} as Record<string, { full_name: string | null }>);

        const enrichedRoles = userRolesData.map(ur => ({
          ...ur,
          profiles: profilesMap[ur.user_id] || { full_name: null }
        }));
        setUserRoles(enrichedRoles);
      } else {
        setUserRoles([]);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load roles and permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    setIsSaving(true);
    try {
      // Get org_id from user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .single();

      if (!profile?.org_id) {
        toast.error('Organization not found');
        return;
      }

      // Create the custom role
      const { data: newRole, error: roleError } = await supabase
        .from('custom_roles')
        .insert({
          name: newRoleName.trim(),
          description: newRoleDescription.trim() || null,
          org_id: profile.org_id,
        })
        .select()
        .single();

      if (roleError) throw roleError;

      // Add permissions if selected
      if (selectedPermissions.length > 0) {
        const permissionInserts = selectedPermissions.map(permId => ({
          custom_role_id: newRole.id,
          permission_id: permId,
        }));

        const { error: permError } = await supabase
          .from('custom_role_permissions')
          .insert(permissionInserts);

        if (permError) throw permError;
      }

      toast.success('Custom role created successfully');
      setIsCreateDialogOpen(false);
      setNewRoleName('');
      setNewRoleDescription('');
      setSelectedPermissions([]);
      fetchData();
    } catch (error: any) {
      console.error('Error creating role:', error);
      toast.error('Failed to create role');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRole = async () => {
    if (!editingRole || !editRoleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    setIsSaving(true);
    try {
      // Update the role
      const { error: roleError } = await supabase
        .from('custom_roles')
        .update({
          name: editRoleName.trim(),
          description: editRoleDescription.trim() || null,
        })
        .eq('id', editingRole.id);

      if (roleError) throw roleError;

      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from('custom_role_permissions')
        .delete()
        .eq('custom_role_id', editingRole.id);

      if (deleteError) throw deleteError;

      // Add new permissions if selected
      if (editSelectedPermissions.length > 0) {
        const permissionInserts = editSelectedPermissions.map(permId => ({
          custom_role_id: editingRole.id,
          permission_id: permId,
        }));

        const { error: permError } = await supabase
          .from('custom_role_permissions')
          .insert(permissionInserts);

        if (permError) throw permError;
      }

      toast.success('Role updated successfully');
      setIsEditDialogOpen(false);
      setEditingRole(null);
      fetchData();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = async (role: CustomRole) => {
    setEditingRole(role);
    setEditRoleName(role.name);
    setEditRoleDescription(role.description || '');
    
    // Fetch role permissions
    const { data: rolePerms } = await supabase
      .from('custom_role_permissions')
      .select('permission_id')
      .eq('custom_role_id', role.id);
    
    setEditSelectedPermissions(rolePerms?.map(p => p.permission_id) || []);
    setIsEditDialogOpen(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('custom_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast.success('Role deleted successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    }
  };

  const togglePermission = (permId: string, list: string[], setter: (list: string[]) => void) => {
    if (list.includes(permId)) {
      setter(list.filter(id => id !== permId));
    } else {
      setter([...list, permId]);
    }
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const category = perm.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Roles & Permissions
            </h1>
            <p className="text-muted-foreground">
              Manage system roles, custom roles, and permissions
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              System Roles
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Custom Roles
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Assignments
            </TabsTrigger>
          </TabsList>

          {/* System Roles Tab */}
          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Roles</CardTitle>
                <CardDescription>
                  Pre-defined roles with fixed permissions. These cannot be modified.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Access Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(ROLE_LABELS).map(([role, label]) => (
                      <TableRow key={role}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {role}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{label}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {role === 'super_admin' && 'Full system access'}
                            {role === 'admin' && 'Organization admin access'}
                            {role === 'sub_admin' && 'Limited admin access'}
                            {role === 'trainer' && 'Course creation and management'}
                            {role === 'mentor' && 'Student guidance and support'}
                            {role === 'student' && 'Learning and course access'}
                            {role === 'franchise' && 'Franchise operations'}
                            {role === 'distributor' && 'Distribution network access'}
                            {role === 'super_distributor' && 'Distribution management'}
                            {role === 'affiliate' && 'Affiliate marketing access'}
                            {role === 'corporate_hr' && 'Corporate training management'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Roles Tab */}
          <TabsContent value="custom" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Custom Roles</CardTitle>
                  <CardDescription>
                    Create and manage custom roles with specific permissions
                  </CardDescription>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Custom Role</DialogTitle>
                      <DialogDescription>
                        Define a new role with specific permissions
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="roleName">Role Name</Label>
                        <Input
                          id="roleName"
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          placeholder="e.g., Content Reviewer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roleDescription">Description</Label>
                        <Textarea
                          id="roleDescription"
                          value={newRoleDescription}
                          onChange={(e) => setNewRoleDescription(e.target.value)}
                          placeholder="Describe this role's responsibilities..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Permissions</Label>
                        <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-4">
                          {Object.entries(groupedPermissions).map(([category, perms]) => (
                            <div key={category}>
                              <h4 className="font-medium text-sm text-muted-foreground mb-2">{category}</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {perms.map((perm) => (
                                  <div key={perm.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`new-perm-${perm.id}`}
                                      checked={selectedPermissions.includes(perm.id)}
                                      onCheckedChange={() => togglePermission(perm.id, selectedPermissions, setSelectedPermissions)}
                                    />
                                    <label
                                      htmlFor={`new-perm-${perm.id}`}
                                      className="text-sm cursor-pointer"
                                    >
                                      {perm.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          {permissions.length === 0 && (
                            <p className="text-sm text-muted-foreground">No permissions defined yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateRole} disabled={isSaving}>
                        {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Create Role
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {customRoles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No custom roles created yet</p>
                    <p className="text-sm">Create a custom role to define specific permissions</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customRoles.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium">{role.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {role.description || 'No description'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(role.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(role)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Role</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the "{role.name}" role? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteRole(role.id)}
                                      className="bg-destructive text-destructive-foreground"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Custom Role</DialogTitle>
                  <DialogDescription>
                    Update role name, description, and permissions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="editRoleName">Role Name</Label>
                    <Input
                      id="editRoleName"
                      value={editRoleName}
                      onChange={(e) => setEditRoleName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editRoleDescription">Description</Label>
                    <Textarea
                      id="editRoleDescription"
                      value={editRoleDescription}
                      onChange={(e) => setEditRoleDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-4">
                      {Object.entries(groupedPermissions).map(([category, perms]) => (
                        <div key={category}>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">{category}</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {perms.map((perm) => (
                              <div key={perm.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`edit-perm-${perm.id}`}
                                  checked={editSelectedPermissions.includes(perm.id)}
                                  onCheckedChange={() => togglePermission(perm.id, editSelectedPermissions, setEditSelectedPermissions)}
                                />
                                <label
                                  htmlFor={`edit-perm-${perm.id}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {perm.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditRole} disabled={isSaving}>
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* User Assignments Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Role Assignments</CardTitle>
                <CardDescription>
                  View and manage role assignments for users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Assigned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userRoles.map((ur) => (
                      <TableRow key={ur.id}>
                        <TableCell className="font-medium">
                          {(ur.profiles as any)?.full_name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {ROLE_LABELS[ur.role] || ur.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(ur.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {userRoles.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No user role assignments found
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
    </AppLayout>
  );
}
