import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Plus, Edit, Trash2, DollarSign, Percent } from 'lucide-react';
import type { PricingRule } from '@/types/admin';

export default function PricingControls() {
  const { user } = useAuth();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    rule_name: '',
    rule_type: 'discount',
    applies_to: 'course',
    value_type: 'percentage',
    value: 0,
    min_amount: '',
    max_amount: '',
    is_active: true
  });

  useEffect(() => {
    fetchPricingRules();
  }, []);

  const fetchPricingRules = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setRules((data || []) as unknown as PricingRule[]);
    } catch (error) {
      console.error('Error fetching pricing rules:', error);
      toast.error('Failed to load pricing rules');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (rule?: PricingRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        rule_name: rule.rule_name,
        rule_type: rule.rule_type,
        applies_to: rule.applies_to,
        value_type: rule.value_type,
        value: rule.value,
        min_amount: rule.min_amount?.toString() || '',
        max_amount: rule.max_amount?.toString() || '',
        is_active: rule.is_active
      });
    } else {
      setEditingRule(null);
      setFormData({
        rule_name: '',
        rule_type: 'discount',
        applies_to: 'course',
        value_type: 'percentage',
        value: 0,
        min_amount: '',
        max_amount: '',
        is_active: true
      });
    }
    setShowDialog(true);
  };

  const handleSaveRule = async () => {
    try {
      setIsProcessing(true);

      // Get user's org_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user?.id)
        .single();

      const ruleData = {
        rule_name: formData.rule_name,
        rule_type: formData.rule_type,
        applies_to: formData.applies_to,
        value_type: formData.value_type,
        value: formData.value,
        min_amount: formData.min_amount ? parseFloat(formData.min_amount) : null,
        max_amount: formData.max_amount ? parseFloat(formData.max_amount) : null,
        is_active: formData.is_active,
        org_id: profile?.org_id
      };

      if (editingRule) {
        const { error } = await supabase
          .from('pricing_rules')
          .update(ruleData)
          .eq('id', editingRule.id);

        if (error) throw error;
        toast.success('Pricing rule updated');
      } else {
        const { error } = await supabase
          .from('pricing_rules')
          .insert({ ...ruleData, created_by: user?.id });

        if (error) throw error;
        toast.success('Pricing rule created');
      }

      // Log activity
      await supabase.from('admin_activity_logs').insert([{
        admin_id: user?.id,
        action_type: editingRule ? 'update_pricing_rule' : 'create_pricing_rule',
        target_type: 'pricing_rule',
        target_id: editingRule?.id,
        new_value: ruleData as any
      }]);

      setShowDialog(false);
      fetchPricingRules();
    } catch (error) {
      console.error('Error saving pricing rule:', error);
      toast.error('Failed to save pricing rule');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteRule = async (rule: PricingRule) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) return;

    try {
      const { error } = await supabase
        .from('pricing_rules')
        .delete()
        .eq('id', rule.id);

      if (error) throw error;

      await supabase.from('admin_activity_logs').insert([{
        admin_id: user?.id,
        action_type: 'delete_pricing_rule',
        target_type: 'pricing_rule',
        target_id: rule.id,
        previous_value: rule as any
      }]);

      toast.success('Pricing rule deleted');
      fetchPricingRules();
    } catch (error) {
      console.error('Error deleting pricing rule:', error);
      toast.error('Failed to delete pricing rule');
    }
  };

  const toggleRuleStatus = async (rule: PricingRule) => {
    try {
      const { error } = await supabase
        .from('pricing_rules')
        .update({ is_active: !rule.is_active })
        .eq('id', rule.id);

      if (error) throw error;
      fetchPricingRules();
    } catch (error) {
      console.error('Error toggling rule status:', error);
      toast.error('Failed to update rule status');
    }
  };

  const getRuleTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      discount: 'bg-green-100 text-green-800',
      markup: 'bg-blue-100 text-blue-800',
      commission: 'bg-purple-100 text-purple-800',
      flat_rate: 'bg-orange-100 text-orange-800'
    };
    return <Badge className={colors[type] || 'bg-gray-100'}>{type.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pricing & Commission Controls</h2>
          <p className="text-muted-foreground">Manage pricing rules for courses, affiliates, and franchises</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pricing rules configured
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Applies To</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.rule_name}</TableCell>
                    <TableCell>{getRuleTypeBadge(rule.rule_type)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.applies_to}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {rule.value_type === 'percentage' ? (
                          <>
                            <Percent className="h-4 w-4 text-muted-foreground" />
                            {rule.value}%
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            {rule.value}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => toggleRuleStatus(rule)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(rule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteRule(rule)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit' : 'Add'} Pricing Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rule Name</Label>
              <Input
                value={formData.rule_name}
                onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                placeholder="Enter rule name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rule Type</Label>
                <Select
                  value={formData.rule_type}
                  onValueChange={(v) => setFormData({ ...formData, rule_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="markup">Markup</SelectItem>
                    <SelectItem value="commission">Commission</SelectItem>
                    <SelectItem value="flat_rate">Flat Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Applies To</Label>
                <Select
                  value={formData.applies_to}
                  onValueChange={(v) => setFormData({ ...formData, applies_to: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="affiliate">Affiliate</SelectItem>
                    <SelectItem value="franchise">Franchise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Value Type</Label>
                <Select
                  value={formData.value_type}
                  onValueChange={(v) => setFormData({ ...formData, value_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Value</Label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Amount (optional)</Label>
                <Input
                  type="number"
                  value={formData.min_amount}
                  onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Max Amount (optional)</Label>
                <Input
                  type="number"
                  value={formData.max_amount}
                  onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                  placeholder="No limit"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule} disabled={!formData.rule_name || isProcessing}>
              {editingRule ? 'Update' : 'Create'} Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
