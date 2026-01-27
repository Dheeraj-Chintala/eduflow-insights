import { useState, useEffect } from 'react';
import { fromTable } from '@/lib/supabase-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import type { CommissionPayout, PayoutStatus } from '@/types/franchise';

const STATUS_CONFIG: Record<PayoutStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  processing: { label: 'Processing', variant: 'default' },
  completed: { label: 'Completed', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
};

interface PayoutHistoryProps {
  franchiseId: string;
}

export default function PayoutHistory({ franchiseId }: PayoutHistoryProps) {
  const [payouts, setPayouts] = useState<CommissionPayout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayouts();
  }, [franchiseId]);

  async function fetchPayouts() {
    setLoading(true);
    const { data, error } = await fromTable('commission_payouts')
      .select('*')
      .eq('franchise_id', franchiseId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPayouts(data as CommissionPayout[]);
    }
    setLoading(false);
  }

  const totalPending = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.net_payout), 0);

  const totalPaid = payouts
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.net_payout), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payout History</CardTitle>
        <CardDescription>Your commission payouts and payment history</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending Payouts</p>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              ₹{totalPending.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">Total Received</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              ₹{totalPaid.toLocaleString()}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse h-12 bg-muted rounded" />
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No payout history yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Payout</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map(payout => (
                <TableRow key={payout.id}>
                  <TableCell>
                    {format(new Date(payout.payout_period_start), 'MMM d')} - {format(new Date(payout.payout_period_end), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{Number(payout.total_sales).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{Number(payout.total_commission).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {payout.deductions > 0 ? `-₹${Number(payout.deductions).toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ₹{Number(payout.net_payout).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_CONFIG[payout.status].variant}>
                      {STATUS_CONFIG[payout.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {payout.paid_at 
                      ? format(new Date(payout.paid_at), 'MMM d, yyyy')
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
