import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fromTable } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Briefcase, Users, CheckCircle, Clock, Building2, Edit, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Employer, JobPosting, JobStatus } from '@/types/jobs';
import InterviewScheduler from './InterviewScheduler';

const STATUS_COLORS: Record<JobStatus, string> = {
  draft: 'secondary',
  open: 'default',
  closed: 'outline',
  filled: 'default',
};

export default function EmployerDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  // Profile form state
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  useEffect(() => {
    if (user) {
      fetchEmployerData();
    }
  }, [user]);

  async function fetchEmployerData() {
    if (!user) return;

    setLoading(true);

    // Fetch employer profile
    const { data: employerData } = await fromTable('employers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (employerData) {
      setEmployer(employerData as Employer);

      // Fetch jobs
      const { data: jobsData } = await fromTable('job_postings')
        .select('*')
        .eq('employer_id', employerData.id)
        .order('created_at', { ascending: false });

      if (jobsData) {
        setJobs(jobsData as JobPosting[]);

        // Fetch applications for all jobs
        const jobIds = jobsData.map((j: any) => j.id);
        if (jobIds.length > 0) {
          const { data: appsData } = await fromTable('job_applications')
            .select(`
              *,
              job:job_postings(*),
              resume:student_resumes(*)
            `)
            .in('job_id', jobIds)
            .order('applied_at', { ascending: false });

          if (appsData) {
            setApplications(appsData);
          }
        }
      }
    }

    setLoading(false);
  }

  async function createEmployerProfile() {
    if (!user) return;

    setCreatingProfile(true);
    try {
      const { data, error } = await fromTable('employers')
        .insert({
          user_id: user.id,
          company_name: companyName,
          company_description: companyDescription,
          industry,
          location,
          contact_email: contactEmail || user.email,
        })
        .select()
        .single();

      if (error) throw error;

      setEmployer(data as Employer);
      setProfileDialogOpen(false);
      toast.success('Employer profile created');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create profile');
    } finally {
      setCreatingProfile(false);
    }
  }

  async function updateJobStatus(jobId: string, status: JobStatus) {
    try {
      const updateData: any = { status };
      if (status === 'open') {
        updateData.posted_at = new Date().toISOString();
      }

      const { error } = await fromTable('job_postings')
        .update(updateData)
        .eq('id', jobId);

      if (error) throw error;
      toast.success(`Job ${status === 'open' ? 'published' : 'updated'}`);
      fetchEmployerData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update job');
    }
  }

  async function updateApplicationStatus(applicationId: string, status: string, notes?: string) {
    try {
      const { error } = await fromTable('job_applications')
        .update({ 
          status, 
          employer_notes: notes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', applicationId);

      if (error) throw error;
      toast.success('Application updated');
      fetchEmployerData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update application');
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Show create profile dialog if no employer profile
  if (!employer) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Welcome, Employer!</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Create your company profile to start posting jobs and hiring candidates.
        </p>
        <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Company Profile
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Company Profile</DialogTitle>
              <DialogDescription>
                Set up your company profile to start posting jobs
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Company Name *</Label>
                <Input 
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your company name"
                />
              </div>
              <div>
                <Label>Industry</Label>
                <Input 
                  value={industry} 
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Technology, Finance"
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Mumbai, India"
                />
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input 
                  type="email"
                  value={contactEmail} 
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder={user?.email}
                />
              </div>
              <div>
                <Label>Company Description</Label>
                <Textarea 
                  value={companyDescription} 
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Brief description of your company..."
                  rows={3}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={createEmployerProfile}
                disabled={!companyName || creatingProfile}
              >
                {creatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Profile
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const stats = {
    totalJobs: jobs.length,
    openJobs: jobs.filter(j => j.status === 'open').length,
    totalApplications: applications.length,
    pendingReview: applications.filter(a => a.status === 'pending').length,
  };

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{employer.company_name}</h2>
                <p className="text-muted-foreground">
                  {employer.industry && `${employer.industry} • `}
                  {employer.location || 'Location not set'}
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/jobs/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Post New Job
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats.totalJobs}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Total Jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{stats.openJobs}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Open Positions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">{stats.totalApplications}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Applications</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{stats.pendingReview}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Pending Review</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs">My Jobs ({jobs.length})</TabsTrigger>
          <TabsTrigger value="applications">Applications ({applications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-6">
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No jobs posted yet</h3>
                <p className="text-muted-foreground mb-4">Start hiring by posting your first job</p>
                <Button onClick={() => navigate('/jobs/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Post a Job
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {jobs.map(job => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <CardDescription>
                          Created {format(new Date(job.created_at), 'MMM d, yyyy')}
                          {job.posted_at && ` • Published ${format(new Date(job.posted_at), 'MMM d, yyyy')}`}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={STATUS_COLORS[job.status] as any}>
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/jobs/${job.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/jobs/${job.id}/edit`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      {job.status === 'draft' && (
                        <Button size="sm" onClick={() => updateJobStatus(job.id, 'open')}>
                          Publish
                        </Button>
                      )}
                      {job.status === 'open' && (
                        <Button variant="outline" size="sm" onClick={() => updateJobStatus(job.id, 'closed')}>
                          Close
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications" className="mt-6">
          {applications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No applications yet</h3>
                <p className="text-muted-foreground">
                  Applications will appear here once candidates apply
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map(app => (
                <Card key={app.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {app.resume?.full_name || 'Unknown Candidate'}
                        </CardTitle>
                        <CardDescription>
                          Applied for <strong>{app.job?.title}</strong>
                          {' • '}
                          {format(new Date(app.applied_at), 'MMM d, yyyy')}
                        </CardDescription>
                      </div>
                      <Badge>{app.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {app.resume && (
                      <div className="mb-4 text-sm">
                        <p><strong>Email:</strong> {app.resume.email}</p>
                        {app.resume.phone && <p><strong>Phone:</strong> {app.resume.phone}</p>}
                        {app.resume.headline && <p><strong>Headline:</strong> {app.resume.headline}</p>}
                        {app.resume.skills && app.resume.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {app.resume.skills.slice(0, 5).map((skill: string) => (
                              <Badge key={skill} variant="outline">{skill}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {app.cover_letter && (
                      <div className="bg-muted p-3 rounded-lg mb-4">
                        <p className="text-sm font-medium mb-1">Cover Letter:</p>
                        <p className="text-sm text-muted-foreground">{app.cover_letter}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {app.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => updateApplicationStatus(app.id, 'shortlisted')}>
                            Shortlist
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => updateApplicationStatus(app.id, 'rejected')}>
                            Reject
                          </Button>
                        </>
                      )}
                      {app.status === 'shortlisted' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" onClick={() => setSelectedApplication(app)}>
                              Schedule Interview
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Schedule Interview</DialogTitle>
                            </DialogHeader>
                            {selectedApplication && (
                              <InterviewScheduler 
                                application={selectedApplication} 
                                onScheduled={fetchEmployerData}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                      )}
                      {app.status === 'interview_scheduled' && (
                        <>
                          <Button size="sm" onClick={() => updateApplicationStatus(app.id, 'selected')}>
                            Select
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => updateApplicationStatus(app.id, 'rejected')}>
                            Reject
                          </Button>
                        </>
                      )}
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
