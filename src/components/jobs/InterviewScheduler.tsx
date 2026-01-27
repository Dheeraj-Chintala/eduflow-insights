import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fromTable } from '@/lib/supabase-helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Plus, Calendar, Video, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import type { Interview, InterviewStatus, JobApplication } from '@/types/jobs';

const interviewSchema = z.object({
  interviewer_name: z.string().min(1, 'Interviewer name is required'),
  interview_type: z.string(),
  scheduled_at: z.string().min(1, 'Date and time is required'),
  duration_minutes: z.coerce.number().min(15).max(480),
  meeting_url: z.string().url().optional().or(z.literal('')),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type InterviewFormData = z.infer<typeof interviewSchema>;

const STATUS_CONFIG: Record<InterviewStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  scheduled: { label: 'Scheduled', variant: 'default' },
  completed: { label: 'Completed', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  no_show: { label: 'No Show', variant: 'outline' },
};

interface InterviewSchedulerProps {
  application: JobApplication;
  onScheduled?: () => void;
}

export default function InterviewScheduler({ application, onScheduled }: InterviewSchedulerProps) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<InterviewFormData>({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      interviewer_name: '',
      interview_type: 'video',
      scheduled_at: '',
      duration_minutes: 60,
      meeting_url: '',
      location: '',
      notes: '',
    },
  });

  useEffect(() => {
    fetchInterviews();
  }, [application.id]);

  async function fetchInterviews() {
    setLoading(true);
    const { data, error } = await fromTable('interviews')
      .select('*')
      .eq('application_id', application.id)
      .order('scheduled_at', { ascending: true });

    if (!error && data) {
      setInterviews(data as Interview[]);
    }
    setLoading(false);
  }

  async function onSubmit(data: InterviewFormData) {
    setScheduling(true);
    try {
      const interviewData = {
        application_id: application.id,
        job_id: application.job_id,
        user_id: application.user_id,
        interviewer_name: data.interviewer_name,
        interview_type: data.interview_type,
        scheduled_at: new Date(data.scheduled_at).toISOString(),
        duration_minutes: data.duration_minutes,
        meeting_url: data.meeting_url || null,
        location: data.location || null,
        notes: data.notes || null,
        status: 'scheduled',
      };

      const { error } = await fromTable('interviews').insert(interviewData);
      if (error) throw error;

      // Update application status
      await fromTable('job_applications')
        .update({ status: 'interview_scheduled' })
        .eq('id', application.id);

      toast.success('Interview scheduled successfully');
      form.reset();
      setDialogOpen(false);
      fetchInterviews();
      onScheduled?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule interview');
    } finally {
      setScheduling(false);
    }
  }

  async function updateInterviewStatus(interviewId: string, status: InterviewStatus, feedback?: string, rating?: number) {
    try {
      const updateData: any = { status };
      if (feedback) updateData.feedback = feedback;
      if (rating) updateData.rating = rating;

      const { error } = await fromTable('interviews')
        .update(updateData)
        .eq('id', interviewId);

      if (error) throw error;
      toast.success('Interview updated');
      fetchInterviews();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update interview');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Interviews</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Interview
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Schedule Interview</DialogTitle>
              <DialogDescription>
                Schedule an interview for this candidate
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="interviewer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interviewer Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="interview_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interview Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="video">Video Call</SelectItem>
                            <SelectItem value="phone">Phone Call</SelectItem>
                            <SelectItem value="in_person">In Person</SelectItem>
                            <SelectItem value="technical">Technical Round</SelectItem>
                            <SelectItem value="hr">HR Round</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" min={15} max={480} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="scheduled_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meeting_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://meet.google.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (for in-person)</FormLabel>
                      <FormControl>
                        <Input placeholder="Office address..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="Any additional notes..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={scheduling}>
                  {scheduling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Schedule Interview
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : interviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No interviews scheduled</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {interviews.map(interview => (
            <Card key={interview.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize">{interview.interview_type.replace('_', ' ')} Interview</span>
                      <Badge variant={STATUS_CONFIG[interview.status].variant}>
                        {STATUS_CONFIG[interview.status].label}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(interview.scheduled_at), 'MMM d, yyyy h:mm a')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {interview.duration_minutes} min
                      </span>
                      {interview.meeting_url && (
                        <a 
                          href={interview.meeting_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Video className="h-4 w-4" />
                          Join Meeting
                        </a>
                      )}
                      {interview.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {interview.location}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Interviewer: {interview.interviewer_name}
                    </p>
                  </div>
                  {interview.status === 'scheduled' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateInterviewStatus(interview.id, 'completed')}
                      >
                        Mark Completed
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateInterviewStatus(interview.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
                {interview.feedback && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Feedback:</p>
                    <p className="text-sm text-muted-foreground">{interview.feedback}</p>
                    {interview.rating && (
                      <p className="text-sm mt-1">Rating: {interview.rating}/5</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
