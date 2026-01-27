import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookOpen, 
  Users, 
  Video, 
  FileCheck, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  Clock
} from 'lucide-react';
import type { InstructorStats } from '@/types/instructor';

interface InstructorStatsCardsProps {
  stats: InstructorStats | null;
  isLoading: boolean;
}

export function InstructorStatsCards({ stats, isLoading }: InstructorStatsCardsProps) {
  const statItems = [
    {
      title: 'Total Courses',
      value: stats?.totalCourses ?? 0,
      icon: <BookOpen className="h-5 w-5" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Published',
      value: stats?.publishedCourses ?? 0,
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Total Students',
      value: stats?.totalEnrollments ?? 0,
      icon: <Users className="h-5 w-5" />,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      title: 'Active Batches',
      value: stats?.activeBatches ?? 0,
      icon: <Calendar className="h-5 w-5" />,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Upcoming Classes',
      value: stats?.upcomingClasses ?? 0,
      icon: <Video className="h-5 w-5" />,
      color: 'text-accent-foreground',
      bgColor: 'bg-accent/50',
    },
    {
      title: 'Pending Grading',
      value: stats?.pendingAssignments ?? 0,
      icon: <FileCheck className="h-5 w-5" />,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      title: 'Completion Rate',
      value: `${stats?.completionRate ?? 0}%`,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Drafts',
      value: stats?.draftCourses ?? 0,
      icon: <Clock className="h-5 w-5" />,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <Card key={index} className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">{item.title}</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground mt-1">{item.value}</p>
                )}
              </div>
              <div className={`h-10 w-10 rounded-lg ${item.bgColor} flex items-center justify-center ${item.color}`}>
                {item.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
