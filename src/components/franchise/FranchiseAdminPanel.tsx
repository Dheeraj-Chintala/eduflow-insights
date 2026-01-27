import { useState, useEffect } from 'react';
import { fromTable } from '@/lib/supabase-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Search, Eye, CheckCircle, XCircle, Ban, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Franchise, FranchiseStatus } from '@/types/franchise';
import { FRANCHISE_TYPE_LABELS, FRANCHISE_STATUS_LABELS } from '@/types/franchise';
import { useAuth } from '@/hooks/useAuth';

const STATUS_COLORS: Record<FranchiseStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  approved: 'default',
  suspended: 'destructive',
  rejected: 'outline',
};

export default function FranchiseAdminPanel() {
  const { user } = useAuth();
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchFranchises();
  }, []);

  async function fetchFranchises() {
    setLoading(true);
    const { data, error } = await fromTable('franchises')
      .select('*, branding:franchise_branding(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setFranchises(data as Franchise[]);
    }
    setLoading(false);
  }

  async function updateFranchiseStatus(franchiseId: string, status: FranchiseStatus, reason?: string) {
    try {
      const updateData: any = { status };
      
      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user?.id;
      } else if (status === 'suspended') {
        updateData.suspended_at = new Date().toISOString();
        updateData.suspension_reason = reason;
      }

      const { error } = await fromTable('franchises')
        .update(updateData)
        .eq('id', franchiseId);

      if (error) throw error;
      toast.success(`Franchise ${status}`);
      fetchFranchises();
      setDetailsOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update franchise');
    }
  }

  const filteredFranchises = franchises.filter(f => {
    const matchesSearch = 
      f.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.franchise_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: franchises.length,
    pending: franchises.filter(f => f.status === 'pending').length,
    approved: franchises.filter(f => f.status === 'approved').length,
    suspended: franchises.filter(f => f.status === 'suspended').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Partners</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending Approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-sm text-muted-foreground">Active Partners</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
            <p className="text-sm text-muted-foreground">Suspended</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Partner Management</CardTitle>
          <CardDescription>Manage franchises, affiliates, and resellers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(FRANCHISE_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse h-16 bg-muted rounded" />
              ))}
            </div>
          ) : filteredFranchises.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No partners found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFranchises.map(franchise => (
                  <TableRow key={franchise.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{franchise.business_name}</p>
                        <p className="text-sm text-muted-foreground">{franchise.owner_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {FRANCHISE_TYPE_LABELS[franchise.franchise_type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{franchise.franchise_code}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{franchise.email}</p>
                        {franchise.phone && <p className="text-muted-foreground">{franchise.phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[franchise.status]}>
                        {FRANCHISE_STATUS_LABELS[franchise.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(franchise.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFranchise(franchise);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Partner Details</DialogTitle>
          </DialogHeader>
          {selectedFranchise && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{selectedFranchise.business_name}</h3>
                  <p className="text-muted-foreground">
                    {FRANCHISE_TYPE_LABELS[selectedFranchise.franchise_type]} • {selectedFranchise.franchise_code}
                  </p>
                </div>
                <Badge variant={STATUS_COLORS[selectedFranchise.status]} className="text-sm">
                  {FRANCHISE_STATUS_LABELS[selectedFranchise.status]}
                </Badge>
              </div>

              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="bank">Bank Info</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Owner Name</p>
                      <p className="font-medium">{selectedFranchise.owner_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedFranchise.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedFranchise.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">
                        {[selectedFranchise.city, selectedFranchise.state].filter(Boolean).join(', ') || '-'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{selectedFranchise.address || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">GST Number</p>
                      <p className="font-medium">{selectedFranchise.gst_number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">PAN Number</p>
                      <p className="font-medium">{selectedFranchise.pan_number || '-'}</p>
                    </div>
                  </div>
                  {selectedFranchise.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="font-medium">{selectedFranchise.notes}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="bank" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Bank Name</p>
                      <p className="font-medium">{selectedFranchise.bank_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Account Number</p>
                      <p className="font-medium">{selectedFranchise.bank_account_number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">IFSC Code</p>
                      <p className="font-medium">{selectedFranchise.bank_ifsc || '-'}</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedFranchise.status === 'pending' && (
                  <>
                    <Button onClick={() => updateFranchiseStatus(selectedFranchise.id, 'approved')}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button variant="destructive" onClick={() => updateFranchiseStatus(selectedFranchise.id, 'rejected')}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                {selectedFranchise.status === 'approved' && (
                  <Button variant="destructive" onClick={() => updateFranchiseStatus(selectedFranchise.id, 'suspended', 'Admin action')}>
                    <Ban className="h-4 w-4 mr-2" />
                    Suspend
                  </Button>
                )}
                {selectedFranchise.status === 'suspended' && (
                  <Button onClick={() => updateFranchiseStatus(selectedFranchise.id, 'approved')}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Reactivate
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
