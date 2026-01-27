import { useEffect, useState } from 'react';
import { HelpCircle, Plus, CheckCircle, Clock, AlertCircle, User, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { fromTable } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import type { Doubt, Profile, DoubtStatus, DoubtPriority } from '@/types/database';

interface DoubtWithAuthor extends Doubt {
  author?: Profile;
}

interface DoubtsSystemProps {
  courseId: string;
  lessonId?: string;
}

const statusConfig: Record<DoubtStatus, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: 'Open', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  answered: { label: 'Answered', color: 'bg-info/10 text-info border-info/20', icon: MessageSquare },
  resolved: { label: 'Resolved', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle },
};

const priorityConfig: Record<DoubtPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-muted text-muted-foreground' },
  normal: { label: 'Normal', color: 'bg-primary/10 text-primary' },
  high: { label: 'High', color: 'bg-destructive/10 text-destructive' },
};

export function DoubtsSystem({ courseId, lessonId }: DoubtsSystemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [doubts, setDoubts] = useState<DoubtWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<DoubtPriority>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDoubts();
  }, [courseId, lessonId]);

  const fetchDoubts = async () => {
    try {
      let query = fromTable('doubts')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      }

      const { data } = await query;

      if (data) {
        const userIds = [...new Set((data as Doubt[]).map(d => d.user_id))];
        const { data: profiles } = await fromTable('profiles')
          .select('*')
          .in('user_id', userIds);

        const profileMap = new Map((profiles as Profile[] || []).map(p => [p.user_id, p]));
        
        const doubtsWithAuthors = (data as Doubt[]).map(doubt => ({
          ...doubt,
          author: profileMap.get(doubt.user_id),
        }));

        setDoubts(doubtsWithAuthors);
      }
    } catch (error) {
      console.error('Error fetching doubts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDoubt = async () => {
    if (!newTitle.trim() || !newDescription.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await fromTable('doubts')
        .insert({
          course_id: courseId,
          lesson_id: lessonId || null,
          user_id: user.id,
          title: newTitle.trim(),
          description: newDescription.trim(),
          priority: newPriority,
        });

      if (error) throw error;

      toast({
        title: 'Doubt submitted',
        description: 'Your question has been submitted for review.',
      });

      setNewTitle('');
      setNewDescription('');
      setNewPriority('normal');
      setIsCreateOpen(false);
      fetchDoubts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit doubt. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Raise a Doubt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Raise a Doubt
          </CardTitle>
          <CardDescription>Get help from instructors and mentors</CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-1" />
              Ask Question
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Raise a Doubt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="doubt-title">Title</Label>
                <Input
                  id="doubt-title"
                  placeholder="Summarize your question..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doubt-description">Description</Label>
                <Textarea
                  id="doubt-description"
                  placeholder="Describe your doubt in detail..."
                  rows={5}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doubt-priority">Priority</Label>
                <Select value={newPriority} onValueChange={(v) => setNewPriority(v as DoubtPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Can wait</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High - Blocking progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleCreateDoubt} 
                disabled={isSubmitting || !newTitle.trim() || !newDescription.trim()}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Doubt'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {doubts.length === 0 ? (
          <div className="text-center py-8">
            <HelpCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No doubts raised yet. Ask a question if you need help!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {doubts.map((doubt) => {
              const status = statusConfig[doubt.status];
              const priority = priorityConfig[doubt.priority];
              const StatusIcon = status.icon;

              return (
                <div 
                  key={doubt.id}
                  className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={doubt.author?.avatar_url || ''} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-medium">{doubt.title}</h4>
                        <Badge variant="outline" className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                        <Badge variant="outline" className={priority.color}>
                          {priority.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {doubt.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{doubt.author?.full_name || 'Anonymous'}</span>
                        <span>{formatDistanceToNow(new Date(doubt.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
