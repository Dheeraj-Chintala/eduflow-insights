import AppLayout from '@/layouts/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaymentHistory from '@/components/payments/PaymentHistory';
import WalletCard from '@/components/payments/WalletCard';
import MySubscription from '@/components/payments/MySubscription';
import EMIManager from '@/components/payments/EMIManager';
import InvoiceList from '@/components/payments/InvoiceList';
import RefundRequests from '@/components/payments/RefundRequests';
import { CreditCard, Wallet, Crown, FileText, RotateCcw, CalendarDays } from 'lucide-react';

export default function PaymentsPage() {
  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payments & Billing</h1>
          <p className="text-muted-foreground">Manage your payments, subscriptions, and invoices</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="history" className="space-y-4">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">History</span>
                </TabsTrigger>
                <TabsTrigger value="subscription" className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  <span className="hidden sm:inline">Subscription</span>
                </TabsTrigger>
                <TabsTrigger value="emi" className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">EMI</span>
                </TabsTrigger>
                <TabsTrigger value="invoices" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Invoices</span>
                </TabsTrigger>
                <TabsTrigger value="refunds" className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Refunds</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history">
                <PaymentHistory />
              </TabsContent>

              <TabsContent value="subscription">
                <MySubscription />
              </TabsContent>

              <TabsContent value="emi">
                <EMIManager />
              </TabsContent>

              <TabsContent value="invoices">
                <InvoiceList />
              </TabsContent>

              <TabsContent value="refunds">
                <RefundRequests />
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <WalletCard />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
