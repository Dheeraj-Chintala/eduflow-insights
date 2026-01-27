import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Award, Star, Flame, Target, BookOpen, MessageSquare, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface BadgeData {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  badge_type: string;
  points_required: number;
  earned_at?: string;
}

const badgeIcons: Record<string, React.ReactNode> = {
  achievement: <Trophy className="h-6 w-6" />,
  engagement: <MessageSquare className="h-6 w-6" />,
  streak: <Flame className="h-6 w-6" />,
  points: <Star className="h-6 w-6" />,
};

const badgeColors: Record<string, string> = {
  achievement: 'from-blue-400 to-blue-600',
  engagement: 'from-purple-400 to-purple-600',
  streak: 'from-orange-400 to-orange-600',
  points: 'from-yellow-400 to-yellow-600',
};

export const BadgesDisplay: React.FC = () => {
  const { user } = useAuth();
  const [allBadges, setAllBadges] = useState<BadgeData[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBadges();
    }
  }, [user]);

  const fetchBadges = async () => {
    setIsLoading(true);
    try {
      // Fetch all badges
      const { data: badges } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true)
        .order('badge_type', { ascending: true });

      // Fetch user's earned badges
      const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id, earned_at')
        .eq('user_id', user?.id);

      const earnedSet = new Set(userBadges?.map(ub => ub.badge_id) || []);
      const earnedMap = new Map(userBadges?.map(ub => [ub.badge_id, ub.earned_at]) || []);

      setAllBadges(
        (badges || []).map(badge => ({
          ...badge,
          earned_at: earnedMap.get(badge.id)
        }))
      );
      setEarnedBadges(earnedSet);
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const earnedCount = earnedBadges.size;
  const totalCount = allBadges.length;
  const progressPercent = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Badges & Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          Badges & Achievements
        </CardTitle>
        <CardDescription>
          {earnedCount} of {totalCount} badges earned
        </CardDescription>
        <Progress value={progressPercent} className="h-2 mt-2" />
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
            {allBadges.map((badge) => {
              const isEarned = earnedBadges.has(badge.id);
              
              return (
                <Tooltip key={badge.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`relative flex items-center justify-center h-16 w-16 rounded-full cursor-pointer transition-all ${
                        isEarned
                          ? `bg-gradient-to-br ${badgeColors[badge.badge_type] || 'from-gray-400 to-gray-600'} text-white shadow-lg hover:scale-110`
                          : 'bg-muted text-muted-foreground opacity-50 hover:opacity-75'
                      }`}
                    >
                      {badge.icon_url ? (
                        <img src={badge.icon_url} alt={badge.name} className="h-8 w-8" />
                      ) : (
                        badgeIcons[badge.badge_type] || <Target className="h-6 w-6" />
                      )}
                      {isEarned && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                          <Star className="h-3 w-3 text-white fill-white" />
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <div className="text-center">
                      <p className="font-semibold">{badge.name}</p>
                      <p className="text-xs text-muted-foreground">{badge.description}</p>
                      {isEarned && badge.earned_at && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Earned {new Date(badge.earned_at).toLocaleDateString()}
                        </Badge>
                      )}
                      {!isEarned && badge.points_required > 0 && (
                        <p className="text-xs mt-1">Requires {badge.points_required} points</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};
