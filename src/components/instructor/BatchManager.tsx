import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Plus, Users, Pencil, Trash2, Loader2 } from 'lucide-react';
import { fromTable } from '@/lib/supabase-helpers';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { CourseBatch, BatchStatus } from '@/types/database';

interface BatchManagerProps {
  courseId: string;
}

const STATUS_COLORS: Record<BatchStatus, string> = {
  upcoming: 'bg-info/10 text-info border-info/20',
  enrolling: 'bg-success/10 text-success border-success/20',
  active: 'bg-primary/10 text-primary border-primary/20',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const STATUS_LABELS: Record<BatchStatus, string> = {
  upcoming: 'Upcoming',
  enrolling: 'Enrolling',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function BatchManager({ courseId }: BatchManagerProps) {
  const { toast } = useToast();
  const [batches, setBatches] = useState<CourseBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingBatch, setEditingBatch] = useState<CourseBatch | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [maxStudents, setMaxStudents] = useState('');
  const [enrollmentStart, setEnrollmentStart] = useState('');
  const [enrollmentEnd, setEnrollmentEnd] = useState('');
  const [courseStart, setCourseStart] = useState('');
  const [courseEnd, setCourseEnd] = useState('');

  useEffect(() => {
    fetchBatches();
  }, [courseId]);

  const fetchBatches = async () => {
    try {
      const { data } = await fromTable('course_batches')
        .select('*')
        .eq('course_id', courseId)
        .order('course_start', { ascending: true });

      setBatches((data as CourseBatch[]) || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setBatchCode('');
    setMaxStudents('');
    setEnrollmentStart('');
    setEnrollmentEnd('');
    setCourseStart('');
    setCourseEnd('');
    setEditingBatch(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (batch: CourseBatch) => {
    setEditingBatch(batch);
    setTitle(batch.title);
    setDescription(batch.description || '');
    setBatchCode(batch.batch_code || '');
    setMaxStudents(batch.max_students?.toString() || '');
    setEnrollmentStart(batch.enrollment_start.split('T')[0]);
    setEnrollmentEnd(batch.enrollment_end.split('T')[0]);
    setCourseStart(batch.course_start.split('T')[0]);
    setCourseEnd(batch.course_end?.split('T')[0] || '');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !enrollmentStart || !enrollmentEnd || !courseStart) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const batchData = {
        title: title.trim(),
        description: description.trim() || null,
        batch_code: batchCode.trim() || null,
        max_students: maxStudents ? parseInt(maxStudents) : null,
        enrollment_start: new Date(enrollmentStart).toISOString(),
        enrollment_end: new Date(enrollmentEnd).toISOString(),
        course_start: new Date(courseStart).toISOString(),
        course_end: courseEnd ? new Date(courseEnd).toISOString() : null,
      };

      if (editingBatch) {
        const { error } = await fromTable('course_batches')
          .update(batchData)
          .eq('id', editingBatch.id);

        if (error) throw error;
        toast({ title: 'Batch updated successfully!' });
      } else {
        const { error } = await fromTable('course_batches')
          .insert({ ...batchData, course_id: courseId });

        if (error) throw error;
        toast({ title: 'Batch created successfully!' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchBatches();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save batch.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (batchId: string) => {
    try {
      const { error } = await fromTable('course_batches')
        .delete()
        .eq('id', batchId);

      if (error) throw error;

      setBatches(batches.filter(b => b.id !== batchId));
      toast({ title: 'Batch deleted successfully!' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete batch.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Batches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Course Batches
          </CardTitle>
          <CardDescription>Manage enrollment windows and scheduled batches</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-1" />
              Add Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingBatch ? 'Edit Batch' : 'Create New Batch'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="batch-title">Batch Name *</Label>
                  <Input
                    id="batch-title"
                    placeholder="e.g., January 2024 Batch"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch-code">Batch Code</Label>
                  <Input
                    id="batch-code"
                    placeholder="e.g., JAN24"
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch-description">Description</Label>
                <Textarea
                  id="batch-description"
                  placeholder="Optional description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-students">Maximum Students</Label>
                <Input
                  id="max-students"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={maxStudents}
                  onChange={(e) => setMaxStudents(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="enrollment-start">Enrollment Start *</Label>
                  <Input
                    id="enrollment-start"
                    type="date"
                    value={enrollmentStart}
                    onChange={(e) => setEnrollmentStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enrollment-end">Enrollment End *</Label>
                  <Input
                    id="enrollment-end"
                    type="date"
                    value={enrollmentEnd}
                    onChange={(e) => setEnrollmentEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="course-start">Course Start *</Label>
                  <Input
                    id="course-start"
                    type="date"
                    value={courseStart}
                    onChange={(e) => setCourseStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-end">Course End</Label>
                  <Input
                    id="course-end"
                    type="date"
                    value={courseEnd}
                    onChange={(e) => setCourseEnd(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingBatch ? 'Update Batch' : 'Create Batch'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {batches.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <CalendarDays className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No batches configured</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create batches to manage scheduled enrollments
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map((batch) => (
              <div 
                key={batch.id}
                className="p-4 rounded-lg border bg-muted/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{batch.title}</h4>
                      {batch.batch_code && (
                        <Badge variant="outline">{batch.batch_code}</Badge>
                      )}
                      <Badge variant="outline" className={STATUS_COLORS[batch.status]}>
                        {STATUS_LABELS[batch.status]}
                      </Badge>
                    </div>
                    {batch.description && (
                      <p className="text-sm text-muted-foreground mb-2">{batch.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        Enrollment: {format(new Date(batch.enrollment_start), 'MMM d')} - {format(new Date(batch.enrollment_end), 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        Course: {format(new Date(batch.course_start), 'MMM d, yyyy')}
                        {batch.course_end && ` - ${format(new Date(batch.course_end), 'MMM d, yyyy')}`}
                      </span>
                      {batch.max_students && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Max {batch.max_students} students
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEditDialog(batch)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(batch.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
