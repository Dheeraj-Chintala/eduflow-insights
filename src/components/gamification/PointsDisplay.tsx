import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Flame, TrendingUp, Star, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserPointsData {
  total_points: number;
  level: number;
  streak_days: number;
  last_activity_date: string | null;
}

const POINTS_PER_LEVEL = 500;

export const PointsDisplay: React.FC = () => {
  const { user } = useAuth();
  const [pointsData, setPointsData] = useState<UserPointsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserPoints();
    }
  }, [user]);

  const fetchUserPoints = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPointsData(data);
      } else {
        // Initialize user points if not exists
        const { data: newData } = await supabase
          .from('user_points')
          .insert({ user_id: user?.id, total_points: 0, level: 1, streak_days: 0 })
          .select()
          .single();
        setPointsData(newData);
      }
    } catch (error) {
      console.error('Failed to fetch user points:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pointsData) return null;

  const levelProgress = (pointsData.total_points % POINTS_PER_LEVEL) / POINTS_PER_LEVEL * 100;
  const pointsToNextLevel = POINTS_PER_LEVEL - (pointsData.total_points % POINTS_PER_LEVEL);

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-yellow-500" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {/* Level Badge */}
            <div className="relative">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">{pointsData.level}</div>
                  <div className="text-[10px] uppercase tracking-wider opacity-80">Level</div>
                </div>
              </div>
              <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                <Star className="h-3 w-3 text-yellow-900 fill-current" />
              </div>
            </div>

            {/* Points & Progress */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-2xl font-bold">{pointsData.total_points.toLocaleString()}</span>
                  <span className="text-muted-foreground text-sm">points</span>
                </div>
                {pointsData.streak_days > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    {pointsData.streak_days} day streak
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1">
                <Progress value={levelProgress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Level {pointsData.level}</span>
                  <span className="flex items-center gap-1">
                    <ChevronUp className="h-3 w-3" />
                    {pointsToNextLevel} pts to Level {pointsData.level + 1}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
