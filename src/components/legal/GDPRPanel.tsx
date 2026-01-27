import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { 
  Download, 
  Trash2, 
  Eye, 
  Edit, 
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import type { GDPRDataRequest } from '@/types/legal';

export default function GDPRPanel() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<GDPRDataRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestType, setRequestType] = useState<string>('access');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('gdpr_data_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests((data || []) as unknown as GDPRDataRequest[]);
    } catch (error) {
      console.error('Error fetching GDPR requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('gdpr_data_requests')
        .insert([{
          user_id: user.id,
          request_type: requestType,
          notes
        }]);

      if (error) throw error;

      toast.success('GDPR request submitted successfully');
      setShowRequestDialog(false);
      setNotes('');
      fetchRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: any; color: string }> = {
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      processing: { icon: AlertTriangle, color: 'bg-blue-100 text-blue-800' },
      completed: { icon: CheckCircle, color: 'bg-green-100 text-green-800' },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-800' }
    };
    const { icon: Icon, color } = config[status] || config.pending;
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'access': return <Eye className="h-4 w-4" />;
      case 'export': return <Download className="h-4 w-4" />;
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'rectify': return <Edit className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const requestTypeLabels: Record<string, string> = {
    access: 'Access My Data',
    export: 'Export My Data',
    delete: 'Delete My Data',
    rectify: 'Correct My Data'
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                GDPR Data Rights
              </CardTitle>
              <CardDescription>
                Manage your personal data and exercise your privacy rights
              </CardDescription>
            </div>
            <Button onClick={() => setShowRequestDialog(true)}>
              Submit Request
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card className="border-2 border-dashed hover:border-primary/50 cursor-pointer transition-colors"
              onClick={() => { setRequestType('access'); setShowRequestDialog(true); }}>
              <CardContent className="p-4 text-center">
                <Eye className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <h4 className="font-medium">Access</h4>
                <p className="text-xs text-muted-foreground">View what data we have</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-dashed hover:border-primary/50 cursor-pointer transition-colors"
              onClick={() => { setRequestType('export'); setShowRequestDialog(true); }}>
              <CardContent className="p-4 text-center">
                <Download className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h4 className="font-medium">Export</h4>
                <p className="text-xs text-muted-foreground">Download your data</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-dashed hover:border-primary/50 cursor-pointer transition-colors"
              onClick={() => { setRequestType('rectify'); setShowRequestDialog(true); }}>
              <CardContent className="p-4 text-center">
                <Edit className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <h4 className="font-medium">Rectify</h4>
                <p className="text-xs text-muted-foreground">Correct your data</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-dashed hover:border-primary/50 cursor-pointer transition-colors"
              onClick={() => { setRequestType('delete'); setShowRequestDialog(true); }}>
              <CardContent className="p-4 text-center">
                <Trash2 className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <h4 className="font-medium">Delete</h4>
                <p className="text-xs text-muted-foreground">Erase your data</p>
              </CardContent>
            </Card>
          </div>

          <h4 className="font-medium mb-4">Your Requests</h4>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No data requests submitted yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getRequestTypeIcon(request.request_type)}
                    <div>
                      <p className="font-medium">{requestTypeLabels[request.request_type]}</p>
                      <p className="text-sm text-muted-foreground">
                        Submitted {format(new Date(request.requested_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(request.status)}
                    {request.status === 'completed' && request.data_export_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={request.data_export_url} download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit GDPR Request</DialogTitle>
            <DialogDescription>
              We will process your request within 30 days as required by GDPR.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Request Type</Label>
              <Select value={requestType} onValueChange={setRequestType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="access">Access My Data</SelectItem>
                  <SelectItem value="export">Export My Data</SelectItem>
                  <SelectItem value="rectify">Correct My Data</SelectItem>
                  <SelectItem value="delete">Delete My Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Additional Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Provide any additional details about your request..."
                rows={3}
              />
            </div>
            {requestType === 'delete' && (
              <div className="p-3 bg-destructive/10 rounded-lg text-sm">
                <AlertTriangle className="h-4 w-4 inline mr-2 text-destructive" />
                <strong>Warning:</strong> Data deletion is permanent and cannot be undone.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRequest} disabled={isSubmitting}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
