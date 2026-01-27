import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Plus, Pin, Lock, MessageCircle, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { fromTable } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import type { DiscussionTopic, Profile } from '@/types/database';

interface DiscussionTopicWithAuthor extends DiscussionTopic {
  author?: Profile;
}

interface DiscussionForumProps {
  courseId: string;
}

export function DiscussionForum({ courseId }: DiscussionForumProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [topics, setTopics] = useState<DiscussionTopicWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, [courseId]);

  const fetchTopics = async () => {
    try {
      const { data } = await fromTable('discussion_topics')
        .select('*')
        .eq('course_id', courseId)
        .order('is_pinned', { ascending: false })
        .order('last_reply_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (data) {
        // Fetch authors for topics
        const userIds = [...new Set((data as DiscussionTopic[]).map(t => t.user_id))];
        const { data: profiles } = await fromTable('profiles')
          .select('*')
          .in('user_id', userIds);

        const profileMap = new Map((profiles as Profile[] || []).map(p => [p.user_id, p]));
        
        const topicsWithAuthors = (data as DiscussionTopic[]).map(topic => ({
          ...topic,
          author: profileMap.get(topic.user_id),
        }));

        setTopics(topicsWithAuthors);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!newTitle.trim() || !newContent.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await fromTable('discussion_topics')
        .insert({
          course_id: courseId,
          user_id: user.id,
          title: newTitle.trim(),
          content: newContent.trim(),
        });

      if (error) throw error;

      toast({
        title: 'Topic created',
        description: 'Your discussion topic has been posted.',
      });

      setNewTitle('');
      setNewContent('');
      setIsCreateOpen(false);
      fetchTopics();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create topic. Please try again.',
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
            <MessageSquare className="h-5 w-5" />
            Discussion Forum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
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
            <MessageSquare className="h-5 w-5" />
            Discussion Forum
          </CardTitle>
          <CardDescription>Ask questions and share knowledge</CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-1" />
              New Topic
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Topic</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="What's your question?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Provide more details..."
                  rows={5}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleCreateTopic} 
                disabled={isSubmitting || !newTitle.trim() || !newContent.trim()}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                {isSubmitting ? 'Creating...' : 'Create Topic'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {topics.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No discussions yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topics.map((topic) => (
              <Link 
                key={topic.id} 
                to={`/courses/${courseId}/discussions/${topic.id}`}
                className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={topic.author?.avatar_url || ''} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {topic.is_pinned && (
                        <Pin className="h-3 w-3 text-primary shrink-0" />
                      )}
                      {topic.is_locked && (
                        <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                      <h4 className="font-medium truncate">{topic.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {topic.content}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{topic.author?.full_name || 'Anonymous'}</span>
                      <span>{formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}</span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {topic.reply_count}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
