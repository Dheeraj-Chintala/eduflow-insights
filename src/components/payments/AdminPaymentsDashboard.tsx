import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  RotateCcw,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { PAYMENT_STATUS_COLORS, REFUND_STATUS_COLORS, PaymentStatus, RefundStatus } from '@/types/payments';

export default function AdminPaymentsDashboard() {
  const [refundStatusFilter, setRefundStatusFilter] = useState<string>('all');

  // Fetch payment stats
  const { data: stats } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: async () => {
      const { data: payments, error } = await supabase
        .from('payment_transactions')
        .select('amount, status, created_at');

      if (error) throw error;

      const totalRevenue = payments
        ?.filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;

      const totalTransactions = payments?.length || 0;
      const successfulTransactions = payments?.filter((p: any) => p.status === 'completed').length || 0;

      // This month's revenue
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthRevenue = payments
        ?.filter((p: any) => p.status === 'completed' && new Date(p.created_at) >= thisMonth)
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;

      return {
        totalRevenue,
        totalTransactions,
        successfulTransactions,
        thisMonthRevenue,
        successRate: totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0,
      };
    },
  });

  // Fetch recent transactions
  const { data: recentTransactions } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          courses(title),
          profiles!payment_transactions_user_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  // Fetch refund requests
  const { data: refundRequests, refetch: refetchRefunds } = useQuery({
    queryKey: ['admin-refunds', refundStatusFilter],
    queryFn: async () => {
      let query = supabase
        .from('refunds')
        .select(`
          *,
          payment_transactions(amount, currency, courses(title)),
          profiles!refunds_user_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (refundStatusFilter !== 'all') {
        query = query.eq('status', refundStatusFilter as 'requested' | 'processing' | 'approved' | 'rejected' | 'completed');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleRefundAction = async (refundId: string, action: 'approved' | 'rejected', notes?: string) => {
    try {
      const { error } = await supabase
        .from('refunds')
        .update({
          status: action === 'approved' ? 'approved' : 'rejected',
          processed_at: new Date().toISOString(),
          admin_notes: notes,
          rejection_reason: action === 'rejected' ? notes : null,
        })
        .eq('id', refundId);

      if (error) throw error;

      toast.success(`Refund ${action} successfully`);
      refetchRefunds();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process refund');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{formatCurrency(stats?.thisMonthRevenue || 0)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{stats?.totalTransactions || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{stats?.successRate?.toFixed(1) || 0}%</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <ArrowUpRight className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="refunds">
            Refund Requests
            {refundRequests?.filter((r: any) => r.status === 'requested').length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {refundRequests?.filter((r: any) => r.status === 'requested').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>View all payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions?.map((txn: any) => (
                    <TableRow key={txn.id}>
                      <TableCell>{format(new Date(txn.created_at), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{txn.profiles?.full_name || 'Unknown'}</TableCell>
                      <TableCell>{txn.courses?.title || txn.purchase_type}</TableCell>
                      <TableCell className="capitalize">{txn.payment_method || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(txn.amount, txn.currency)}</TableCell>
                      <TableCell>
                        <Badge className={PAYMENT_STATUS_COLORS[txn.status as PaymentStatus]}>
                          {txn.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Refund Requests</CardTitle>
                  <CardDescription>Manage customer refund requests</CardDescription>
                </div>
                <Select value={refundStatusFilter} onValueChange={setRefundStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="requested">Requested</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refundRequests?.map((refund: any) => (
                    <TableRow key={refund.id}>
                      <TableCell>{format(new Date(refund.created_at), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{refund.profiles?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{refund.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {refund.payment_transactions?.courses?.title || 'N/A'}
                      </TableCell>
                      <TableCell>{formatCurrency(refund.amount)}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={refund.reason}>
                        {refund.reason}
                      </TableCell>
                      <TableCell>
                        <Badge className={REFUND_STATUS_COLORS[refund.status as RefundStatus]}>
                          {refund.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {refund.status === 'requested' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => handleRefundAction(refund.id, 'approved')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleRefundAction(refund.id, 'rejected', 'Refund policy not applicable')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
