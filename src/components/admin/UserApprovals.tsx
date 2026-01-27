import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Check, X, Eye, Search, Filter } from 'lucide-react';
import type { UserApprovalRequest, ApprovalStatus } from '@/types/admin';

export default function UserApprovals() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<UserApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<UserApprovalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchApprovalRequests();
  }, [statusFilter]);

  const fetchApprovalRequests = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('user_approval_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (statusFilter !== 'all' && (statusFilter === 'pending' || statusFilter === 'approved' || statusFilter === 'rejected' || statusFilter === 'suspended')) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setRequests((data || []) as unknown as UserApprovalRequest[]);
    } catch (error) {
      console.error('Error fetching approval requests:', error);
      toast.error('Failed to load approval requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (request: UserApprovalRequest) => {
    try {
      setIsProcessing(true);

      // Update approval request
      const { error: updateError } = await supabase
        .from('user_approval_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Add the role to user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: request.user_id,
          role: request.requested_role as any,
          org_id: request.org_id || ''
        }] as any);

      if (roleError && roleError.code !== '23505') throw roleError; // Ignore duplicate key

      // Log activity
      await supabase.from('admin_activity_logs').insert([{
        admin_id: user?.id,
        action_type: 'approve_user',
        target_type: 'user',
        target_id: request.user_id,
        new_value: { role: request.requested_role } as any
      }]);

      toast.success('User approved successfully');
      fetchApprovalRequests();
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Failed to approve user');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      setIsProcessing(true);

      const { error } = await supabase
        .from('user_approval_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          rejection_reason: rejectionReason
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // Log activity
      await supabase.from('admin_activity_logs').insert({
        admin_id: user?.id,
        action_type: 'reject_user',
        target_type: 'user',
        target_id: selectedRequest.user_id,
        new_value: { reason: rejectionReason }
      });

      toast.success('User rejected');
      setSelectedRequest(null);
      setRejectionReason('');
      fetchApprovalRequests();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Failed to reject user');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    const variants: Record<ApprovalStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      suspended: 'outline'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const filteredRequests = requests.filter(req =>
    req.user_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.requested_role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Approvals</h2>
          <p className="text-muted-foreground">Review and approve user role requests</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user ID or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No approval requests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Requested Role</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-sm">
                      {request.user_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{request.requested_role}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.requested_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {request.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(request)}
                              disabled={isProcessing}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setSelectedRequest(request)}
                              disabled={isProcessing}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
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

      {/* Rejection Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Approval Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Provide a reason for rejecting this request:
              </p>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim() || isProcessing}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
