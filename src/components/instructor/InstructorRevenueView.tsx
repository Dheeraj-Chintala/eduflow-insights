import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { fromTable } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import type { InstructorRevenue, InstructorSettings, RevenueStatus } from '@/types/instructor';

const STATUS_CONFIG: Record<RevenueStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/20' },
  processed: { label: 'Processed', className: 'bg-info/10 text-info border-info/20' },
  paid: { label: 'Paid', className: 'bg-success/10 text-success border-success/20' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export function InstructorRevenueView() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<InstructorSettings | null>(null);
  const [revenue, setRevenue] = useState<InstructorRevenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // First check if revenue view is enabled for this instructor
      const { data: settingsData } = await fromTable('instructor_settings')
        .select('*')
        .eq('instructor_id', user?.id)
        .maybeSingle();

      setSettings(settingsData as InstructorSettings | null);

      if (settingsData?.show_revenue) {
        const { data: revenueData } = await fromTable('instructor_revenue')
          .select('*, course:courses(title)')
          .eq('instructor_id', user?.id)
          .order('created_at', { ascending: false });

        setRevenue((revenueData as InstructorRevenue[]) || []);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  // If revenue view is not enabled
  if (!settings?.show_revenue) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue & Earnings
          </CardTitle>
          <CardDescription>View your course earnings and payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium text-foreground mb-2">Revenue View Not Enabled</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Revenue sharing has not been enabled for your account. Contact your administrator to enable this feature.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totals = revenue.reduce(
    (acc, r) => {
      acc.totalEarnings += r.instructor_amount;
      if (r.status === 'paid') acc.totalPaid += r.instructor_amount;
      if (r.status === 'pending' || r.status === 'processed') acc.totalPending += r.instructor_amount;
      return acc;
    },
    { totalEarnings: 0, totalPaid: 0, totalPending: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Revenue & Earnings
        </CardTitle>
        <CardDescription>
          Your revenue share: {settings.revenue_share_percent}%
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${totals.totalEarnings.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Total Earnings</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CreditCard className="h-5 w-5 text-info" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${totals.totalPaid.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Paid Out</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-warning" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${totals.totalPending.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>

        {/* Transaction History */}
        {revenue.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">Transaction History</h3>
            {revenue.map(r => {
              const statusConfig = STATUS_CONFIG[r.status];
              return (
                <div
                  key={r.id}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{(r as any).course?.title || 'Course'}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(r.created_at), 'MMM d, yyyy')}
                        {r.transaction_ref && ` • Ref: ${r.transaction_ref}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-success">
                        +${r.instructor_amount.toFixed(2)}
                      </p>
                      <Badge variant="outline" className={statusConfig.className}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
