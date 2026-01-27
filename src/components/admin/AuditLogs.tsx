import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Search, Eye, Download, Activity, Shield, Users, Settings } from 'lucide-react';
import type { AdminActivityLog } from '@/types/admin';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AdminActivityLog | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter]);

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('admin_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (actionFilter !== 'all') {
        query = query.eq('action_type', actionFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setLogs((data || []) as unknown as AdminActivityLog[]);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    if (actionType.includes('user')) return <Users className="h-4 w-4" />;
    if (actionType.includes('config') || actionType.includes('setting')) return <Settings className="h-4 w-4" />;
    if (actionType.includes('security') || actionType.includes('moderate')) return <Shield className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActionBadgeColor = (actionType: string) => {
    if (actionType.includes('approve')) return 'bg-green-100 text-green-800';
    if (actionType.includes('reject') || actionType.includes('delete')) return 'bg-red-100 text-red-800';
    if (actionType.includes('update') || actionType.includes('create')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Action', 'Target Type', 'Target ID', 'Admin ID', 'IP Address'].join(','),
      ...logs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.action_type,
        log.target_type || '',
        log.target_id || '',
        log.admin_id,
        log.ip_address || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const filteredLogs = logs.filter(log =>
    log.action_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.target_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.admin_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const actionTypes = [...new Set(logs.map(l => l.action_type))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Logs</h2>
          <p className="text-muted-foreground">Track all administrative activities</p>
        </div>
        <Button variant="outline" onClick={exportLogs}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Admin ID</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action_type)}
                        <Badge className={getActionBadgeColor(log.action_type)}>
                          {log.action_type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.target_type && (
                        <div className="text-sm">
                          <span className="font-medium">{log.target_type}</span>
                          {log.target_id && (
                            <span className="text-muted-foreground ml-1">
                              ({log.target_id.slice(0, 8)}...)
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.admin_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.ip_address || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedLog(log)}
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

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Timestamp</p>
                  <p className="font-medium">
                    {format(new Date(selectedLog.created_at), 'PPpp')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Action</p>
                  <Badge className={getActionBadgeColor(selectedLog.action_type)}>
                    {selectedLog.action_type.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admin ID</p>
                  <p className="font-mono text-sm">{selectedLog.admin_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IP Address</p>
                  <p className="font-mono text-sm">{selectedLog.ip_address || 'Not recorded'}</p>
                </div>
              </div>

              {selectedLog.target_type && (
                <div>
                  <p className="text-sm text-muted-foreground">Target</p>
                  <p className="font-medium">
                    {selectedLog.target_type}
                    {selectedLog.target_id && ` (${selectedLog.target_id})`}
                  </p>
                </div>
              )}

              {selectedLog.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedLog.notes}</p>
                </div>
              )}

              {selectedLog.previous_value && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Previous Value</p>
                  <pre className="p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(selectedLog.previous_value, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_value && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">New Value</p>
                  <pre className="p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(selectedLog.new_value, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
