import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, History } from 'lucide-react';
import { format } from 'date-fns';
import type { WalletTransactionType } from '@/types/payments';

const TRANSACTION_ICONS: Record<WalletTransactionType, any> = {
  credit: ArrowDownLeft,
  debit: ArrowUpRight,
  refund: ArrowDownLeft,
  reward: ArrowDownLeft,
  referral: ArrowDownLeft,
  purchase: ArrowUpRight,
};

const TRANSACTION_COLORS: Record<WalletTransactionType, string> = {
  credit: 'text-green-600',
  debit: 'text-red-600',
  refund: 'text-purple-600',
  reward: 'text-amber-600',
  referral: 'text-blue-600',
  purchase: 'text-red-600',
};

export default function WalletCard() {
  const { user } = useAuth();

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['user-wallet', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['wallet-transactions', wallet?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', wallet?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!wallet?.id,
  });

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  if (walletLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          My Wallet
        </CardTitle>
        <CardDescription>Manage your wallet balance and view transactions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
          <p className="text-3xl font-bold text-primary">
            {formatCurrency(wallet?.balance || 0, wallet?.currency || 'INR')}
          </p>
          <div className="flex gap-2 mt-4">
            <Button size="sm" disabled>
              <Plus className="h-4 w-4 mr-1" />
              Add Money
            </Button>
            <Button size="sm" variant="outline" disabled>
              <History className="h-4 w-4 mr-1" />
              Full History
            </Button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h4 className="font-medium mb-3">Recent Transactions</h4>
          {transactionsLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((txn: any) => {
                const Icon = TRANSACTION_ICONS[txn.transaction_type as WalletTransactionType] || ArrowUpRight;
                const colorClass = TRANSACTION_COLORS[txn.transaction_type as WalletTransactionType] || 'text-gray-600';
                const isCredit = ['credit', 'refund', 'reward', 'referral'].includes(txn.transaction_type);

                return (
                  <div key={txn.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full bg-background ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm capitalize">
                          {txn.transaction_type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(txn.created_at), 'dd MMM yyyy, HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                        {isCredit ? '+' : '-'}{formatCurrency(txn.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Bal: {formatCurrency(txn.balance_after)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-6 text-muted-foreground">No transactions yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
