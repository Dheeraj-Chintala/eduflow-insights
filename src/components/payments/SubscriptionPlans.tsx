import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { toast } from 'sonner';

const PLAN_ICONS: Record<string, any> = {
  basic: Zap,
  pro: Star,
  premium: Crown,
};

export default function SubscriptionPlans() {
  const { user } = useAuth();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: userSubscription } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', user?.id)
        .eq('status', 'active')
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

  const formatInterval = (interval: string, count: number = 1) => {
    if (count === 1) {
      return interval === 'monthly' ? 'month' : interval === 'yearly' ? 'year' : interval;
    }
    return `${count} ${interval}`;
  };

  const handleSubscribe = async (planId: string) => {
    toast.info('Subscription flow will be integrated with payment gateway');
  };

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded w-1/2" />
                <div className="h-12 bg-muted rounded" />
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-4 bg-muted rounded" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Crown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No subscription plans available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-muted-foreground">Select a subscription that fits your learning goals</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan: any, index: number) => {
          const Icon = PLAN_ICONS[plan.name?.toLowerCase()] || Star;
          const isCurrentPlan = userSubscription?.plan_id === plan.id;
          const isPopular = index === 1;

          return (
            <Card
              key={plan.id}
              className={`relative ${isPopular ? 'border-primary shadow-lg' : ''} ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              {isCurrentPlan && (
                <Badge className="absolute -top-3 right-4 bg-green-500">
                  Current Plan
                </Badge>
              )}

              <CardHeader className="text-center pb-2">
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${isPopular ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-4xl font-bold">{formatCurrency(plan.price, plan.currency)}</span>
                  <span className="text-muted-foreground">/{formatInterval(plan.billing_interval, plan.billing_interval_count)}</span>
                </div>

                {plan.trial_days > 0 && (
                  <Badge variant="outline" className="mb-4">
                    {plan.trial_days}-day free trial
                  </Badge>
                )}

                <ul className="space-y-3 text-left">
                  {plan.includes_all_courses && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm">Access to all courses</span>
                    </li>
                  )}
                  {plan.max_courses && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm">Up to {plan.max_courses} courses</span>
                    </li>
                  )}
                  {Array.isArray(plan.features) && plan.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={isPopular ? 'default' : 'outline'}
                  disabled={isCurrentPlan}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {isCurrentPlan ? 'Current Plan' : 'Subscribe'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
