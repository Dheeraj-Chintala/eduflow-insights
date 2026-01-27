import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Permission } from '@/types/database';

interface UsePermissionsReturn {
  permissions: string[];
  allPermissions: Permission[];
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  refetch: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const { user, roles } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch all available permissions
      const { data: allPerms, error: allPermsError } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (allPermsError) throw allPermsError;
      setAllPermissions((allPerms as Permission[]) || []);

      // Fetch user's permissions based on their roles
      const { data: rolePerms, error: rolePermsError } = await supabase
        .from('role_permissions')
        .select(`
          permission_id,
          permissions!inner (name)
        `)
        .in('role', roles);

      if (rolePermsError) throw rolePermsError;

      // Fetch custom role permissions
      const { data: customRolePerms, error: customPermsError } = await supabase
        .from('user_custom_roles')
        .select(`
          custom_role_id,
          custom_roles!inner (
            custom_role_permissions (
              permissions!inner (name)
            )
          )
        `)
        .eq('user_id', user.id);

      if (customPermsError) throw customPermsError;

      // Combine all permissions
      const permSet = new Set<string>();

      // Add role-based permissions
      rolePerms?.forEach((rp: any) => {
        if (rp.permissions?.name) {
          permSet.add(rp.permissions.name);
        }
      });

      // Add custom role permissions
      customRolePerms?.forEach((ucr: any) => {
        ucr.custom_roles?.custom_role_permissions?.forEach((crp: any) => {
          if (crp.permissions?.name) {
            permSet.add(crp.permissions.name);
          }
        });
      });

      setPermissions(Array.from(permSet));
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, roles]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (perms: string[]) => perms.some((p) => permissions.includes(p)),
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (perms: string[]) => perms.every((p) => permissions.includes(p)),
    [permissions]
  );

  return useMemo(
    () => ({
      permissions,
      allPermissions,
      isLoading,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      refetch: fetchPermissions,
    }),
    [permissions, allPermissions, isLoading, hasPermission, hasAnyPermission, hasAllPermissions, fetchPermissions]
  );
}
