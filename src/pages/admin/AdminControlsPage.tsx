import { useState } from 'react';
import AppLayout from '@/layouts/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MasterDashboard from '@/components/admin/MasterDashboard';
import UserApprovals from '@/components/admin/UserApprovals';
import ContentModeration from '@/components/admin/ContentModeration';
import PricingControls from '@/components/admin/PricingControls';
import SystemConfiguration from '@/components/admin/SystemConfiguration';
import AuditLogs from '@/components/admin/AuditLogs';
import BackupRecovery from '@/components/admin/BackupRecovery';
import {
  LayoutDashboard,
  Users,
  Shield,
  DollarSign,
  Settings,
  FileText,
  Database
} from 'lucide-react';

export default function AdminControlsPage() {
  const { isLoading, primaryRole } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!primaryRole || !['super_admin', 'admin'].includes(primaryRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  const isSuperAdmin = primaryRole === 'super_admin';

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: MasterDashboard },
    { id: 'approvals', label: 'User Approvals', icon: Users, component: UserApprovals },
    { id: 'moderation', label: 'Content Moderation', icon: Shield, component: ContentModeration },
    { id: 'pricing', label: 'Pricing & Commissions', icon: DollarSign, component: PricingControls },
    { id: 'config', label: 'System Config', icon: Settings, component: SystemConfiguration, superAdminOnly: true },
    { id: 'audit', label: 'Audit Logs', icon: FileText, component: AuditLogs },
    { id: 'backup', label: 'Backup & Recovery', icon: Database, component: BackupRecovery, superAdminOnly: true },
  ];

  const visibleTabs = tabs.filter(tab => !tab.superAdminOnly || isSuperAdmin);

  return (
    <AppLayout>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            {visibleTabs.map(tab => (
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

          {visibleTabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              <tab.component />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppLayout>
  );
}
