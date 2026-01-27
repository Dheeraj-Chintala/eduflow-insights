import { useState, useEffect } from 'react';
import { fromTable } from '@/lib/supabase-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Building2, Users, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface PlacementStats {
  total_applications: number;
  shortlisted: number;
  interviews_conducted: number;
  selected: number;
  rejected: number;
  pending: number;
  placement_rate: number;
}

interface EmployerStats {
  employer_id: string;
  company_name: string;
  total_jobs: number;
  total_applications: number;
  selected: number;
}

export default function PlacementReports() {
  const [stats, setStats] = useState<PlacementStats | null>(null);
  const [employerStats, setEmployerStats] = useState<EmployerStats[]>([]);
  const [recentPlacements, setRecentPlacements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  async function fetchStats() {
    setLoading(true);

    // Fetch application counts by status
    const { data: applications } = await fromTable('job_applications')
      .select('status, applied_at')
      .gte('applied_at', new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString());

    if (applications) {
      const statusCounts = applications.reduce((acc: Record<string, number>, app: any) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {});

      const total = applications.length;
      const selected = statusCounts['selected'] || 0;

      setStats({
        total_applications: total,
        shortlisted: statusCounts['shortlisted'] || 0,
        interviews_conducted: statusCounts['interview_scheduled'] || 0,
        selected,
        rejected: statusCounts['rejected'] || 0,
        pending: statusCounts['pending'] || 0,
        placement_rate: total > 0 ? (selected / total) * 100 : 0,
      });
    }

    // Fetch employer-wise stats
    const { data: employers } = await fromTable('employers')
      .select('id, company_name');

    if (employers) {
      const employerStatsPromises = employers.map(async (employer: any) => {
        const { data: jobs } = await fromTable('job_postings')
          .select('id')
          .eq('employer_id', employer.id);

        const jobIds = jobs?.map((j: any) => j.id) || [];

        if (jobIds.length === 0) {
          return {
            employer_id: employer.id,
            company_name: employer.company_name,
            total_jobs: 0,
            total_applications: 0,
            selected: 0,
          };
        }

        const { data: appData } = await fromTable('job_applications')
          .select('status')
          .in('job_id', jobIds);

        return {
          employer_id: employer.id,
          company_name: employer.company_name,
          total_jobs: jobIds.length,
          total_applications: appData?.length || 0,
          selected: appData?.filter((a: any) => a.status === 'selected').length || 0,
        };
      });

      const results = await Promise.all(employerStatsPromises);
      setEmployerStats(results.filter(e => e.total_applications > 0));
    }

    // Fetch recent placements
    const { data: placements } = await fromTable('placements')
      .select(`
        *,
        job:job_postings(title),
        employer:employers(company_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (placements) {
      setRecentPlacements(placements);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Placement Reports</h2>
          <p className="text-muted-foreground">Track placement performance and statistics</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">{stats.total_applications}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Total Applications</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{stats.selected}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Selected</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">{stats.rejected}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Rejected</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <span className="text-2xl font-bold">{stats.placement_rate.toFixed(1)}%</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Placement Rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Application Funnel */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Application Funnel</CardTitle>
            <CardDescription>Conversion at each stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Applications</span>
                  <span>{stats.total_applications}</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Shortlisted</span>
                  <span>{stats.shortlisted}</span>
                </div>
                <Progress 
                  value={stats.total_applications > 0 ? (stats.shortlisted / stats.total_applications) * 100 : 0} 
                  className="h-2" 
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Interviewed</span>
                  <span>{stats.interviews_conducted}</span>
                </div>
                <Progress 
                  value={stats.total_applications > 0 ? (stats.interviews_conducted / stats.total_applications) * 100 : 0} 
                  className="h-2" 
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Selected</span>
                  <span>{stats.selected}</span>
                </div>
                <Progress 
                  value={stats.total_applications > 0 ? (stats.selected / stats.total_applications) * 100 : 0} 
                  className="h-2" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employer-wise Stats */}
      {employerStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Employer-wise Statistics</CardTitle>
            <CardDescription>Performance breakdown by company</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-center">Jobs Posted</TableHead>
                  <TableHead className="text-center">Applications</TableHead>
                  <TableHead className="text-center">Selected</TableHead>
                  <TableHead className="text-center">Conversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employerStats.map(employer => (
                  <TableRow key={employer.employer_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {employer.company_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{employer.total_jobs}</TableCell>
                    <TableCell className="text-center">{employer.total_applications}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={employer.selected > 0 ? 'default' : 'secondary'}>
                        {employer.selected}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {employer.total_applications > 0 
                        ? `${((employer.selected / employer.total_applications) * 100).toFixed(1)}%`
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Placements */}
      {recentPlacements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Placements</CardTitle>
            <CardDescription>Latest successful placements</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Offered Salary</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPlacements.map(placement => (
                  <TableRow key={placement.id}>
                    <TableCell className="font-medium">{placement.job?.title}</TableCell>
                    <TableCell>{placement.employer?.company_name}</TableCell>
                    <TableCell>
                      <Badge variant={placement.status === 'joined' ? 'default' : 'secondary'}>
                        {placement.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {placement.offered_salary 
                        ? `${placement.salary_currency} ${placement.offered_salary.toLocaleString()}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(placement.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
