import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { RotateCcw } from 'lucide-react';
import { REFUND_STATUS_COLORS, RefundStatus } from '@/types/payments';

export default function RefundRequests() {
  const { user } = useAuth();

  const { data: refunds, isLoading } = useQuery({
    queryKey: ['user-refunds', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('refunds')
        .select(`
          *,
          payment_transactions(amount, currency, purchase_type, courses(title))
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5" />
          Refund Requests
        </CardTitle>
        <CardDescription>Track the status of your refund requests</CardDescription>
      </CardHeader>
      <CardContent>
        {refunds && refunds.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refunds.map((refund: any) => (
                <TableRow key={refund.id}>
                  <TableCell>
                    {format(new Date(refund.created_at), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    {refund.payment_transactions?.courses?.title ||
                      refund.payment_transactions?.purchase_type ||
                      'N/A'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(refund.amount)}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={refund.reason}>
                    {refund.reason}
                  </TableCell>
                  <TableCell>
                    <Badge className={REFUND_STATUS_COLORS[refund.status as RefundStatus]}>
                      {refund.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    {refund.status === 'rejected' && refund.rejection_reason && (
                      <span className="text-sm text-red-600">{refund.rejection_reason}</span>
                    )}
                    {refund.status === 'completed' && refund.refund_method && (
                      <span className="text-sm text-green-600 capitalize">
                        Refunded to {refund.refund_method.replace('_', ' ')}
                      </span>
                    )}
                    {refund.status === 'processing' && (
                      <span className="text-sm text-blue-600">Under review</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No refund requests</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
