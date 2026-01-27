import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fromTable } from '@/lib/supabase-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Loader2, Phone, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { FranchiseLead, LeadStatus } from '@/types/franchise';
import { LEAD_STATUS_LABELS } from '@/types/franchise';

const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  course_interest: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  follow_up_date: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

const STATUS_COLORS: Record<LeadStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  new: 'default',
  contacted: 'secondary',
  qualified: 'default',
  converted: 'default',
  lost: 'destructive',
};

interface LeadManagerProps {
  franchiseId: string;
}

export default function LeadManager({ franchiseId }: LeadManagerProps) {
  const [leads, setLeads] = useState<FranchiseLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      course_interest: '',
      source: '',
      notes: '',
      follow_up_date: '',
    },
  });

  useEffect(() => {
    fetchLeads();
  }, [franchiseId]);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await fromTable('franchise_leads')
      .select('*')
      .eq('franchise_id', franchiseId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLeads(data as FranchiseLead[]);
    }
    setLoading(false);
  }

  async function onSubmit(data: LeadFormData) {
    setSaving(true);
    try {
      const { error } = await fromTable('franchise_leads').insert({
        franchise_id: franchiseId,
        ...data,
        follow_up_date: data.follow_up_date || null,
      });

      if (error) throw error;
      toast.success('Lead added successfully');
      form.reset();
      setDialogOpen(false);
      fetchLeads();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add lead');
    } finally {
      setSaving(false);
    }
  }

  async function updateLeadStatus(leadId: string, status: LeadStatus) {
    try {
      const updateData: any = { status };
      if (status === 'converted') {
        updateData.converted_at = new Date().toISOString();
      }

      const { error } = await fromTable('franchise_leads')
        .update(updateData)
        .eq('id', leadId);

      if (error) throw error;
      toast.success('Lead status updated');
      fetchLeads();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update lead');
    }
  }

  const filteredLeads = leads.filter(lead => 
    statusFilter === 'all' || lead.status === statusFilter
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Lead Management</CardTitle>
            <CardDescription>Track and manage your sales leads</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Lead</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="course_interest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Interest</FormLabel>
                          <FormControl>
                            <Input placeholder="Which course are they interested in?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead Source</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Facebook, Referral, Walk-in" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="follow_up_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Follow-up Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Lead
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse h-16 bg-muted rounded" />
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No leads found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Interest</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Follow-up</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map(lead => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      {lead.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </span>
                      )}
                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{lead.course_interest || '-'}</TableCell>
                  <TableCell>{lead.source || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[lead.status]}>
                      {LEAD_STATUS_LABELS[lead.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lead.follow_up_date ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(lead.follow_up_date), 'MMM d')}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={lead.status}
                      onValueChange={(value) => updateLeadStatus(lead.id, value as LeadStatus)}
                    >
                      <SelectTrigger className="w-28 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
