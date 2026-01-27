import AppLayout from '@/layouts/AppLayout';
import SubscriptionPlans from '@/components/payments/SubscriptionPlans';

export default function SubscriptionPlansPage() {
  return (
    <AppLayout>
      <div className="container py-6">
        <SubscriptionPlans />
      </div>
    </AppLayout>
  );
}
