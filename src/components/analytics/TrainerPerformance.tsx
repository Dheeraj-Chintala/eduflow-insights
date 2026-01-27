import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Users, BookOpen, TrendingUp, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { TrainerStats, TimeRange } from '@/types/analytics';

interface TrainerPerformanceProps {
  timeRange: TimeRange;
}

export default function TrainerPerformance({ timeRange }: TrainerPerformanceProps) {
  const [trainers, setTrainers] = useState<TrainerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalTrainers: 0,
    totalCourses: 0,
    averageRating: 0,
    topPerformer: '',
  });

  useEffect(() => {
    fetchTrainerData();
  }, [timeRange]);

  const fetchTrainerData = async () => {
    try {
      setLoading(true);

      // Get all trainers (users with trainer/mentor role)
      const { data: trainerRoles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['trainer', 'mentor']);

      if (!trainerRoles || trainerRoles.length === 0) {
        setTrainers([]);
        setLoading(false);
        return;
      }

      const trainerIds = [...new Set(trainerRoles.map(r => r.user_id))];

      // Get trainer profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', trainerIds);

      // Get courses by trainers
      const { data: courses } = await supabase
        .from('courses')
        .select('id, instructor_id, status')
        .in('instructor_id', trainerIds);

      // Get enrollments for trainer courses
      const courseIds = courses?.map(c => c.id) || [];
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('id, course_id, progress')
        .in('course_id', courseIds);

      // Get ratings for trainer courses
      const { data: ratings } = await supabase
        .from('course_ratings')
        .select('course_id, rating')
        .in('course_id', courseIds);

      // Get instructor revenue
      const { data: revenue } = await supabase
        .from('instructor_revenue')
        .select('instructor_id, instructor_amount')
        .in('instructor_id', trainerIds);

      // Process trainer stats
      const trainerStats: TrainerStats[] = trainerIds.map(trainerId => {
        const profile = profiles?.find(p => p.id === trainerId);
        const trainerCourses = courses?.filter(c => c.instructor_id === trainerId) || [];
        const courseIdsForTrainer = trainerCourses.map(c => c.id);
        const trainerEnrollments = enrollments?.filter(e => courseIdsForTrainer.includes(e.course_id)) || [];
        const trainerRatings = ratings?.filter(r => courseIdsForTrainer.includes(r.course_id)) || [];
        const trainerRevenue = revenue?.filter(r => r.instructor_id === trainerId) || [];

        const completedEnrollments = trainerEnrollments.filter(e => e.progress === 100).length;
        const avgRating = trainerRatings.length > 0
          ? trainerRatings.reduce((sum, r) => sum + r.rating, 0) / trainerRatings.length
          : 0;
        const totalRevenue = trainerRevenue.reduce((sum, r) => sum + (r.instructor_amount || 0), 0);

        return {
          trainerId,
          trainerName: profile?.full_name || 'Unknown Trainer',
          avatarUrl: profile?.avatar_url || undefined,
          totalCourses: trainerCourses.length,
          publishedCourses: trainerCourses.filter(c => c.status === 'published').length,
          totalStudents: new Set(trainerEnrollments.map(e => e.course_id)).size ? trainerEnrollments.length : 0,
          averageRating: Math.round(avgRating * 10) / 10,
          totalRatings: trainerRatings.length,
          completionRate: trainerEnrollments.length > 0
            ? Math.round((completedEnrollments / trainerEnrollments.length) * 100)
            : 0,
          revenueGenerated: totalRevenue,
        };
      });

      // Sort by total students (most engaged trainers first)
      const sortedTrainers = trainerStats.sort((a, b) => b.totalStudents - a.totalStudents);
      setTrainers(sortedTrainers);

      // Calculate summary
      const totalRatings = sortedTrainers.reduce((sum, t) => sum + t.totalRatings, 0);
      const weightedRating = sortedTrainers.reduce((sum, t) => sum + (t.averageRating * t.totalRatings), 0);
      
      setSummary({
        totalTrainers: sortedTrainers.length,
        totalCourses: sortedTrainers.reduce((sum, t) => sum + t.totalCourses, 0),
        averageRating: totalRatings > 0 ? Math.round((weightedRating / totalRatings) * 10) / 10 : 0,
        topPerformer: sortedTrainers[0]?.trainerName || 'N/A',
      });
    } catch (error) {
      console.error('Error fetching trainer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.round(rating)
                ? 'text-warning fill-warning'
                : 'text-muted-foreground'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">({rating})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const summaryCards = [
    { label: 'Total Trainers', value: summary.totalTrainers, icon: Users, color: 'text-primary' },
    { label: 'Total Courses', value: summary.totalCourses, icon: BookOpen, color: 'text-accent' },
    { label: 'Avg. Rating', value: summary.averageRating, icon: Star, color: 'text-warning' },
    { label: 'Top Performer', value: summary.topPerformer, icon: Award, color: 'text-success' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trainer Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trainer Performance Overview
          </CardTitle>
          <CardDescription>Performance metrics for all trainers and mentors</CardDescription>
        </CardHeader>
        <CardContent>
          {trainers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No trainer data available</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trainer</TableHead>
                  <TableHead className="text-center">Courses</TableHead>
                  <TableHead className="text-center">Students</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-center">Completion Rate</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainers.map((trainer, index) => (
                  <TableRow key={trainer.trainerId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {index < 3 && (
                          <Badge 
                            variant={index === 0 ? 'default' : 'secondary'}
                            className={index === 0 ? 'bg-warning text-warning-foreground' : ''}
                          >
                            #{index + 1}
                          </Badge>
                        )}
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={trainer.avatarUrl} />
                          <AvatarFallback className="text-xs">
                            {getInitials(trainer.trainerName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{trainer.trainerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {trainer.publishedCourses} published
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{trainer.totalCourses}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{trainer.totalStudents}</TableCell>
                    <TableCell>
                      {trainer.totalRatings > 0 ? (
                        renderRatingStars(trainer.averageRating)
                      ) : (
                        <span className="text-sm text-muted-foreground">No ratings</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={trainer.completionRate >= 70 ? 'default' : trainer.completionRate >= 40 ? 'secondary' : 'outline'}
                        className={trainer.completionRate >= 70 ? 'bg-success text-success-foreground' : ''}
                      >
                        {trainer.completionRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{trainer.revenueGenerated.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
