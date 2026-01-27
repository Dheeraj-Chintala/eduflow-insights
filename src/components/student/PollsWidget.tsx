import { useEffect, useState } from 'react';
import { BarChart2, Vote, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { fromTable } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import type { Poll, PollOption, PollVote } from '@/types/database';

interface PollWithDetails extends Poll {
  options: PollOption[];
  user_vote?: PollVote;
}

interface PollsWidgetProps {
  courseId: string;
}

export function PollsWidget({ courseId }: PollsWidgetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [polls, setPolls] = useState<PollWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [votingPollId, setVotingPollId] = useState<string | null>(null);

  useEffect(() => {
    fetchPolls();
  }, [courseId, user]);

  const fetchPolls = async () => {
    try {
      const { data: pollsData } = await fromTable('polls')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!pollsData || pollsData.length === 0) {
        setIsLoading(false);
        return;
      }

      const pollIds = (pollsData as Poll[]).map(p => p.id);

      // Fetch options
      const { data: optionsData } = await fromTable('poll_options')
        .select('*')
        .in('poll_id', pollIds)
        .order('sort_order', { ascending: true });

      // Fetch user's votes
      let userVotes: PollVote[] = [];
      if (user) {
        const { data: votesData } = await fromTable('poll_votes')
          .select('*')
          .in('poll_id', pollIds);
        userVotes = (votesData as PollVote[]) || [];
      }

      const optionsByPoll = new Map<string, PollOption[]>();
      (optionsData as PollOption[] || []).forEach(opt => {
        if (!optionsByPoll.has(opt.poll_id)) {
          optionsByPoll.set(opt.poll_id, []);
        }
        optionsByPoll.get(opt.poll_id)!.push(opt);
      });

      const voteByPoll = new Map(userVotes.map(v => [v.poll_id, v]));

      const pollsWithDetails: PollWithDetails[] = (pollsData as Poll[]).map(poll => ({
        ...poll,
        options: optionsByPoll.get(poll.id) || [],
        user_vote: voteByPoll.get(poll.id),
      }));

      setPolls(pollsWithDetails);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    if (!user) return;

    setVotingPollId(pollId);
    try {
      // Insert vote
      const { error: voteError } = await fromTable('poll_votes')
        .insert({
          poll_id: pollId,
          option_id: optionId,
          user_id: user.id,
        });

      if (voteError) throw voteError;

      // Update vote count
      const { error: updateError } = await fromTable('poll_options')
        .update({ vote_count: await getNewVoteCount(optionId) })
        .eq('id', optionId);

      if (updateError) throw updateError;

      toast({
        title: 'Vote recorded',
        description: 'Thank you for your participation!',
      });

      fetchPolls();
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: 'Already voted',
          description: 'You can only vote once per poll.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to record vote. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setVotingPollId(null);
    }
  };

  const getNewVoteCount = async (optionId: string): Promise<number> => {
    const { data } = await fromTable('poll_options')
      .select('vote_count')
      .eq('id', optionId)
      .single();
    return ((data as any)?.vote_count || 0) + 1;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Polls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (polls.length === 0) {
    return null; // Don't render if no active polls
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart2 className="h-5 w-5" />
          Polls & Surveys
        </CardTitle>
        <CardDescription>Share your feedback</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {polls.map((poll) => {
          const totalVotes = poll.options.reduce((sum, opt) => sum + opt.vote_count, 0);
          const hasVoted = !!poll.user_vote;
          const isExpired = poll.ends_at && new Date(poll.ends_at) < new Date();

          return (
            <div key={poll.id} className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium">{poll.title}</h4>
                  {poll.description && (
                    <p className="text-sm text-muted-foreground">{poll.description}</p>
                  )}
                </div>
                {isExpired && (
                  <Badge variant="outline" className="shrink-0">
                    <Clock className="h-3 w-3 mr-1" />
                    Ended
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                {poll.options.map((option) => {
                  const percentage = totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0;
                  const isUserVote = poll.user_vote?.option_id === option.id;

                  if (hasVoted || isExpired) {
                    return (
                      <div key={option.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            {option.option_text}
                            {isUserVote && (
                              <CheckCircle className="h-4 w-4 text-success" />
                            )}
                          </span>
                          <span className="font-medium">{percentage}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  }

                  return (
                    <Button
                      key={option.id}
                      variant="outline"
                      className="w-full justify-start"
                      disabled={votingPollId === poll.id}
                      onClick={() => handleVote(poll.id, option.id)}
                    >
                      <Vote className="h-4 w-4 mr-2" />
                      {option.option_text}
                    </Button>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground">
                {totalVotes} vote{totalVotes !== 1 ? 's' : ''} • 
                Created {formatDistanceToNow(new Date(poll.created_at), { addSuffix: true })}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
