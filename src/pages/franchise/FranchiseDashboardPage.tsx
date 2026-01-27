import AppLayout from '@/layouts/AppLayout';
import FranchiseDashboard from '@/components/franchise/FranchiseDashboard';

export default function FranchiseDashboardPage() {
  return (
    <AppLayout>
      <div className="container py-6">
        <FranchiseDashboard />
      </div>
    </AppLayout>
  );
}
