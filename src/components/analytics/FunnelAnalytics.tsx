import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Users, UserPlus, BookOpen, Play, GraduationCap, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { FunnelStage, TimeRange } from '@/types/analytics';

interface FunnelAnalyticsProps {
  timeRange: TimeRange;
}

export default function FunnelAnalytics({ timeRange }: FunnelAnalyticsProps) {
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFunnelData();
  }, [timeRange]);

  const getDateFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case '7d': return new Date(now.setDate(now.getDate() - 7));
      case '30d': return new Date(now.setDate(now.getDate() - 30));
      case '90d': return new Date(now.setDate(now.getDate() - 90));
      case '1y': return new Date(now.setFullYear(now.getFullYear() - 1));
      default: return null;
    }
  };

  const fetchFunnelData = async () => {
    try {
      setLoading(true);
      const dateFilter = getDateFilter();

      // Fetch leads
      let leadsQuery = supabase.from('franchise_leads').select('id, status');
      if (dateFilter) {
        leadsQuery = leadsQuery.gte('created_at', dateFilter.toISOString());
      }
      const { data: leads } = await leadsQuery;

      // Fetch signups (profiles)
      let profilesQuery = supabase.from('profiles').select('id');
      if (dateFilter) {
        profilesQuery = profilesQuery.gte('created_at', dateFilter.toISOString());
      }
      const { data: profiles } = await profilesQuery;

      // Fetch enrollments
      let enrollmentsQuery = supabase.from('enrollments').select('id, progress, completed_at');
      if (dateFilter) {
        enrollmentsQuery = enrollmentsQuery.gte('enrolled_at', dateFilter.toISOString());
      }
      const { data: enrollments } = await enrollmentsQuery;

      // Fetch certificates
      let certsQuery = supabase.from('certificates').select('id');
      if (dateFilter) {
        certsQuery = certsQuery.gte('issued_at', dateFilter.toISOString());
      }
      const { data: certificates } = await certsQuery;

      const leadsCount = leads?.length || 0;
      const signupsCount = profiles?.length || 0;
      const enrollmentsCount = enrollments?.length || 0;
      const startedCount = enrollments?.filter(e => e.progress > 0).length || 0;
      const completedCount = enrollments?.filter(e => e.progress === 100).length || 0;
      const certifiedCount = certificates?.length || 0;

      const baseCount = Math.max(leadsCount, signupsCount, 1);

      const stages: FunnelStage[] = [
        {
          stage: 'leads',
          label: 'Leads Generated',
          count: leadsCount,
          percentage: 100,
          conversionFromPrevious: 100,
        },
        {
          stage: 'signups',
          label: 'User Signups',
          count: signupsCount,
          percentage: Math.round((signupsCount / baseCount) * 100),
          conversionFromPrevious: leadsCount > 0 ? Math.round((signupsCount / leadsCount) * 100) : 100,
        },
        {
          stage: 'enrollments',
          label: 'Course Enrollments',
          count: enrollmentsCount,
          percentage: Math.round((enrollmentsCount / baseCount) * 100),
          conversionFromPrevious: signupsCount > 0 ? Math.round((enrollmentsCount / signupsCount) * 100) : 0,
        },
        {
          stage: 'started',
          label: 'Started Learning',
          count: startedCount,
          percentage: Math.round((startedCount / baseCount) * 100),
          conversionFromPrevious: enrollmentsCount > 0 ? Math.round((startedCount / enrollmentsCount) * 100) : 0,
        },
        {
          stage: 'completed',
          label: 'Course Completed',
          count: completedCount,
          percentage: Math.round((completedCount / baseCount) * 100),
          conversionFromPrevious: startedCount > 0 ? Math.round((completedCount / startedCount) * 100) : 0,
        },
        {
          stage: 'certified',
          label: 'Certified',
          count: certifiedCount,
          percentage: Math.round((certifiedCount / baseCount) * 100),
          conversionFromPrevious: completedCount > 0 ? Math.round((certifiedCount / completedCount) * 100) : 0,
        },
      ];

      setFunnelStages(stages);
    } catch (error) {
      console.error('Error fetching funnel data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stageIcons = {
    leads: Users,
    signups: UserPlus,
    enrollments: BookOpen,
    started: Play,
    completed: GraduationCap,
    certified: Award,
  };

  const stageColors = {
    leads: 'bg-primary',
    signups: 'bg-info',
    enrollments: 'bg-accent',
    started: 'bg-warning',
    completed: 'bg-success',
    certified: 'bg-primary',
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  const overallConversion = funnelStages.length > 0 && funnelStages[0].count > 0
    ? Math.round((funnelStages[funnelStages.length - 1].count / funnelStages[0].count) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Track the journey from leads to certified learners</CardDescription>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {overallConversion}% Overall Conversion
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Visual Funnel */}
        <div className="space-y-4">
          {funnelStages.map((stage, index) => {
            const Icon = stageIcons[stage.stage as keyof typeof stageIcons] || Users;
            const bgColor = stageColors[stage.stage as keyof typeof stageColors] || 'bg-muted';
            const widthPercent = Math.max(20, stage.percentage);

            return (
              <div key={stage.stage} className="relative">
                {/* Conversion Arrow */}
                {index > 0 && (
                  <div className="flex items-center justify-center py-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ArrowRight className="h-4 w-4" />
                      <span>{stage.conversionFromPrevious}% converted</span>
                    </div>
                  </div>
                )}
                
                {/* Stage Bar */}
                <div 
                  className={`relative rounded-lg ${bgColor} transition-all duration-500`}
                  style={{ width: `${widthPercent}%`, marginLeft: `${(100 - widthPercent) / 2}%` }}
                >
                  <div className="flex items-center justify-between px-4 py-4 text-primary-foreground">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{stage.label}</p>
                        <p className="text-sm opacity-80">{stage.percentage}% of total</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{stage.count.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stage Comparison */}
        <div className="mt-8 pt-6 border-t">
          <h4 className="font-semibold mb-4">Stage-by-Stage Conversion</h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {funnelStages.slice(1).map((stage, index) => {
              const prevStage = funnelStages[index];
              const drop = prevStage.count - stage.count;
              const dropPercent = prevStage.count > 0 
                ? Math.round((drop / prevStage.count) * 100) 
                : 0;

              return (
                <div key={stage.stage} className="p-4 rounded-lg bg-secondary/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{prevStage.label} → {stage.label}</span>
                    <Badge 
                      variant={stage.conversionFromPrevious >= 70 ? 'default' : stage.conversionFromPrevious >= 40 ? 'secondary' : 'destructive'}
                    >
                      {stage.conversionFromPrevious}%
                    </Badge>
                  </div>
                  <Progress value={stage.conversionFromPrevious} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {drop.toLocaleString()} dropped ({dropPercent}%)
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
