import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  GripVertical,
  Calendar,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { fromTable } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import type { InternshipTask } from '@/types/internship';
import { format } from 'date-fns';

interface InternshipTaskManagerProps {
  internshipId: string;
}

export function InternshipTaskManager({ internshipId }: InternshipTaskManagerProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<InternshipTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<InternshipTask | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    due_date: '',
    max_marks: 100,
    passing_marks: 40,
    is_mandatory: true,
  });

  useEffect(() => {
    fetchTasks();
  }, [internshipId]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await fromTable('internship_tasks')
        .select('*')
        .eq('internship_id', internshipId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      instructions: '',
      due_date: '',
      max_marks: 100,
      passing_marks: 40,
      is_mandatory: true,
    });
    setEditingTask(null);
  };

  const openEditDialog = (task: InternshipTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      instructions: task.instructions || '',
      due_date: task.due_date || '',
      max_marks: task.max_marks,
      passing_marks: task.passing_marks,
      is_mandatory: task.is_mandatory,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      const taskData = {
        ...formData,
        internship_id: internshipId,
        created_by: user?.id,
        sort_order: editingTask ? editingTask.sort_order : tasks.length,
      };

      if (editingTask) {
        const { error } = await fromTable('internship_tasks')
          .update(taskData)
          .eq('id', editingTask.id);
        if (error) throw error;
        toast.success('Task updated successfully');
      } else {
        const { error } = await fromTable('internship_tasks')
          .insert(taskData);
        if (error) throw error;
        toast.success('Task created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchTasks();
    } catch (error: any) {
      console.error('Error saving task:', error);
      toast.error(error.message || 'Failed to save task');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await fromTable('internship_tasks')
        .delete()
        .eq('id', taskId);
      if (error) throw error;
      toast.success('Task deleted successfully');
      fetchTasks();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error(error.message || 'Failed to delete task');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Project Tasks</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Build a REST API"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the task..."
                />
              </div>
              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Detailed instructions for completing the task..."
                  className="min-h-24"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="max_marks">Max Marks</Label>
                  <Input
                    id="max_marks"
                    type="number"
                    min={0}
                    value={formData.max_marks}
                    onChange={(e) => setFormData({ ...formData, max_marks: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="passing_marks">Passing Marks</Label>
                  <Input
                    id="passing_marks"
                    type="number"
                    min={0}
                    value={formData.passing_marks}
                    onChange={(e) => setFormData({ ...formData, passing_marks: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    id="is_mandatory"
                    checked={formData.is_mandatory}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_mandatory: checked })}
                  />
                  <Label htmlFor="is_mandatory">Mandatory Task</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingTask ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tasks added yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add tasks for interns to complete during the internship
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <Card key={task.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GripVertical className="h-5 w-5 cursor-grab" />
                    <span className="text-sm font-medium">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEditDialog(task)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(task.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      <Badge variant="outline">
                        {task.max_marks} marks
                      </Badge>
                      {task.is_mandatory ? (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Mandatory
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Optional
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
