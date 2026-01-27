import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Edit2, 
  MapPin, 
  Clock, 
  IndianRupee, 
  Users,
  Calendar,
  Briefcase,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { fromTable } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import { InternshipForm } from '@/components/internships/InternshipForm';
import { InternshipTaskManager } from '@/components/internships/InternshipTaskManager';
import { ApplicationManager } from '@/components/internships/ApplicationManager';
import { InternshipProgress } from '@/components/internships/InternshipProgress';
import type { Internship } from '@/types/internship';
import { format } from 'date-fns';

export default function InternshipDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, primaryRole } = useAuth();
  const [internship, setInternship] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);

  const isMentor = internship?.mentor_id === user?.id || internship?.created_by === user?.id;
  const canManage = isMentor || ['super_admin', 'admin'].includes(primaryRole || '');
  const isStudent = primaryRole === 'student';

  useEffect(() => {
    if (id) {
      fetchInternship();
      checkUserStatus();
    }
  }, [id, user]);

  const fetchInternship = async () => {
    try {
      const { data, error } = await fromTable('internships')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setInternship(data);
    } catch (error) {
      console.error('Error fetching internship:', error);
      toast.error('Failed to load internship');
      navigate('/internships');
    } finally {
      setLoading(false);
    }
  };

  const checkUserStatus = async () => {
    if (!user || !id) return;

    // Check if applied
    const { data: application } = await fromTable('internship_applications')
      .select('id')
      .eq('internship_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    setHasApplied(!!application);

    // Check if enrolled
    const { data: enrollment } = await fromTable('internship_enrollments')
      .select('id')
      .eq('internship_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    setIsEnrolled(!!enrollment);
    setEnrollmentId(enrollment?.id || null);
  };

  const handleApply = async () => {
    if (!user || !id) return;

    try {
      const { error } = await fromTable('internship_applications').insert({
        internship_id: id,
        user_id: user.id,
        status: 'pending',
      });

      if (error) throw error;
      toast.success('Application submitted successfully');
      setHasApplied(true);
    } catch (error: any) {
      console.error('Error applying:', error);
      toast.error(error.message || 'Failed to submit application');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-600';
      case 'draft': return 'bg-yellow-500/10 text-yellow-600';
      case 'closed': return 'bg-red-500/10 text-red-600';
      case 'completed': return 'bg-blue-500/10 text-blue-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!internship) {
    return null;
  }

  if (isEditing) {
    return (
      <AppLayout>
        <div className="p-6 max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => setIsEditing(false)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Details
          </Button>
          <h1 className="text-2xl font-bold mb-6">Edit Internship</h1>
          <InternshipForm 
            internship={internship}
            onSuccess={(updated) => {
              setInternship(updated);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/internships')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Internships
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{internship.title}</h1>
              <Badge className={getStatusColor(internship.status)}>
                {internship.status.charAt(0).toUpperCase() + internship.status.slice(1)}
              </Badge>
            </div>
            {internship.department && (
              <p className="text-muted-foreground mt-1">{internship.department}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canManage && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {isStudent && !isEnrolled && internship.status === 'active' && (
              hasApplied ? (
                <Button disabled>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Applied
                </Button>
              ) : (
                <Button onClick={handleApply}>
                  Apply Now
                </Button>
              )
            )}
          </div>
        </div>

        {/* Content */}
        {isEnrolled && enrollmentId ? (
          // Student view - show tasks
          <Tabs defaultValue="tasks" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">My Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <InternshipOverview internship={internship} />
            </TabsContent>

            <TabsContent value="tasks">
              <div className="mt-4">
                {/* Import TaskSubmissionView dynamically */}
                <TaskSubmissionViewWrapper enrollmentId={enrollmentId} internshipId={internship.id} />
              </div>
            </TabsContent>
          </Tabs>
        ) : canManage ? (
          // Mentor/Admin view
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="progress">Intern Progress</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <InternshipOverview internship={internship} />
            </TabsContent>

            <TabsContent value="tasks">
              <InternshipTaskManager internshipId={internship.id} />
            </TabsContent>

            <TabsContent value="applications">
              <ApplicationManager internshipId={internship.id} />
            </TabsContent>

            <TabsContent value="progress">
              <InternshipProgress internshipId={internship.id} />
            </TabsContent>
          </Tabs>
        ) : (
          // Public view
          <InternshipOverview internship={internship} />
        )}
      </div>
    </AppLayout>
  );
}

// Separate component for overview to keep code clean
function InternshipOverview({ internship }: { internship: Internship }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        {/* Description */}
        {internship.description && (
          <Card>
            <CardHeader>
              <CardTitle>About this Internship</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{internship.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Responsibilities */}
        {internship.responsibilities && (
          <Card>
            <CardHeader>
              <CardTitle>Responsibilities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{internship.responsibilities}</p>
            </CardContent>
          </Card>
        )}

        {/* Eligibility */}
        {internship.eligibility && (
          <Card>
            <CardHeader>
              <CardTitle>Eligibility</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{internship.eligibility}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        {/* Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {internship.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {internship.is_remote ? 'Remote' : internship.location}
                  </p>
                </div>
              </div>
            )}
            {internship.duration_weeks && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{internship.duration_weeks} weeks</p>
                </div>
              </div>
            )}
            {internship.stipend_amount && (
              <div className="flex items-center gap-3">
                <IndianRupee className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Stipend</p>
                  <p className="font-medium">
                    ₹{internship.stipend_amount.toLocaleString()}/month
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Positions</p>
                <p className="font-medium">{internship.max_positions}</p>
              </div>
            </div>
            {internship.start_date && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {format(new Date(internship.start_date), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            )}
            {internship.application_deadline && (
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Apply By</p>
                  <p className="font-medium">
                    {format(new Date(internship.application_deadline), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills */}
        {internship.skills_required && internship.skills_required.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Required Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {internship.skills_required.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Wrapper for TaskSubmissionView
import { TaskSubmissionView } from '@/components/internships/TaskSubmissionView';

function TaskSubmissionViewWrapper({ enrollmentId, internshipId }: { enrollmentId: string; internshipId: string }) {
  return <TaskSubmissionView enrollmentId={enrollmentId} internshipId={internshipId} />;
}
