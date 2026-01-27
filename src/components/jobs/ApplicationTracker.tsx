import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fromTable } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import type { JobApplication, JobApplicationStatus } from '@/types/jobs';

const STATUS_CONFIG: Record<JobApplicationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  shortlisted: { label: 'Shortlisted', variant: 'default' },
  interview_scheduled: { label: 'Interview Scheduled', variant: 'default' },
  selected: { label: 'Selected', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  withdrawn: { label: 'Withdrawn', variant: 'outline' },
};

export default function ApplicationTracker() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  async function fetchApplications() {
    if (!user) return;

    setLoading(true);
    const { data, error } = await fromTable('job_applications')
      .select(`
        *,
        job:job_postings(
          *,
          employer:employers(*)
        )
      `)
      .eq('user_id', user.id)
      .order('applied_at', { ascending: false });

    if (!error && data) {
      setApplications(data as JobApplication[]);
    }
    setLoading(false);
  }

  const filteredApplications = applications.filter(app => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return ['pending', 'shortlisted', 'interview_scheduled'].includes(app.status);
    if (activeTab === 'completed') return ['selected', 'rejected', 'withdrawn'].includes(app.status);
    return app.status === activeTab;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    interviews: applications.filter(a => a.status === 'interview_scheduled').length,
    selected: applications.filter(a => a.status === 'selected').length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Applications</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.shortlisted}</div>
            <p className="text-sm text-muted-foreground">Shortlisted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.interviews}</div>
            <p className="text-sm text-muted-foreground">Interviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.selected}</div>
            <p className="text-sm text-muted-foreground">Selected</p>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No applications found</h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === 'all' 
                    ? "You haven't applied to any jobs yet"
                    : `No ${activeTab} applications`}
                </p>
                <Button onClick={() => navigate('/jobs')}>Browse Jobs</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map(application => (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {application.job?.title || 'Unknown Position'}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Building2 className="h-4 w-4" />
                          {application.job?.employer?.company_name || 'Unknown Company'}
                        </CardDescription>
                      </div>
                      <Badge variant={STATUS_CONFIG[application.status].variant}>
                        {STATUS_CONFIG[application.status].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      {application.job?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {application.job.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Applied {formatDistanceToNow(new Date(application.applied_at), { addSuffix: true })}
                      </span>
                      {application.reviewed_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Reviewed on {format(new Date(application.reviewed_at), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>

                    {application.employer_notes && application.status !== 'pending' && (
                      <div className="bg-muted p-3 rounded-lg mb-4">
                        <p className="text-sm font-medium mb-1">Employer Feedback:</p>
                        <p className="text-sm text-muted-foreground">{application.employer_notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/jobs/${application.job_id}`)}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Job
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
