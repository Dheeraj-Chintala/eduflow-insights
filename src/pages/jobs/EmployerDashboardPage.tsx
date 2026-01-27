import AppLayout from '@/layouts/AppLayout';
import EmployerDashboard from '@/components/jobs/EmployerDashboard';

export default function EmployerDashboardPage() {
  return (
    <AppLayout>
      <div className="container py-6">
        <EmployerDashboard />
      </div>
    </AppLayout>
  );
}
