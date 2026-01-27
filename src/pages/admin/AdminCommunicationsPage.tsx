import AppLayout from '@/layouts/AppLayout';
import CommunicationDashboard from '@/components/notifications/CommunicationDashboard';

export default function AdminCommunicationsPage() {
  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Communications</h1>
          <p className="text-muted-foreground">Manage notifications, campaigns, and announcements</p>
        </div>
        <CommunicationDashboard />
      </div>
    </AppLayout>
  );
}
