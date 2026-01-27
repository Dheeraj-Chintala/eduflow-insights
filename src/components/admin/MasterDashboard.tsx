import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  Building2,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Activity,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import type { SystemStats } from '@/types/admin';

export default function MasterDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    pendingApprovals: 0,
    totalCourses: 0,
    pendingModeration: 0,
    totalRevenue: 0,
    activeEnrollments: 0,
    totalFranchises: 0,
    totalEmployers: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch counts in parallel
      const [
        usersResult,
        approvalsResult,
        coursesResult,
        moderationResult,
        enrollmentsResult,
        franchisesResult,
        employersResult,
        activityResult
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('user_approval_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('content_moderation_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('enrollments').select('id', { count: 'exact', head: true }).is('completed_at', null),
        supabase.from('franchises').select('id', { count: 'exact', head: true }),
        supabase.from('employers').select('id', { count: 'exact', head: true }),
        supabase.from('admin_activity_logs').select('*').order('created_at', { ascending: false }).limit(10)
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        pendingApprovals: approvalsResult.count || 0,
        totalCourses: coursesResult.count || 0,
        pendingModeration: moderationResult.count || 0,
        totalRevenue: 0, // Would need to aggregate from payments
        activeEnrollments: enrollmentsResult.count || 0,
        totalFranchises: franchisesResult.count || 0,
        totalEmployers: employersResult.count || 0
      });

      setRecentActivity(activityResult.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { title: 'Pending Approvals', value: stats.pendingApprovals, icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    { title: 'Total Courses', value: stats.totalCourses, icon: BookOpen, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { title: 'Pending Moderation', value: stats.pendingModeration, icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-500/10' },
    { title: 'Active Enrollments', value: stats.activeEnrollments, icon: TrendingUp, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { title: 'Franchises', value: stats.totalFranchises, icon: Building2, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
    { title: 'Employers', value: stats.totalEmployers, icon: Building2, color: 'text-teal-500', bgColor: 'bg-teal-500/10' },
    { title: 'System Health', value: 'Good', icon: Shield, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', isText: true }
  ];

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'approve_user':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'reject_user':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'moderate_content':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Master Dashboard</h1>
          <p className="text-muted-foreground">Complete system overview and management</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">
                    {stat.isText ? stat.value : stat.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/admin/users">
                <Users className="h-4 w-4 mr-2" />
                Manage User Approvals
                {stats.pendingApprovals > 0 && (
                  <Badge variant="destructive" className="ml-auto">{stats.pendingApprovals}</Badge>
                )}
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/admin/moderation">
                <Shield className="h-4 w-4 mr-2" />
                Content Moderation
                {stats.pendingModeration > 0 && (
                  <Badge variant="destructive" className="ml-auto">{stats.pendingModeration}</Badge>
                )}
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/admin/pricing">
                <DollarSign className="h-4 w-4 mr-2" />
                Pricing & Commissions
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/admin/config">
                <Activity className="h-4 w-4 mr-2" />
                System Configuration
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Admin Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    {getActivityIcon(activity.action_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.action_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.target_type && `${activity.target_type} • `}
                        {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
