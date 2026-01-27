import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Monitor, Smartphone, Tablet, Globe, Clock, LogOut, Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import type { UserSession } from '@/types/security';

export default function SessionManager() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminatingSession, setTerminatingSession] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('last_active_at', { ascending: false });

      if (error) throw error;
      setSessions((data as unknown as UserSession[]) || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      setTerminatingSession(sessionId);
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success('Session terminated successfully');
    } catch (error) {
      console.error('Error terminating session:', error);
      toast.error('Failed to terminate session');
    } finally {
      setTerminatingSession(null);
    }
  };

  const terminateAllSessions = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', user?.id)
        .neq('session_token', 'current'); // Keep current session

      if (error) throw error;

      await fetchSessions();
      toast.success('All other sessions terminated');
    } catch (error) {
      console.error('Error terminating all sessions:', error);
      toast.error('Failed to terminate sessions');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Active Sessions
            </CardTitle>
            <CardDescription>
              Manage devices where you're currently logged in
            </CardDescription>
          </div>
          {sessions.length > 1 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out all devices?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will sign you out of all devices except the current one. 
                    You'll need to sign in again on those devices.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={terminateAllSessions}>
                    Sign out all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No active sessions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session, index) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-secondary">
                    {getDeviceIcon(session.device_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {session.device_name || session.browser || 'Unknown Device'}
                      </p>
                      {index === 0 && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {session.ip_address || 'Unknown IP'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true })}
                      </span>
                    </div>
                    {session.location && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {session.location}
                      </p>
                    )}
                  </div>
                </div>
                {index !== 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => terminateSession(session.id)}
                    disabled={terminatingSession === session.id}
                  >
                    {terminatingSession === session.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
