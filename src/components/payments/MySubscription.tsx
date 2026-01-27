import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { format, differenceInDays, isAfter } from 'date-fns';
import { Crown, Calendar, AlertTriangle, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { SUBSCRIPTION_STATUS_COLORS, SubscriptionStatus } from '@/types/payments';

export default function MySubscription() {
  const { user } = useAuth();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['my-subscription', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCancelSubscription = async () => {
    toast.info('Cancellation flow will be implemented');
  };

  const handleResumeSubscription = async () => {
    toast.info('Resume flow will be implemented');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Crown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No Active Subscription</h3>
          <p className="text-muted-foreground mb-4">
            Subscribe to a plan to unlock premium features
          </p>
          <Button>View Plans</Button>
        </CardContent>
      </Card>
    );
  }

  const plan = subscription.subscription_plans;
  const periodEnd = new Date(subscription.current_period_end);
  const daysRemaining = differenceInDays(periodEnd, new Date());
  const isExpired = !isAfter(periodEnd, new Date());
  const progressPercent = subscription.status === 'active' ? Math.max(0, Math.min(100, (daysRemaining / 30) * 100)) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            My Subscription
          </span>
          <Badge className={SUBSCRIPTION_STATUS_COLORS[subscription.status as SubscriptionStatus]}>
            {subscription.status}
          </Badge>
        </CardTitle>
        <CardDescription>Manage your subscription and billing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan */}
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">{plan?.name || 'Unknown Plan'}</h3>
              <p className="text-sm text-muted-foreground">{plan?.description}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {formatCurrency(plan?.price || 0, plan?.currency)}
              </p>
              <p className="text-xs text-muted-foreground">per {plan?.billing_interval}</p>
            </div>
          </div>

          {subscription.status === 'active' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Days remaining</span>
                <span className="font-medium">{daysRemaining} days</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}
        </div>

        {/* Billing Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Started</p>
            <p className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(new Date(subscription.started_at), 'dd MMM yyyy')}
            </p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">
              {subscription.status === 'cancelled' ? 'Ends on' : 'Renews on'}
            </p>
            <p className="font-medium flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" />
              {format(periodEnd, 'dd MMM yyyy')}
            </p>
          </div>
        </div>

        {/* Auto-renew Status */}
        {subscription.status === 'active' && (
          <div className={`p-4 rounded-lg border ${subscription.auto_renew ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
            {subscription.auto_renew ? (
              <p className="text-sm text-green-800">
                ✓ Your subscription will auto-renew on {format(periodEnd, 'dd MMM yyyy')}
              </p>
            ) : (
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Auto-renew is off. Your subscription will expire on {format(periodEnd, 'dd MMM yyyy')}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {subscription.status === 'active' && (
            <>
              <Button variant="outline" onClick={handleCancelSubscription}>
                Cancel Subscription
              </Button>
              <Button>Change Plan</Button>
            </>
          )}
          {subscription.status === 'cancelled' && !isExpired && (
            <Button onClick={handleResumeSubscription}>
              Resume Subscription
            </Button>
          )}
          {(subscription.status === 'expired' || isExpired) && (
            <Button>Renew Subscription</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
