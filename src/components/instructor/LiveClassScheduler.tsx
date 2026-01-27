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
import { Video, Plus, Calendar, Clock, Link as LinkIcon, Users, Pencil, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { fromTable } from '@/lib/supabase-helpers';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format, isPast, isFuture, isToday } from 'date-fns';
import type { LiveClass, LiveClassStatus } from '@/types/instructor';
import type { Course, CourseBatch } from '@/types/database';

const STATUS_CONFIG: Record<LiveClassStatus, { label: string; className: string }> = {
  scheduled: { label: 'Scheduled', className: 'bg-info/10 text-info border-info/20' },
  live: { label: 'Live Now', className: 'bg-success/10 text-success border-success/20 animate-pulse' },
  completed: { label: 'Completed', className: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const PLATFORMS = [
  { value: 'zoom', label: 'Zoom' },
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'teams', label: 'Microsoft Teams' },
  { value: 'webex', label: 'Webex' },
  { value: 'other', label: 'Other' },
];

export function LiveClassScheduler() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<CourseBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingClass, setEditingClass] = useState<LiveClass | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [platform, setPlatform] = useState('zoom');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [notifyStudents, setNotifyStudents] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch instructor's courses
      const { data: coursesData } = await fromTable('courses')
        .select('id, title')
        .eq('instructor_id', user?.id)
        .order('title');

      setCourses((coursesData as Course[]) || []);

      // Fetch live classes
      const { data: classesData } = await fromTable('live_classes')
        .select('*, course:courses(title), batch:course_batches(title)')
        .eq('instructor_id', user?.id)
        .order('scheduled_at', { ascending: false });

      setClasses((classesData as LiveClass[]) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBatches = async (selectedCourseId: string) => {
    if (!selectedCourseId) {
      setBatches([]);
      return;
    }

    const { data } = await fromTable('course_batches')
      .select('*')
      .eq('course_id', selectedCourseId)
      .order('course_start');

    setBatches((data as CourseBatch[]) || []);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCourseId('');
    setBatchId('');
    setMeetingUrl('');
    setPlatform('zoom');
    setScheduledDate('');
    setScheduledTime('');
    setDuration('60');
    setMaxAttendees('');
    setNotifyStudents(true);
    setEditingClass(null);
    setBatches([]);
  };

  const openAddDialog = () => {
    
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = async (liveClass: LiveClass) => {
    setEditingClass(liveClass);
    setTitle(liveClass.title);
    setDescription(liveClass.description || '');
    setCourseId(liveClass.course_id);
    setBatchId(liveClass.batch_id || '');
    setMeetingUrl(liveClass.meeting_url || '');
    setPlatform(liveClass.meeting_platform);
    const dateTime = new Date(liveClass.scheduled_at);
    setScheduledDate(format(dateTime, 'yyyy-MM-dd'));
    setScheduledTime(format(dateTime, 'HH:mm'));
    setDuration(liveClass.duration_minutes.toString());
    setMaxAttendees(liveClass.max_attendees?.toString() || '');
    setNotifyStudents(liveClass.notify_students);
    await fetchBatches(liveClass.course_id);
    setIsDialogOpen(true);
  };

  const handleCourseChange = (value: string) => {
    setCourseId(value);
    setBatchId('');
    fetchBatches(value);
  };

  const handleSave = async () => {
    if (!title.trim() || !courseId || !scheduledDate || !scheduledTime) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

      const classData = {
        title: title.trim(),
        description: description.trim() || null,
        course_id: courseId,
        batch_id: batchId || null,
        meeting_url: meetingUrl.trim() || null,
        meeting_platform: platform,
        scheduled_at: scheduledAt,
        duration_minutes: parseInt(duration),
        max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
        notify_students: notifyStudents,
      };

      if (editingClass) {
        const { error } = await fromTable('live_classes')
          .update(classData)
          .eq('id', editingClass.id);

        if (error) throw error;
        toast({ title: 'Live class updated successfully!' });
      } else {
        const { error } = await fromTable('live_classes')
          .insert({ ...classData, instructor_id: user?.id });

        if (error) throw error;
        toast({ title: 'Live class scheduled successfully!' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save live class.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (classId: string) => {
    try {
      const { error } = await fromTable('live_classes')
        .delete()
        .eq('id', classId);

      if (error) throw error;
      setClasses(classes.filter(c => c.id !== classId));
      toast({ title: 'Live class deleted!' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete live class.',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (classId: string, newStatus: LiveClassStatus) => {
    try {
      const { error } = await fromTable('live_classes')
        .update({ status: newStatus })
        .eq('id', classId);

      if (error) throw error;
      setClasses(classes.map(c => c.id === classId ? { ...c, status: newStatus } : c));
      toast({ title: `Class marked as ${newStatus}` });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      });
    }
  };

  const upcomingClasses = classes.filter(c => 
    c.status === 'scheduled' && isFuture(new Date(c.scheduled_at))
  );
  const pastClasses = classes.filter(c => 
    c.status === 'completed' || c.status === 'cancelled' || isPast(new Date(c.scheduled_at))
  );
  const todayClasses = classes.filter(c => isToday(new Date(c.scheduled_at)));

  const ClassCard = ({ liveClass }: { liveClass: LiveClass }) => {
    const statusConfig = STATUS_CONFIG[liveClass.status];
    const isUpcoming = liveClass.status === 'scheduled' && isFuture(new Date(liveClass.scheduled_at));

    return (
      <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold">{liveClass.title}</h4>
              <Badge variant="outline" className={statusConfig.className}>
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {(liveClass as any).course?.title}
              {(liveClass as any).batch?.title && ` • ${(liveClass as any).batch.title}`}
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(liveClass.scheduled_at), 'MMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(liveClass.scheduled_at), 'h:mm a')} ({liveClass.duration_minutes} min)
              </span>
              {liveClass.max_attendees && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Max {liveClass.max_attendees}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {liveClass.meeting_url && (
              <Button size="icon" variant="ghost" asChild>
                <a href={liveClass.meeting_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            {isUpcoming && (
              <>
                <Button size="icon" variant="ghost" onClick={() => openEditDialog(liveClass)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(liveClass.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            {liveClass.status === 'scheduled' && isPast(new Date(liveClass.scheduled_at)) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange(liveClass.id, 'completed')}
              >
                Mark Completed
              </Button>
            )}
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
            <Video className="h-5 w-5" />
            Live Classes
          </CardTitle>
          <CardDescription>Schedule and manage live sessions</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-1" />
              Schedule Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingClass ? 'Edit Live Class' : 'Schedule New Class'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="class-title">Class Title *</Label>
                <Input
                  id="class-title"
                  placeholder="e.g., Introduction to React Hooks"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="class-description">Description</Label>
                <Textarea
                  id="class-description"
                  placeholder="What will be covered in this class..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
                <div className="space-y-2">
                  <Label>Batch (Optional)</Label>
                  <Select value={batchId} onValueChange={setBatchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All students" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All students</SelectItem>
                      {batches.map(batch => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="class-date">Date *</Label>
                  <Input
                    id="class-date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class-time">Time *</Label>
                  <Input
                    id="class-time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class-duration">Duration (minutes)</Label>
                  <Input
                    id="class-duration"
                    type="number"
                    min="15"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting-url">Meeting Link</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="meeting-url"
                    className="pl-9"
                    placeholder="https://zoom.us/j/..."
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-attendees">Max Attendees (Optional)</Label>
                <Input
                  id="max-attendees"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={maxAttendees}
                  onChange={(e) => setMaxAttendees(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notify-students">Notify Students</Label>
                  <p className="text-xs text-muted-foreground">Send notification when class is scheduled</p>
                </div>
                <Switch
                  id="notify-students"
                  checked={notifyStudents}
                  onCheckedChange={setNotifyStudents}
                />
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
                  editingClass ? 'Update Class' : 'Schedule Class'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="today">
              Today ({todayClasses.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingClasses.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastClasses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-3">
            {todayClasses.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No classes scheduled for today</p>
              </div>
            ) : (
              todayClasses.map(c => <ClassCard key={c.id} liveClass={c} />)
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-3">
            {upcomingClasses.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No upcoming classes scheduled</p>
                <Button variant="link" onClick={openAddDialog}>
                  Schedule your first class
                </Button>
              </div>
            ) : (
              upcomingClasses.map(c => <ClassCard key={c.id} liveClass={c} />)
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3">
            {pastClasses.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No past classes yet</p>
              </div>
            ) : (
              pastClasses.slice(0, 10).map(c => <ClassCard key={c.id} liveClass={c} />)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
