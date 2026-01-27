import AppLayout from '@/layouts/AppLayout';
import FranchiseAdminPanel from '@/components/franchise/FranchiseAdminPanel';

export default function FranchiseAdminPage() {
  return (
    <AppLayout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Partner Management</h1>
          <p className="text-muted-foreground">Manage franchises, affiliates, and resellers</p>
        </div>
        <FranchiseAdminPanel />
      </div>
    </AppLayout>
  );
}
