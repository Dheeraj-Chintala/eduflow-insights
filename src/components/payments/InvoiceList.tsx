import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { FileText, Download, Eye } from 'lucide-react';
import type { InvoiceStatus } from '@/types/payments';

const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  overdue: 'bg-orange-100 text-orange-800',
};

export default function InvoiceList() {
  const { user } = useAuth();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['user-invoices', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
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
          <FileText className="h-5 w-5" />
          Invoices
        </CardTitle>
        <CardDescription>View and download your GST-compliant invoices</CardDescription>
      </CardHeader>
      <CardContent>
        {invoices && invoices.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice: any) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono font-medium">
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell>
                    {invoice.issued_at
                      ? format(new Date(invoice.issued_at), 'dd MMM yyyy')
                      : format(new Date(invoice.created_at), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>{formatCurrency(invoice.subtotal)}</TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {formatCurrency(invoice.total_tax)}
                      <span className="text-xs text-muted-foreground block">
                        {invoice.igst_amount > 0
                          ? `IGST @${invoice.igst_rate}%`
                          : `CGST+SGST @${invoice.cgst_rate + invoice.sgst_rate}%`}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(invoice.total_amount)}
                  </TableCell>
                  <TableCell>
                    <Badge className={INVOICE_STATUS_COLORS[invoice.status as InvoiceStatus]}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" title="View Invoice">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Download PDF">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No invoices found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
