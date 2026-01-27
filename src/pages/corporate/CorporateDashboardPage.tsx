import React from 'react';
import AppLayout from '@/layouts/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CorporateTrainingManager } from '@/components/corporate/CorporateTrainingManager';
import { FeatureTogglePanel } from '@/components/settings/FeatureTogglePanel';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Building2, Settings, Users, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const CorporateDashboardPage: React.FC = () => {
  const { user, primaryRole, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  // Only allow corporate_hr, admin, or super_admin
  if (!['corporate_hr', 'admin', 'super_admin'].includes(primaryRole || '')) {
    return (
      <AppLayout>
        <div className="container mx-auto py-12 text-center">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
          <p className="text-muted-foreground">
            Corporate LMS features are only available to authorized administrators.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8 text-blue-500" />
            Corporate LMS Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage training programs, feature settings, and employee learning
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Programs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Enrollments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">9</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="programs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="programs" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Training Programs
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Feature Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="programs">
            <CorporateTrainingManager />
          </TabsContent>

          <TabsContent value="settings">
            <FeatureTogglePanel />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default CorporateDashboardPage;
