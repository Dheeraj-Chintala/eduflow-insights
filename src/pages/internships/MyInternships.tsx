import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Briefcase, 
  Clock, 
  Calendar,
  ArrowRight,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { fromTable } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import type { InternshipEnrollment, InternshipApplication, Internship } from '@/types/internship';
import { format } from 'date-fns';

interface EnrollmentWithInternship extends InternshipEnrollment {
  internship?: Internship;
}

interface ApplicationWithInternship extends InternshipApplication {
  internship?: Internship;
}

export default function MyInternships() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentWithInternship[]>([]);
  const [applications, setApplications] = useState<ApplicationWithInternship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await fromTable('internship_enrollments')
        .select('*')
        .eq('user_id', user?.id)
        .order('enrolled_at', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;

      // Fetch applications
      const { data: applicationsData, error: applicationsError } = await fromTable('internship_applications')
        .select('*')
        .eq('user_id', user?.id)
        .order('applied_at', { ascending: false });

      if (applicationsError) throw applicationsError;

      // Get all internship IDs
      const internshipIds = [
        ...new Set([
          ...(enrollmentsData || []).map(e => e.internship_id),
          ...(applicationsData || []).map(a => a.internship_id),
        ])
      ];

      // Fetch internships
      const { data: internshipsData } = await fromTable('internships')
        .select('*')
        .in('id', internshipIds);

      // Merge data
      const enrichedEnrollments = (enrollmentsData || []).map(e => ({
        ...e,
        internship: internshipsData?.find(i => i.id === e.internship_id),
      }));

      const enrichedApplications = (applicationsData || []).map(a => ({
        ...a,
        internship: internshipsData?.find(i => i.id === a.internship_id),
      }));

      setEnrollments(enrichedEnrollments);
      setApplications(enrichedApplications);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load your internships');
    } finally {
      setLoading(false);
    }
  };

  const getApplicationStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-500/10 text-green-600">Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-600">Rejected</Badge>;
      case 'withdrawn':
        return <Badge className="bg-gray-500/10 text-gray-600">Withdrawn</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </AppLayout>
    );
  }

  const activeEnrollments = enrollments.filter(e => !e.is_completed);
  const completedEnrollments = enrollments.filter(e => e.is_completed);

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Internships</h1>
          <p className="text-muted-foreground mt-1">
            Track your internship applications and progress
          </p>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">Active ({activeEnrollments.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedEnrollments.length})</TabsTrigger>
            <TabsTrigger value="applications">Applications ({applications.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeEnrollments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active internships</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate('/internships')}
                  >
                    Browse Internships
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeEnrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">
                            {enrollment.internship?.title || 'Internship'}
                          </h3>
                          {enrollment.internship?.department && (
                            <p className="text-muted-foreground">
                              {enrollment.internship.department}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Started: {format(new Date(enrollment.start_date), 'MMM dd, yyyy')}</span>
                            </div>
                            {enrollment.expected_end_date && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>Ends: {format(new Date(enrollment.expected_end_date), 'MMM dd, yyyy')}</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Progress</span>
                              <span className="font-medium">{enrollment.progress}%</span>
                            </div>
                            <Progress value={enrollment.progress} className="h-2" />
                          </div>
                        </div>
                        <Button 
                          onClick={() => navigate(`/internships/${enrollment.internship_id}`)}
                        >
                          Continue
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedEnrollments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No completed internships yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedEnrollments.map((enrollment) => (
                  <Card key={enrollment.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">
                              {enrollment.internship?.title || 'Internship'}
                            </h3>
                            <Badge className="bg-green-500/10 text-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          </div>
                          {enrollment.internship?.department && (
                            <p className="text-muted-foreground">
                              {enrollment.internship.department}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground mt-2">
                            Completed on {enrollment.completed_at ? format(new Date(enrollment.completed_at), 'MMM dd, yyyy') : 'N/A'}
                          </p>
                        </div>
                        <Button variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          View Certificate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications">
            {applications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No applications yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate('/internships')}
                  >
                    Browse Internships
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <Card key={application.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">
                              {application.internship?.title || 'Internship'}
                            </h3>
                            {getApplicationStatusBadge(application.status)}
                          </div>
                          {application.internship?.department && (
                            <p className="text-muted-foreground">
                              {application.internship.department}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground mt-2">
                            Applied on {format(new Date(application.applied_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Button 
                          variant="outline"
                          onClick={() => navigate(`/internships/${application.internship_id}`)}
                        >
                          View Details
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
    </AppLayout>
  );
}
