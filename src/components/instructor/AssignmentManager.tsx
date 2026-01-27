import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { FileCheck, Plus, Calendar, Clock, Pencil, Trash2, Loader2, Users, CheckCircle, XCircle } from 'lucide-react';
import { fromTable } from '@/lib/supabase-helpers';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format, isPast } from 'date-fns';
import type { Assignment, AssignmentStatus } from '@/types/instructor';
import type { Course, CourseModule, CourseBatch } from '@/types/database';

const STATUS_CONFIG: Record<AssignmentStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-warning/10 text-warning border-warning/20' },
  published: { label: 'Published', className: 'bg-success/10 text-success border-success/20' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground' },
};

export function AssignmentManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [batches, setBatches] = useState<CourseBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [courseId, setCourseId] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [maxMarks, setMaxMarks] = useState('100');
  const [passingMarks, setPassingMarks] = useState('40');
  const [allowLate, setAllowLate] = useState(false);
  const [latePenalty, setLatePenalty] = useState('10');
  const [allowResubmission, setAllowResubmission] = useState(true);
  const [maxResubmissions, setMaxResubmissions] = useState('2');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: coursesData } = await fromTable('courses')
        .select('id, title')
        .eq('instructor_id', user?.id)
        .order('title');

      setCourses((coursesData as Course[]) || []);

      const { data: assignmentsData } = await fromTable('assignments')
        .select('*, course:courses(title), module:course_modules(title), batch:course_batches(title)')
        .eq('instructor_id', user?.id)
        .order('created_at', { ascending: false });

      setAssignments((assignmentsData as Assignment[]) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourseData = async (selectedCourseId: string) => {
    if (!selectedCourseId) {
      setModules([]);
      setBatches([]);
      return;
    }

    const [modulesRes, batchesRes] = await Promise.all([
      fromTable('course_modules')
        .select('*')
        .eq('course_id', selectedCourseId)
        .order('sort_order'),
      fromTable('course_batches')
        .select('*')
        .eq('course_id', selectedCourseId)
        .order('course_start'),
    ]);

    setModules((modulesRes.data as CourseModule[]) || []);
    setBatches((batchesRes.data as CourseBatch[]) || []);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setInstructions('');
    setCourseId('');
    setModuleId('');
    setBatchId('');
    setDueDate('');
    setDueTime('23:59');
    setMaxMarks('100');
    setPassingMarks('40');
    setAllowLate(false);
    setLatePenalty('10');
    setAllowResubmission(true);
    setMaxResubmissions('2');
    setEditingAssignment(null);
    setModules([]);
    setBatches([]);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = async (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setTitle(assignment.title);
    setDescription(assignment.description || '');
    setInstructions(assignment.instructions || '');
    setCourseId(assignment.course_id);
    setModuleId(assignment.module_id || '');
    setBatchId(assignment.batch_id || '');
    if (assignment.due_date) {
      const dueDateTime = new Date(assignment.due_date);
      setDueDate(format(dueDateTime, 'yyyy-MM-dd'));
      setDueTime(format(dueDateTime, 'HH:mm'));
    }
    setMaxMarks(assignment.max_marks.toString());
    setPassingMarks(assignment.passing_marks.toString());
    setAllowLate(assignment.allow_late_submission);
    setLatePenalty(assignment.late_penalty_percent.toString());
    setAllowResubmission(assignment.allow_resubmission);
    setMaxResubmissions(assignment.max_resubmissions.toString());
    await fetchCourseData(assignment.course_id);
    setIsDialogOpen(true);
  };

  const handleCourseChange = (value: string) => {
    setCourseId(value);
    setModuleId('');
    setBatchId('');
    fetchCourseData(value);
  };

  const handleSave = async () => {
    if (!title.trim() || !courseId) {
      toast({
        title: 'Validation Error',
        description: 'Title and course are required.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const assignmentData = {
        title: title.trim(),
        description: description.trim() || null,
        instructions: instructions.trim() || null,
        course_id: courseId,
        module_id: moduleId || null,
        batch_id: batchId || null,
        due_date: dueDate ? new Date(`${dueDate}T${dueTime}`).toISOString() : null,
        max_marks: parseInt(maxMarks),
        passing_marks: parseInt(passingMarks),
        allow_late_submission: allowLate,
        late_penalty_percent: parseInt(latePenalty),
        allow_resubmission: allowResubmission,
        max_resubmissions: parseInt(maxResubmissions),
      };

      if (editingAssignment) {
        const { error } = await fromTable('assignments')
          .update(assignmentData)
          .eq('id', editingAssignment.id);

        if (error) throw error;
        toast({ title: 'Assignment updated!' });
      } else {
        const { error } = await fromTable('assignments')
          .insert({ ...assignmentData, instructor_id: user?.id });

        if (error) throw error;
        toast({ title: 'Assignment created!' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save assignment.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (assignmentId: string, newStatus: AssignmentStatus) => {
    try {
      const { error } = await fromTable('assignments')
        .update({ status: newStatus })
        .eq('id', assignmentId);

      if (error) throw error;
      setAssignments(assignments.map(a => a.id === assignmentId ? { ...a, status: newStatus } : a));
      toast({ title: `Assignment ${newStatus}!` });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (assignmentId: string) => {
    try {
      const { error } = await fromTable('assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      setAssignments(assignments.filter(a => a.id !== assignmentId));
      toast({ title: 'Assignment deleted!' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete assignment.',
        variant: 'destructive',
      });
    }
  };

  const draftAssignments = assignments.filter(a => a.status === 'draft');
  const publishedAssignments = assignments.filter(a => a.status === 'published');
  const closedAssignments = assignments.filter(a => a.status === 'closed');

  const AssignmentCard = ({ assignment }: { assignment: Assignment }) => {
    const statusConfig = STATUS_CONFIG[assignment.status];
    const isOverdue = assignment.due_date && isPast(new Date(assignment.due_date));

    return (
      <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold">{assignment.title}</h4>
              <Badge variant="outline" className={statusConfig.className}>
                {statusConfig.label}
              </Badge>
              {isOverdue && assignment.status === 'published' && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive">
                  Past Due
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {(assignment as any).course?.title}
              {(assignment as any).module?.title && ` • ${(assignment as any).module.title}`}
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {assignment.due_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due: {format(new Date(assignment.due_date), 'MMM d, yyyy h:mm a')}
                </span>
              )}
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Max: {assignment.max_marks} marks
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {assignment.status === 'draft' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange(assignment.id, 'published')}
              >
                Publish
              </Button>
            )}
            {assignment.status === 'published' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange(assignment.id, 'closed')}
              >
                Close
              </Button>
            )}
            <Button size="icon" variant="ghost" onClick={() => openEditDialog(assignment)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDelete(assignment.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Assignments
          </CardTitle>
          <CardDescription>Create and manage course assignments</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-1" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAssignment ? 'Edit Assignment' : 'Create Assignment'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="assignment-title">Title *</Label>
                <Input
                  id="assignment-title"
                  placeholder="e.g., Week 1 Project"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignment-description">Description</Label>
                <Textarea
                  id="assignment-description"
                  placeholder="Brief description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignment-instructions">Instructions</Label>
                <Textarea
                  id="assignment-instructions"
                  placeholder="Detailed instructions for students..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Course *</Label>
                <Select value={courseId} onValueChange={handleCourseChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Module (Optional)</Label>
                  <Select value={moduleId} onValueChange={setModuleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All modules" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All modules</SelectItem>
                      {modules.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Batch (Optional)</Label>
                  <Select value={batchId} onValueChange={setBatchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All students" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All students</SelectItem>
                      {batches.map(b => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-time">Due Time</Label>
                  <Input
                    id="due-time"
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="max-marks">Max Marks</Label>
                  <Input
                    id="max-marks"
                    type="number"
                    min="1"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passing-marks">Passing Marks</Label>
                  <Input
                    id="passing-marks"
                    type="number"
                    min="0"
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow-late">Allow Late Submission</Label>
                    <p className="text-xs text-muted-foreground">Students can submit after due date</p>
                  </div>
                  <Switch
                    id="allow-late"
                    checked={allowLate}
                    onCheckedChange={setAllowLate}
                  />
                </div>
                {allowLate && (
                  <div className="space-y-2">
                    <Label htmlFor="late-penalty">Late Penalty (%)</Label>
                    <Input
                      id="late-penalty"
                      type="number"
                      min="0"
                      max="100"
                      value={latePenalty}
                      onChange={(e) => setLatePenalty(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow-resubmission">Allow Resubmission</Label>
                    <p className="text-xs text-muted-foreground">Students can resubmit their work</p>
                  </div>
                  <Switch
                    id="allow-resubmission"
                    checked={allowResubmission}
                    onCheckedChange={setAllowResubmission}
                  />
                </div>
                {allowResubmission && (
                  <div className="space-y-2">
                    <Label htmlFor="max-resubmissions">Max Resubmissions</Label>
                    <Input
                      id="max-resubmissions"
                      type="number"
                      min="1"
                      value={maxResubmissions}
                      onChange={(e) => setMaxResubmissions(e.target.value)}
                    />
                  </div>
                )}
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
                  editingAssignment ? 'Update Assignment' : 'Create Assignment'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="published" className="space-y-4">
          <TabsList>
            <TabsTrigger value="draft">
              Drafts ({draftAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="published">
              Published ({publishedAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="closed">
              Closed ({closedAssignments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draft" className="space-y-3">
            {draftAssignments.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <FileCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No draft assignments</p>
              </div>
            ) : (
              draftAssignments.map(a => <AssignmentCard key={a.id} assignment={a} />)
            )}
          </TabsContent>

          <TabsContent value="published" className="space-y-3">
            {publishedAssignments.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <FileCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No published assignments</p>
                <Button variant="link" onClick={openAddDialog}>
                  Create your first assignment
                </Button>
              </div>
            ) : (
              publishedAssignments.map(a => <AssignmentCard key={a.id} assignment={a} />)
            )}
          </TabsContent>

          <TabsContent value="closed" className="space-y-3">
            {closedAssignments.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <XCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No closed assignments</p>
              </div>
            ) : (
              closedAssignments.map(a => <AssignmentCard key={a.id} assignment={a} />)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
