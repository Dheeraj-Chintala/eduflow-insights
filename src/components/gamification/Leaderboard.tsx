import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LeaderboardEntry {
  user_id: string;
  rank: number;
  points: number;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

type Period = 'daily' | 'weekly' | 'monthly' | 'all_time';

export const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('weekly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('leaderboard_cache')
        .select(`
          user_id,
          rank,
          points,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('period', period)
        .order('rank', { ascending: true })
        .limit(50);

      if (error) throw error;

      const formatted = (data || []).map(entry => ({
        user_id: entry.user_id,
        rank: entry.rank,
        points: entry.points,
        profile: Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles
      }));

      setEntries(formatted);

      // Find current user's rank
      if (user) {
        const userEntry = formatted.find(e => e.user_id === user.id);
        setUserRank(userEntry?.rank || null);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <span className="w-5 text-center font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300';
      case 2: return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300';
      case 3: return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300';
      default: return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="grid grid-cols-4 w-full mb-4">
            <TabsTrigger value="daily">Today</TabsTrigger>
            <TabsTrigger value="weekly">Week</TabsTrigger>
            <TabsTrigger value="monthly">Month</TabsTrigger>
            <TabsTrigger value="all_time">All Time</TabsTrigger>
          </TabsList>

          <TabsContent value={period} className="space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16 ml-auto" />
                </div>
              ))
            ) : entries.length > 0 ? (
              <>
                {entries.map((entry) => (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      entry.user_id === user?.id ? 'ring-2 ring-primary' : ''
                    } ${getRankStyle(entry.rank)}`}
                  >
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(entry.rank)}
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.profile?.avatar_url || ''} />
                      <AvatarFallback>
                        {entry.profile?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="font-medium">
                        {entry.profile?.full_name || 'Anonymous'}
                        {entry.user_id === user?.id && (
                          <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      {entry.points.toLocaleString()} pts
                    </div>
                  </div>
                ))}

                {userRank && userRank > 50 && (
                  <div className="text-center py-4 text-muted-foreground">
                    Your rank: #{userRank}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No rankings yet. Start learning to earn points!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
