import { useState, useEffect } from 'react';
import { fromTable } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, DollarSign, TrendingUp, Target, BarChart3, Building2, Gift } from 'lucide-react';
import { format } from 'date-fns';
import type { Franchise, FranchiseSale, FranchiseLead, CommissionPayout } from '@/types/franchise';
import { FRANCHISE_STATUS_LABELS, FRANCHISE_TYPE_LABELS } from '@/types/franchise';
import LeadManager from './LeadManager';
import ReferralManager from './ReferralManager';
import PayoutHistory from './PayoutHistory';

interface FranchiseStats {
  totalStudents: number;
  totalSales: number;
  totalCommission: number;
  pendingPayout: number;
  activeLeads: number;
  conversionRate: number;
}

export default function FranchiseDashboard() {
  const { user } = useAuth();
  const [franchise, setFranchise] = useState<Franchise | null>(null);
  const [stats, setStats] = useState<FranchiseStats | null>(null);
  const [recentSales, setRecentSales] = useState<FranchiseSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFranchiseData();
    }
  }, [user]);

  async function fetchFranchiseData() {
    if (!user) return;

    setLoading(true);

    // Fetch franchise profile
    const { data: franchiseData } = await fromTable('franchises')
      .select('*, branding:franchise_branding(*)')
      .eq('user_id', user.id)
      .single();

    if (franchiseData) {
      setFranchise(franchiseData as Franchise);

      // Fetch stats
      const [studentsRes, salesRes, leadsRes, payoutsRes] = await Promise.all([
        fromTable('franchise_students').select('id', { count: 'exact' }).eq('franchise_id', franchiseData.id),
        fromTable('franchise_sales').select('*').eq('franchise_id', franchiseData.id),
        fromTable('franchise_leads').select('status').eq('franchise_id', franchiseData.id),
        fromTable('commission_payouts').select('*').eq('franchise_id', franchiseData.id).eq('status', 'pending'),
      ]);

      const sales = (salesRes.data || []) as FranchiseSale[];
      const leads = (leadsRes.data || []) as FranchiseLead[];
      const pendingPayouts = (payoutsRes.data || []) as CommissionPayout[];

      const totalSales = sales.reduce((sum, s) => sum + Number(s.sale_amount), 0);
      const totalCommission = sales.reduce((sum, s) => sum + Number(s.commission_amount), 0);
      const pendingPayout = pendingPayouts.reduce((sum, p) => sum + Number(p.net_payout), 0);
      const convertedLeads = leads.filter(l => l.status === 'converted').length;
      const activeLeads = leads.filter(l => ['new', 'contacted', 'qualified'].includes(l.status)).length;

      setStats({
        totalStudents: studentsRes.count || 0,
        totalSales,
        totalCommission,
        pendingPayout,
        activeLeads,
        conversionRate: leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0,
      });

      // Fetch recent sales
      const { data: recentSalesData } = await fromTable('franchise_sales')
        .select('*')
        .eq('franchise_id', franchiseData.id)
        .order('sale_date', { ascending: false })
        .limit(5);

      if (recentSalesData) {
        setRecentSales(recentSalesData as FranchiseSale[]);
      }
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!franchise) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Franchise Profile</h2>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            You don't have a franchise profile yet. Contact admin to set up your franchise account.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {franchise.branding?.logo_url ? (
                <img 
                  src={franchise.branding.logo_url} 
                  alt={franchise.business_name}
                  className="h-16 w-16 rounded-lg object-contain"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{franchise.business_name}</h2>
                  <Badge variant={franchise.status === 'approved' ? 'default' : 'secondary'}>
                    {FRANCHISE_STATUS_LABELS[franchise.status]}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {FRANCHISE_TYPE_LABELS[franchise.franchise_type]} • Code: {franchise.franchise_code}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">{stats.totalStudents}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Students</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">₹{stats.totalSales.toLocaleString()}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Total Sales</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <span className="text-2xl font-bold">₹{stats.totalCommission.toLocaleString()}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Total Earnings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">₹{stats.pendingPayout.toLocaleString()}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Pending Payout</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                <span className="text-2xl font-bold">{stats.activeLeads}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Active Leads</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-500" />
                <span className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Conversion Rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Recent Sales</TabsTrigger>
          <TabsTrigger value="leads">Lead Management</TabsTrigger>
          <TabsTrigger value="referrals">Referral Codes</TabsTrigger>
          <TabsTrigger value="payouts">Payout History</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>Your latest enrollments and commissions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentSales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sales yet
                </div>
              ) : (
                <div className="space-y-4">
                  {recentSales.map(sale => (
                    <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Sale #{sale.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(sale.sale_date), 'MMM d, yyyy')}
                          {sale.referral_code && ` • Ref: ${sale.referral_code}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{Number(sale.sale_amount).toLocaleString()}</p>
                        <p className="text-sm text-green-600">
                          Commission: ₹{Number(sale.commission_amount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="mt-6">
          <LeadManager franchiseId={franchise.id} />
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <ReferralManager franchiseId={franchise.id} />
        </TabsContent>

        <TabsContent value="payouts" className="mt-6">
          <PayoutHistory franchiseId={franchise.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
