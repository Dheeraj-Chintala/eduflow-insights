import { useState } from 'react';
import AppLayout from '@/layouts/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, TrendingDown, Award, Network, Filter } from 'lucide-react';
import StudentProgressReport from '@/components/analytics/StudentProgressReport';
import DropOffAnalysis from '@/components/analytics/DropOffAnalysis';
import TrainerPerformance from '@/components/analytics/TrainerPerformance';
import FranchiseRevenueReport from '@/components/analytics/FranchiseRevenueReport';
import FunnelAnalytics from '@/components/analytics/FunnelAnalytics';
import ExportButton, { exportToExcel } from '@/components/analytics/ExportButton';
import type { TimeRange } from '@/types/analytics';

export default function AdminAnalyticsPage() {
  const { isLoading, primaryRole } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [activeTab, setActiveTab] = useState('students');

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!primaryRole || !['super_admin', 'admin', 'sub_admin'].includes(primaryRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (format === 'excel') {
      // Export current tab data as CSV
      const data = [{ report: activeTab, exportedAt: new Date().toISOString(), timeRange }];
      exportToExcel(data, ['report', 'exportedAt', 'timeRange'], `analytics-${activeTab}-${timeRange}`);
    } else {
      // For PDF, print the current view
      window.print();
    }
  };

  const tabs = [
    { id: 'students', label: 'Student Progress', icon: Users },
    { id: 'dropoff', label: 'Drop-off Analysis', icon: TrendingDown },
    { id: 'trainers', label: 'Trainer Performance', icon: Award },
    { id: 'franchise', label: 'Partner Revenue', icon: Network },
    { id: 'funnel', label: 'Conversion Funnel', icon: Filter },
  ];

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
    { value: 'all', label: 'All time' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive insights and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ExportButton onExport={handleExport} />
          </div>
        </div>

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 py-3"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div id="analytics-content">
            <TabsContent value="students" className="mt-0">
              <StudentProgressReport timeRange={timeRange} />
            </TabsContent>

            <TabsContent value="dropoff" className="mt-0">
              <DropOffAnalysis timeRange={timeRange} />
            </TabsContent>

            <TabsContent value="trainers" className="mt-0">
              <TrainerPerformance timeRange={timeRange} />
            </TabsContent>

            <TabsContent value="franchise" className="mt-0">
              <FranchiseRevenueReport timeRange={timeRange} />
            </TabsContent>

            <TabsContent value="funnel" className="mt-0">
              <FunnelAnalytics timeRange={timeRange} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Quick Stats Summary */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="text-lg">Need More Insights?</CardTitle>
            <CardDescription>
              Select different time ranges or tabs to explore detailed analytics for your platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 rounded-lg bg-card">
                <p className="text-2xl font-bold text-primary">Real-time</p>
                <p className="text-sm text-muted-foreground">Data updates</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-card">
                <p className="text-2xl font-bold text-accent">5 Reports</p>
                <p className="text-sm text-muted-foreground">Available dashboards</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-card">
                <p className="text-2xl font-bold text-success">Excel & PDF</p>
                <p className="text-sm text-muted-foreground">Export formats</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
