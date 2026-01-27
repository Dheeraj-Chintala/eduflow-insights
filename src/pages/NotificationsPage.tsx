import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Check, ExternalLink, Trash2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { NOTIFICATION_TYPE_COLORS } from '@/types/notifications';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['all-user-notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    },
  });

  const unreadNotifications = notifications?.filter((n: any) => !n.is_read) || [];
  const readNotifications = notifications?.filter((n: any) => n.is_read) || [];

  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">View all your notifications and manage preferences</p>
          </div>
          {unreadNotifications.length > 0 && (
            <Button variant="outline" onClick={() => markAllAsReadMutation.mutate()}>
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">
              All
              <Badge variant="secondary" className="ml-2">
                {notifications?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadNotifications.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <NotificationList
              notifications={notifications || []}
              isLoading={isLoading}
              onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
            />
          </TabsContent>

          <TabsContent value="unread" className="mt-4">
            <NotificationList
              notifications={unreadNotifications}
              isLoading={isLoading}
              onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
            />
          </TabsContent>

          <TabsContent value="preferences" className="mt-4">
            <NotificationPreferences />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function NotificationList({
  notifications,
  isLoading,
  onMarkAsRead,
}: {
  notifications: any[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No notifications</h3>
          <p className="text-muted-foreground">You're all caught up!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0 divide-y">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              'p-4 hover:bg-muted/50 transition-colors',
              !notification.is_read && 'bg-primary/5'
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'w-2 h-2 rounded-full mt-2 shrink-0',
                  notification.is_read ? 'bg-muted' : 'bg-primary'
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{notification.title}</p>
                  <Badge
                    variant="outline"
                    className={cn('text-xs', NOTIFICATION_TYPE_COLORS[notification.notification_type])}
                  >
                    {notification.notification_type}
                  </Badge>
                  {notification.priority === 'high' || notification.priority === 'urgent' ? (
                    <Badge variant="destructive" className="text-xs">
                      {notification.priority}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">{notification.message}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(notification.created_at), 'dd MMM yyyy, HH:mm')} •{' '}
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </span>
                  <div className="flex items-center gap-2">
                    {notification.action_url && (
                      <Link
                        to={notification.action_url}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        {notification.action_label || 'View'}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMarkAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
