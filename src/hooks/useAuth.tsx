import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useRef,
} from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { fromTable } from '@/lib/supabase-helpers';
import type { Profile, UserRole, AppRole } from '@/types/database';

/* Role priority - highest first */
const ROLE_PRIORITY: AppRole[] = [
  'super_admin',
  'admin',
  'sub_admin',
  'trainer',
  'mentor',
  'corporate_hr',
  'super_distributor',
  'franchise',
  'distributor',
  'affiliate',
  'student',
];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  primaryRole: AppRole | null;
  orgId: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initialized = useRef(false);

  const primaryRole = useMemo(() => {
    for (const role of ROLE_PRIORITY) {
      if (roles.includes(role)) return role;
    }
    return null;
  }, [roles]);

  /* ---------- AUTH BOOTSTRAP ---------- */
  useEffect(() => {
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user && !initialized.current) {
          initialized.current = true;
          fetchUserData(session.user.id);
        }

        if (!session?.user) {
          clearUserData();
          setIsLoading(false);
        }
      });

    return () => subscription.unsubscribe();
  }, []);

  /* ---------- FETCH PROFILE + ROLES ---------- */
  const fetchUserData = async (userId: string) => {
    setIsLoading(true);

    try {
      const { data: profileData, error: profileError } =
        await fromTable('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        console.warn('Profile missing, defaulting to student');
        setRoles(['student']);
        setIsLoading(false);
        return;
      }

      const profile = profileData as Profile;
      setProfile(profile);
      setOrgId(profile.org_id);

      const { data: rolesData, error: rolesError } =
        await fromTable('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('org_id', profile.org_id);

      if (rolesError) throw rolesError;

      const resolvedRoles =
        (rolesData as Pick<UserRole, 'role'>[])?.map(r => r.role) ?? [];

      setRoles(resolvedRoles.length ? resolvedRoles : ['student']);
    } catch (err) {
      console.error('Auth bootstrap failed:', err);
      setRoles(['student']);
    } finally {
      setIsLoading(false);
    }
  };

  const clearUserData = () => {
    setProfile(null);
    setRoles([]);
    setOrgId(null);
    initialized.current = false;
  };

  /* ---------- AUTH ACTIONS ---------- */
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearUserData();
  };

  const hasRole = (role: AppRole) => roles.includes(role);
  const hasAnyRole = (checkRoles: AppRole[]) =>
    checkRoles.some(role => roles.includes(role));

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      roles,
      primaryRole,
      orgId,
      isLoading,
      signIn,
      signOut,
      hasRole,
      hasAnyRole,
    }),
    [user, session, profile, roles, primaryRole, orgId, isLoading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
