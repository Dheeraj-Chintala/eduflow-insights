import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Users, TrendingUp, Wallet, Building2, Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { FranchiseRevenueData, TimeRange } from '@/types/analytics';

interface FranchiseRevenueReportProps {
  timeRange: TimeRange;
}

export default function FranchiseRevenueReport({ timeRange }: FranchiseRevenueReportProps) {
  const [franchises, setFranchises] = useState<FranchiseRevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalFranchises: 0,
    totalSales: 0,
    totalCommission: 0,
    pendingPayouts: 0,
    avgConversionRate: 0,
  });

  useEffect(() => {
    fetchFranchiseData();
  }, [timeRange]);

  const getDateFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case '7d': return new Date(now.setDate(now.getDate() - 7));
      case '30d': return new Date(now.setDate(now.getDate() - 30));
      case '90d': return new Date(now.setDate(now.getDate() - 90));
      case '1y': return new Date(now.setFullYear(now.getFullYear() - 1));
      default: return null;
    }
  };

  const fetchFranchiseData = async () => {
    try {
      setLoading(true);
      const dateFilter = getDateFilter();

      // Get all franchises
      const { data: franchisesData } = await supabase
        .from('franchises')
        .select('id, business_name, franchise_type, status');

      if (!franchisesData || franchisesData.length === 0) {
        setFranchises([]);
        setLoading(false);
        return;
      }

      const franchiseIds = franchisesData.map(f => f.id);

      // Get franchise sales
      let salesQuery = supabase
        .from('franchise_sales')
        .select('franchise_id, sale_amount, commission_amount')
        .in('franchise_id', franchiseIds);
      
      if (dateFilter) {
        salesQuery = salesQuery.gte('created_at', dateFilter.toISOString());
      }
      const { data: sales } = await salesQuery;

      // Get franchise leads
      let leadsQuery = supabase
        .from('franchise_leads')
        .select('franchise_id, status')
        .in('franchise_id', franchiseIds);
      
      if (dateFilter) {
        leadsQuery = leadsQuery.gte('created_at', dateFilter.toISOString());
      }
      const { data: leads } = await leadsQuery;

      // Get payouts
      const { data: payouts } = await supabase
        .from('commission_payouts')
        .select('franchise_id, total_commission, status')
        .in('franchise_id', franchiseIds);

      // Process franchise data
      const franchiseStats: FranchiseRevenueData[] = franchisesData.map(franchise => {
        const franchiseSales = sales?.filter(s => s.franchise_id === franchise.id) || [];
        const franchiseLeads = leads?.filter(l => l.franchise_id === franchise.id) || [];
        const franchisePayouts = payouts?.filter(p => p.franchise_id === franchise.id) || [];

        const totalSales = franchiseSales.reduce((sum, s) => sum + (s.sale_amount || 0), 0);
        const totalCommission = franchiseSales.reduce((sum, s) => sum + (s.commission_amount || 0), 0);
        const paidCommission = franchisePayouts
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + (p.total_commission || 0), 0);
        const pendingPayout = franchisePayouts
          .filter(p => p.status === 'pending' || p.status === 'processing')
          .reduce((sum, p) => sum + (p.total_commission || 0), 0);

        const totalLeads = franchiseLeads.length;
        const convertedLeads = franchiseLeads.filter(l => l.status === 'converted').length;
        const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

        return {
          franchiseId: franchise.id,
          franchiseName: franchise.business_name,
          franchiseType: franchise.franchise_type,
          totalSales,
          totalCommission,
          pendingPayout,
          paidCommission,
          studentCount: franchiseSales.length,
          conversionRate,
        };
      });

      // Sort by total sales
      const sortedFranchises = franchiseStats.sort((a, b) => b.totalSales - a.totalSales);
      setFranchises(sortedFranchises);

      // Calculate summary
      setSummary({
        totalFranchises: sortedFranchises.length,
        totalSales: sortedFranchises.reduce((sum, f) => sum + f.totalSales, 0),
        totalCommission: sortedFranchises.reduce((sum, f) => sum + f.totalCommission, 0),
        pendingPayouts: sortedFranchises.reduce((sum, f) => sum + f.pendingPayout, 0),
        avgConversionRate: sortedFranchises.length > 0
          ? Math.round(sortedFranchises.reduce((sum, f) => sum + f.conversionRate, 0) / sortedFranchises.length)
          : 0,
      });
    } catch (error) {
      console.error('Error fetching franchise data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFranchiseTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      franchise: { label: 'Franchise', variant: 'default' },
      distributor: { label: 'Distributor', variant: 'secondary' },
      super_distributor: { label: 'Super Distributor', variant: 'default' },
      affiliate: { label: 'Affiliate', variant: 'outline' },
    };
    const config = typeMap[type] || { label: type, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const summaryCards = [
    { label: 'Total Partners', value: summary.totalFranchises, icon: Building2, color: 'text-primary' },
    { label: 'Total Sales', value: `₹${summary.totalSales.toLocaleString()}`, icon: DollarSign, color: 'text-success' },
    { label: 'Total Commission', value: `₹${summary.totalCommission.toLocaleString()}`, icon: TrendingUp, color: 'text-accent' },
    { label: 'Pending Payouts', value: `₹${summary.pendingPayouts.toLocaleString()}`, icon: Wallet, color: 'text-warning' },
    { label: 'Avg. Conversion', value: `${summary.avgConversionRate}%`, icon: Percent, color: 'text-info' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {summaryCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Franchise Revenue Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Partner Revenue Overview
          </CardTitle>
          <CardDescription>Revenue and performance metrics for all partners</CardDescription>
        </CardHeader>
        <CardContent>
          {franchises.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No partner data available</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-center">Students</TableHead>
                  <TableHead>Conversion Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {franchises.map((franchise) => (
                  <TableRow key={franchise.franchiseId}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {franchise.franchiseName}
                    </TableCell>
                    <TableCell>{getFranchiseTypeBadge(franchise.franchiseType)}</TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{franchise.totalSales.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-success">
                      ₹{franchise.totalCommission.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-warning">
                      ₹{franchise.pendingPayout.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">{franchise.studentCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={franchise.conversionRate} className="w-16 h-2" />
                        <span className="text-sm text-muted-foreground">{franchise.conversionRate}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
