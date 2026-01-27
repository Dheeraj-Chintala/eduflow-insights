import AppLayout from '@/layouts/AppLayout';
import PlacementReports from '@/components/jobs/PlacementReports';

export default function PlacementReportsPage() {
  return (
    <AppLayout>
      <div className="container py-6">
        <PlacementReports />
      </div>
    </AppLayout>
  );
}
