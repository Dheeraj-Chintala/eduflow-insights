import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { fromTable } from '@/lib/supabase-helpers';
import { Search, Users as UsersIcon, Shield, GraduationCap, Briefcase, Building, Network } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Profile, AppRole } from '@/types/database';
import { ROLE_LABELS } from '@/types/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserWithRoles extends Profile {
  roles: AppRole[];
}

export default function OrgUsers() {
  const { orgId } = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (orgId) {
      fetchUsers();
    }
  }, [orgId]);

  const fetchUsers = async () => {
    try {
      const [profilesResult, rolesResult] = await Promise.all([
        fromTable('profiles').select('*').eq('org_id', orgId).order('full_name'),
        fromTable('user_roles').select('*').eq('org_id', orgId),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (rolesResult.error) throw rolesResult.error;

      const usersWithRoles: UserWithRoles[] = (profilesResult.data || []).map(profile => {
        const userRoles = (rolesResult.data || [])
          .filter(r => r.user_id === profile.user_id)
          .map(r => r.role as AppRole);
        return { ...profile, roles: userRoles };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const roleIcons: Record<AppRole, React.ReactNode> = {
    super_admin: <Shield className="h-3 w-3" />,
    admin: <Shield className="h-3 w-3" />,
    sub_admin: <Shield className="h-3 w-3" />,
    trainer: <GraduationCap className="h-3 w-3" />,
    mentor: <GraduationCap className="h-3 w-3" />,
    student: <UsersIcon className="h-3 w-3" />,
    corporate_hr: <Briefcase className="h-3 w-3" />,
    franchise: <Building className="h-3 w-3" />,
    distributor: <Network className="h-3 w-3" />,
    super_distributor: <Network className="h-3 w-3" />,
    affiliate: <UsersIcon className="h-3 w-3" />,
  };

  const roleColors: Record<AppRole, string> = {
    super_admin: 'bg-destructive/10 text-destructive border-destructive/20',
    admin: 'bg-primary/10 text-primary border-primary/20',
    sub_admin: 'bg-primary/10 text-primary border-primary/20',
    trainer: 'bg-accent/10 text-accent border-accent/20',
    mentor: 'bg-accent/10 text-accent border-accent/20',
    student: 'bg-muted text-muted-foreground border-muted',
    corporate_hr: 'bg-warning/10 text-warning border-warning/20',
    franchise: 'bg-success/10 text-success border-success/20',
    distributor: 'bg-info/10 text-info border-info/20',
    super_distributor: 'bg-info/10 text-info border-info/20',
    affiliate: 'bg-muted text-muted-foreground border-muted',
  };

  const stats = {
    total: users.length,
    admins: users.filter(u => u.roles.some(r => ['super_admin', 'admin', 'sub_admin'].includes(r))).length,
    trainers: users.filter(u => u.roles.some(r => ['trainer', 'mentor'].includes(r))).length,
    students: users.filter(u => u.roles.includes('student')).length,
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Users</h1>
          <p className="text-muted-foreground mt-1">
            View organization members (read-only)
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Users" value={stats.total} icon={<UsersIcon className="h-5 w-5" />} />
          <StatCard title="Admins" value={stats.admins} icon={<Shield className="h-5 w-5" />} />
          <StatCard title="Trainers" value={stats.trainers} icon={<GraduationCap className="h-5 w-5" />} />
          <StatCard title="Students" value={stats.students} icon={<UsersIcon className="h-5 w-5" />} />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Organization Members</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar_url || ''} />
                              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                {getInitials(user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.full_name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">
                                {user.job_title || 'No title'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {user.department || '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map(role => (
                              <Badge 
                                key={role} 
                                variant="outline" 
                                className={`gap-1 ${roleColors[role] || 'bg-muted'}`}
                              >
                                {roleIcons[role]}
                                {ROLE_LABELS[role]}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={user.is_active 
                              ? 'bg-success/10 text-success border-success/20' 
                              : 'bg-muted text-muted-foreground'}
                          >
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <UsersIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium">No users found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search' : 'Users will appear here'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-display font-bold mt-1">{value}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
