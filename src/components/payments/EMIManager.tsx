import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format, isPast, isToday } from 'date-fns';
import { CreditCard, CalendarDays, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { EMIStatus } from '@/types/payments';

const EMI_STATUS_COLORS: Record<EMIStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  defaulted: 'bg-gray-100 text-gray-800',
};

export default function EMIManager() {
  const { user } = useAuth();

  const { data: userEmis, isLoading } = useQuery({
    queryKey: ['user-emis', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_emi')
        .select(`
          *,
          emi_plans(*),
          courses(title),
          course_bundles(title),
          emi_installments(*)
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

  const handlePayInstallment = async (installmentId: string) => {
    toast.info('Payment flow will be integrated with payment gateway');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userEmis || userEmis.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No Active EMIs</h3>
          <p className="text-muted-foreground">
            You don't have any active EMI plans
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          My EMI Plans
        </CardTitle>
        <CardDescription>Track and pay your EMI installments</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {userEmis.map((emi: any, index: number) => {
            const progress = (emi.paid_installments / emi.total_installments) * 100;
            const itemName = emi.courses?.title || emi.course_bundles?.title || 'Purchase';
            const installments = emi.emi_installments || [];
            const sortedInstallments = [...installments].sort(
              (a: any, b: any) => a.installment_number - b.installment_number
            );

            return (
              <AccordionItem key={emi.id} value={emi.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="text-left">
                      <p className="font-medium">{itemName}</p>
                      <p className="text-sm text-muted-foreground">
                        {emi.tenure_months || emi.total_installments} months EMI
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(emi.emi_amount)}/mo</p>
                      <Badge variant={emi.status === 'completed' ? 'default' : 'outline'}>
                        {emi.paid_installments}/{emi.total_installments} paid
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round(progress)}% complete</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4 py-4 border-y">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Amount</p>
                        <p className="font-semibold">{formatCurrency(emi.total_amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Paid</p>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(emi.total_amount - emi.remaining_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                        <p className="font-semibold text-orange-600">
                          {formatCurrency(emi.remaining_amount)}
                        </p>
                      </div>
                    </div>

                    {/* Installments Table */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Installment</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedInstallments.map((inst: any) => {
                          const dueDate = new Date(inst.due_date);
                          const isOverdue = isPast(dueDate) && inst.status === 'pending';
                          const isDueToday = isToday(dueDate);

                          return (
                            <TableRow key={inst.id}>
                              <TableCell>#{inst.installment_number}</TableCell>
                              <TableCell>
                                <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : isDueToday ? 'text-orange-600' : ''}`}>
                                  <CalendarDays className="h-3 w-3" />
                                  {format(dueDate, 'dd MMM yyyy')}
                                </span>
                              </TableCell>
                              <TableCell>
                                {formatCurrency(inst.amount)}
                                {inst.late_fee > 0 && (
                                  <span className="text-xs text-red-600 block">
                                    +{formatCurrency(inst.late_fee)} late fee
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge className={EMI_STATUS_COLORS[inst.status as EMIStatus]}>
                                  {inst.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {inst.status === 'pending' || inst.status === 'overdue' ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handlePayInstallment(inst.id)}
                                  >
                                    Pay Now
                                  </Button>
                                ) : inst.status === 'paid' ? (
                                  <span className="text-green-600 flex items-center gap-1">
                                    <CheckCircle className="h-4 w-4" />
                                    Paid
                                  </span>
                                ) : null}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
