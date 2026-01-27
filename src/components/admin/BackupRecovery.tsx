import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
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
  DialogDescription,
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
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Database, 
  Download, 
  Upload, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  HardDrive,
  AlertTriangle
} from 'lucide-react';
import type { SystemBackup, BackupStatus } from '@/types/admin';

const availableTables = [
  'users', 'profiles', 'courses', 'enrollments', 'lessons', 
  'assessments', 'certificates', 'payments', 'organizations'
];

export default function BackupRecovery() {
  const { user } = useAuth();
  const [backups, setBackups] = useState<SystemBackup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [backupForm, setBackupForm] = useState({
    backup_type: 'full',
    tables_included: availableTables,
    notes: '',
    retention_days: 30
  });

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('system_backups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBackups((data || []) as unknown as SystemBackup[]);
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast.error('Failed to load backups');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setIsCreating(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user?.id)
        .single();

      const { data, error } = await supabase
        .from('system_backups')
        .insert({
          org_id: profile?.org_id,
          backup_type: backupForm.backup_type,
          tables_included: backupForm.backup_type === 'full' ? availableTables : backupForm.tables_included,
          notes: backupForm.notes,
          retention_days: backupForm.retention_days,
          initiated_by: user?.id,
          status: 'pending',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Simulate backup completion (in real app, this would be handled by a background job)
      setTimeout(async () => {
        await supabase
          .from('system_backups')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            file_size_bytes: Math.floor(Math.random() * 100000000) + 10000000
          })
          .eq('id', data.id);
        
        fetchBackups();
      }, 3000);

      await supabase.from('admin_activity_logs').insert({
        admin_id: user?.id,
        action_type: 'create_backup',
        target_type: 'backup',
        target_id: data.id,
        new_value: { backup_type: backupForm.backup_type }
      });

      toast.success('Backup initiated successfully');
      setShowCreateDialog(false);
      fetchBackups();
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: BackupStatus) => {
    const variants: Record<BackupStatus, { icon: any; color: string }> = {
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      in_progress: { icon: Loader2, color: 'bg-blue-100 text-blue-800' },
      completed: { icon: CheckCircle, color: 'bg-green-100 text-green-800' },
      failed: { icon: XCircle, color: 'bg-red-100 text-red-800' }
    };
    const { icon: Icon, color } = variants[status];
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className={`h-3 w-3 ${status === 'in_progress' ? 'animate-spin' : ''}`} />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return '-';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(2)} ${units[i]}`;
  };

  const handleTableToggle = (table: string, checked: boolean) => {
    setBackupForm(prev => ({
      ...prev,
      tables_included: checked
        ? [...prev.tables_included, table]
        : prev.tables_included.filter(t => t !== table)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Backup & Recovery</h2>
          <p className="text-muted-foreground">Manage platform data backups and restoration</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Database className="h-4 w-4 mr-2" />
          Create Backup
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <HardDrive className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Backups</p>
                <p className="text-2xl font-bold">{backups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold">
                  {backups.filter(b => b.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Database className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="text-2xl font-bold">
                  {formatBytes(backups.reduce((acc, b) => acc + (b.file_size_bytes || 0), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backups Table */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No backups created yet</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowCreateDialog(true)}>
                Create First Backup
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Retention</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {format(new Date(backup.created_at), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(backup.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{backup.backup_type}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(backup.status)}</TableCell>
                    <TableCell>{formatBytes(backup.file_size_bytes)}</TableCell>
                    <TableCell>{backup.retention_days} days</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {backup.status === 'completed' && (
                          <>
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Upload className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Backup Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Backup</DialogTitle>
            <DialogDescription>
              Create a backup of your platform data for recovery purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Backup Type</Label>
              <Select
                value={backupForm.backup_type}
                onValueChange={(v) => setBackupForm({ ...backupForm, backup_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Backup</SelectItem>
                  <SelectItem value="incremental">Incremental</SelectItem>
                  <SelectItem value="selective">Selective</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {backupForm.backup_type === 'selective' && (
              <div>
                <Label>Select Tables</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availableTables.map(table => (
                    <div key={table} className="flex items-center space-x-2">
                      <Checkbox
                        id={table}
                        checked={backupForm.tables_included.includes(table)}
                        onCheckedChange={(checked) => handleTableToggle(table, !!checked)}
                      />
                      <label htmlFor={table} className="text-sm">
                        {table}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Retention Period (days)</Label>
              <Input
                type="number"
                value={backupForm.retention_days}
                onChange={(e) => setBackupForm({ ...backupForm, retention_days: parseInt(e.target.value) || 30 })}
                min={7}
                max={365}
              />
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={backupForm.notes}
                onChange={(e) => setBackupForm({ ...backupForm, notes: e.target.value })}
                placeholder="Add notes about this backup..."
                rows={2}
              />
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Backups may take several minutes depending on data size. Do not close this page during the process.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBackup} disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
