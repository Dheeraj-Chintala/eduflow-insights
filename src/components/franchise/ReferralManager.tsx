import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fromTable } from '@/lib/supabase-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Plus, Loader2, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import type { ReferralCode } from '@/types/franchise';

const referralSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(20),
  description: z.string().optional(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.coerce.number().min(0),
  commission_bonus: z.coerce.number().min(0),
  usage_limit: z.coerce.number().min(0).optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
});

type ReferralFormData = z.infer<typeof referralSchema>;

interface ReferralManagerProps {
  franchiseId: string;
}

export default function ReferralManager({ franchiseId }: ReferralManagerProps) {
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const form = useForm<ReferralFormData>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      commission_bonus: 0,
      usage_limit: undefined,
      valid_from: '',
      valid_until: '',
    },
  });

  useEffect(() => {
    fetchCodes();
  }, [franchiseId]);

  async function fetchCodes() {
    setLoading(true);
    const { data, error } = await fromTable('referral_codes')
      .select('*')
      .eq('franchise_id', franchiseId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCodes(data as ReferralCode[]);
    }
    setLoading(false);
  }

  async function onSubmit(data: ReferralFormData) {
    setSaving(true);
    try {
      const { error } = await fromTable('referral_codes').insert({
        franchise_id: franchiseId,
        code: data.code.toUpperCase(),
        description: data.description || null,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        commission_bonus: data.commission_bonus,
        usage_limit: data.usage_limit || null,
        valid_from: data.valid_from || null,
        valid_until: data.valid_until || null,
      });

      if (error) throw error;
      toast.success('Referral code created');
      form.reset();
      setDialogOpen(false);
      fetchCodes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create code');
    } finally {
      setSaving(false);
    }
  }

  async function toggleCodeStatus(codeId: string, isActive: boolean) {
    try {
      const { error } = await fromTable('referral_codes')
        .update({ is_active: isActive })
        .eq('id', codeId);

      if (error) throw error;
      toast.success(`Code ${isActive ? 'activated' : 'deactivated'}`);
      fetchCodes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update code');
    }
  }

  function copyToClipboard(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success('Code copied to clipboard');
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Referral Codes</CardTitle>
            <CardDescription>Create and manage your referral codes</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Referral Code</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referral Code *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. SAVE20" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Summer Sale Discount" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="discount_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage (%)</SelectItem>
                              <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="discount_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Value</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="commission_bonus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission Bonus (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormDescription>Extra commission when this code is used</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="usage_limit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usage Limit</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} placeholder="Leave empty for unlimited" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="valid_from"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valid From</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="valid_until"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valid Until</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Code
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse h-20 bg-muted rounded" />
            ))}
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No referral codes yet. Create your first one!
          </div>
        ) : (
          <div className="space-y-4">
            {codes.map(code => (
              <div key={code.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg">{code.code}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(code.code)}
                      >
                        {copiedCode === code.code ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      {!code.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {code.discount_type === 'percentage' 
                        ? `${code.discount_value}% off` 
                        : `₹${code.discount_value} off`}
                      {code.commission_bonus > 0 && ` • +₹${code.commission_bonus} bonus`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Used: {code.usage_count}
                      {code.usage_limit && ` / ${code.usage_limit}`}
                      {code.valid_until && ` • Expires: ${format(new Date(code.valid_until), 'MMM d, yyyy')}`}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={code.is_active}
                  onCheckedChange={(checked) => toggleCodeStatus(code.id, checked)}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
