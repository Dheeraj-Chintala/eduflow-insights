import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { CreditCard, Download, RotateCcw, Eye, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import type { PaymentStatus } from '@/types/payments';
import { PAYMENT_STATUS_COLORS } from '@/types/payments';

export default function PaymentHistory() {
  const { user } = useAuth();
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);

  const { data: payments, isLoading, refetch } = useQuery({
    queryKey: ['payment-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          courses(title),
          course_bundles(title)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleRefundRequest = async () => {
    if (!selectedPayment || !refundReason.trim()) {
      toast.error('Please provide a reason for the refund');
      return;
    }

    try {
      const { error } = await supabase.from('refunds').insert({
        payment_id: selectedPayment.id,
        user_id: user?.id,
        org_id: selectedPayment.org_id,
        amount: selectedPayment.amount,
        reason: refundReason,
      });

      if (error) throw error;

      toast.success('Refund request submitted successfully');
      setIsRefundDialogOpen(false);
      setRefundReason('');
      setSelectedPayment(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit refund request');
    }
  };

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
            {[1, 2, 3].map((i) => (
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
          <CreditCard className="h-5 w-5" />
          Payment History
        </CardTitle>
        <CardDescription>View all your payment transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {payments && payments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment: any) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {format(new Date(payment.created_at), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    {payment.courses?.title || payment.course_bundles?.title || payment.purchase_type}
                  </TableCell>
                  <TableCell className="capitalize">
                    {payment.payment_method || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(payment.amount, payment.currency)}
                    {payment.discount_amount > 0 && (
                      <span className="text-xs text-green-600 block">
                        -{formatCurrency(payment.discount_amount, payment.currency)} discount
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={PAYMENT_STATUS_COLORS[payment.status as PaymentStatus]}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" title="View Details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Download Invoice">
                        <Receipt className="h-4 w-4" />
                      </Button>
                      {payment.status === 'completed' && (
                        <Dialog open={isRefundDialogOpen && selectedPayment?.id === payment.id} onOpenChange={(open) => {
                          setIsRefundDialogOpen(open);
                          if (!open) {
                            setSelectedPayment(null);
                            setRefundReason('');
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Request Refund"
                              onClick={() => setSelectedPayment(payment)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Request Refund</DialogTitle>
                              <DialogDescription>
                                Request a refund for {formatCurrency(payment.amount, payment.currency)}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Reason for refund</label>
                                <Textarea
                                  value={refundReason}
                                  onChange={(e) => setRefundReason(e.target.value)}
                                  placeholder="Please explain why you are requesting a refund..."
                                  rows={4}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleRefundRequest}>
                                  Submit Request
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No payment history found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
