import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/layouts/AppLayout';
import { CertificateManager } from '@/components/certificates/CertificateManager';

export default function AdminCertificates() {
  const { primaryRole, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  // Check if user has permission to manage certificates
  const allowedRoles = ['super_admin', 'admin', 'sub_admin', 'trainer'];
  if (!primaryRole || !allowedRoles.includes(primaryRole)) {
    navigate('/dashboard');
    return null;
  }

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display">Certificate Management</h1>
          <p className="text-muted-foreground mt-1">
            Issue, manage, and verify certificates and letters of recommendation
          </p>
        </div>

        <CertificateManager />
      </div>
    </AppLayout>
  );
}
