import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Check, X, Eye, Flag, BookOpen, FileText, MessageSquare } from 'lucide-react';
import type { ContentModerationItem, ModerationStatus } from '@/types/admin';

export default function ContentModeration() {
  const { user } = useAuth();
  const [items, setItems] = useState<ContentModerationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<ContentModerationItem | null>(null);
  const [moderationNotes, setModerationNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchModerationItems();
  }, [statusFilter, typeFilter]);

  const fetchModerationItems = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('content_moderation_queue')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (statusFilter !== 'all' && (statusFilter === 'pending' || statusFilter === 'approved' || statusFilter === 'rejected' || statusFilter === 'flagged')) {
        query = query.eq('status', statusFilter);
      }
      if (typeFilter !== 'all') {
        query = query.eq('content_type', typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setItems((data || []) as unknown as ContentModerationItem[]);
    } catch (error) {
      console.error('Error fetching moderation items:', error);
      toast.error('Failed to load moderation queue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModerate = async (item: ContentModerationItem, status: 'approved' | 'rejected') => {
    try {
      setIsProcessing(true);

      const { error } = await supabase
        .from('content_moderation_queue')
        .update({
          status,
          moderator_id: user?.id,
          moderation_notes: moderationNotes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;

      // Log activity
      await supabase.from('admin_activity_logs').insert({
        admin_id: user?.id,
        action_type: 'moderate_content',
        target_type: item.content_type,
        target_id: item.content_id,
        new_value: { status, notes: moderationNotes }
      });

      toast.success(`Content ${status === 'approved' ? 'approved' : 'rejected'}`);
      setSelectedItem(null);
      setModerationNotes('');
      fetchModerationItems();
    } catch (error) {
      console.error('Error moderating content:', error);
      toast.error('Failed to moderate content');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: ModerationStatus) => {
    const variants: Record<ModerationStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      flagged: 'outline'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[priority] || colors.normal}>{priority}</Badge>;
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="h-4 w-4" />;
      case 'lesson':
        return <FileText className="h-4 w-4" />;
      case 'discussion':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const flaggedCount = items.filter(i => i.status === 'flagged').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Moderation</h2>
          <p className="text-muted-foreground">Review and approve content submissions</p>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <Badge variant="secondary">{pendingCount} Pending</Badge>
          )}
          {flaggedCount > 0 && (
            <Badge variant="destructive">{flaggedCount} Flagged</Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="course">Courses</SelectItem>
                <SelectItem value="lesson">Lessons</SelectItem>
                <SelectItem value="assessment">Assessments</SelectItem>
                <SelectItem value="discussion">Discussions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No content in moderation queue
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getContentIcon(item.content_type)}
                        <span className="font-medium">{item.content_title || 'Untitled'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.content_type}</Badge>
                    </TableCell>
                    <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                    <TableCell>
                      {format(new Date(item.submitted_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {item.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setSelectedItem(item);
                                setModerationNotes('');
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedItem(item);
                                setModerationNotes('');
                              }}
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

      {/* Moderation Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {selectedItem && getContentIcon(selectedItem.content_type)}
                <span className="font-medium">{selectedItem?.content_title || 'Untitled'}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Type: {selectedItem?.content_type} • Priority: {selectedItem?.priority}
              </p>
              {selectedItem?.flagged_reason && (
                <div className="mt-2 p-2 bg-destructive/10 rounded text-sm">
                  <Flag className="h-4 w-4 inline mr-1" />
                  {selectedItem.flagged_reason}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Moderation Notes</label>
              <Textarea
                value={moderationNotes}
                onChange={(e) => setModerationNotes(e.target.value)}
                placeholder="Add notes about your decision..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedItem && handleModerate(selectedItem, 'rejected')}
              disabled={isProcessing}
            >
              Reject
            </Button>
            <Button
              onClick={() => selectedItem && handleModerate(selectedItem, 'approved')}
              disabled={isProcessing}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
