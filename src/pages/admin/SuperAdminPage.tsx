import { useState } from 'react';
import AppLayout from '@/layouts/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OrganizationsDashboard from '@/components/superadmin/OrganizationsDashboard';
import OrganizationAdmins from '@/components/superadmin/OrganizationAdmins';
import { Building2, Shield } from 'lucide-react';

export default function SuperAdminPage() {
  const { isLoading, primaryRole } = useAuth();
  const [activeTab, setActiveTab] = useState('organizations');

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  // Only super_admin can access this page
  if (primaryRole !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const tabs = [
    {
      id: 'organizations',
      label: 'Organizations',
      icon: Building2,
      component: OrganizationsDashboard,
    },
    {
      id: 'admins',
      label: 'Organization Admins',
      icon: Shield,
      component: OrganizationAdmins,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Super Admin</h1>
          <p className="text-muted-foreground mt-1">
            Manage organizations and their administrators
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 px-4 py-2"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              <tab.component />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppLayout>
  );
}
