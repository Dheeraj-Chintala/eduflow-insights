import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, Megaphone, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-muted border-muted-foreground/20',
  normal: 'bg-blue-50 border-blue-200',
  high: 'bg-orange-50 border-orange-200',
};

const PRIORITY_ICONS: Record<string, any> = {
  low: Info,
  normal: Megaphone,
  high: AlertTriangle,
};

export default function AnnouncementBanner() {
  const { user, roles } = useAuth();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Load dismissed announcements from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dismissed_announcements');
    if (stored) {
      setDismissedIds(JSON.parse(stored));
    }
  }, []);

  const { data: announcements } = useQuery({
    queryKey: ['active-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissed_announcements', JSON.stringify(newDismissed));
  };

  // Filter announcements based on user roles and dismissed state
  const visibleAnnouncements = announcements?.filter((a: any) => {
    // Check if dismissed
    if (dismissedIds.includes(a.id)) return false;

    // Check role targeting
    if (a.target_roles && a.target_roles.length > 0) {
      const hasMatchingRole = a.target_roles.some((role: string) =>
        roles.includes(role as any)
      );
      if (!hasMatchingRole) return false;
    }

    return true;
  });

  if (!visibleAnnouncements || visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-4">
      {visibleAnnouncements.map((announcement: any) => {
        const Icon = PRIORITY_ICONS[announcement.priority] || Megaphone;

        return (
          <Alert
            key={announcement.id}
            className={cn(
              'relative pr-12',
              PRIORITY_STYLES[announcement.priority] || PRIORITY_STYLES.normal
            )}
          >
            <Icon className="h-4 w-4" />
            <AlertTitle className="font-medium">{announcement.title}</AlertTitle>
            <AlertDescription className="mt-1">
              {announcement.content}
            </AlertDescription>
            {announcement.is_dismissible && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => handleDismiss(announcement.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </Alert>
        );
      })}
    </div>
  );
}
