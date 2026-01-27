import AppLayout from '@/layouts/AppLayout';
import AdminPaymentsDashboard from '@/components/payments/AdminPaymentsDashboard';

export default function AdminPaymentsPage() {
  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payments Management</h1>
          <p className="text-muted-foreground">Monitor revenue, transactions, and refund requests</p>
        </div>
        <AdminPaymentsDashboard />
      </div>
    </AppLayout>
  );
}
