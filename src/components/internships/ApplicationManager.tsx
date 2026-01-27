import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  User, 
  FileText, 
  Link as LinkIcon, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { fromTable } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import { OfferLetterGenerator } from './OfferLetterGenerator';
import type { InternshipApplication, InternshipApplicationStatus, Internship } from '@/types/internship';
import { format } from 'date-fns';

interface ApplicationWithDetails extends InternshipApplication {
  user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  internship?: Internship;
}

interface ApplicationManagerProps {
  internshipId: string;
}

export function ApplicationManager({ internshipId }: ApplicationManagerProps) {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [internshipId]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await fromTable('internship_applications')
        .select('*')
        .eq('internship_id', internshipId)
        .order('applied_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles
      const userIds = [...new Set((data || []).map(a => a.user_id))];
      const { data: profiles } = await fromTable('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      // Fetch internship
      const { data: internship } = await fromTable('internships')
        .select('*')
        .eq('id', internshipId)
        .single();

      const applicationsWithDetails = (data || []).map(app => ({
        ...app,
        user: profiles?.find(p => p.user_id === app.user_id),
        internship,
      }));

      setApplications(applicationsWithDetails);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId: string, status: InternshipApplicationStatus) => {
    setProcessing(true);
    try {
      const updateData: any = {
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: reviewNotes || null,
      };

      const { error } = await fromTable('internship_applications')
        .update(updateData)
        .eq('id', applicationId);

      if (error) throw error;

      // If accepted, create enrollment
      if (status === 'accepted') {
        const app = applications.find(a => a.id === applicationId);
        if (app?.internship) {
          const { error: enrollError } = await fromTable('internship_enrollments')
            .insert({
              internship_id: internshipId,
              user_id: app.user_id,
              application_id: applicationId,
              start_date: app.internship.start_date || new Date().toISOString().split('T')[0],
              expected_end_date: app.internship.end_date,
            });
          
          if (enrollError && !enrollError.message.includes('duplicate')) {
            console.error('Error creating enrollment:', enrollError);
          }
        }
      }

      toast.success(`Application ${status}`);
      setSelectedApplication(null);
      setReviewNotes('');
      fetchApplications();
    } catch (error: any) {
      console.error('Error updating application:', error);
      toast.error(error.message || 'Failed to update application');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: InternshipApplicationStatus) => {
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

  const filterApplications = (status: string) => {
    if (status === 'all') return applications;
    return applications.filter(a => a.status === status);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            All ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({filterApplications('pending').length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({filterApplications('accepted').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({filterApplications('rejected').length})
          </TabsTrigger>
        </TabsList>

        {['all', 'pending', 'accepted', 'rejected'].map(tab => (
          <TabsContent key={tab} value={tab}>
            {filterApplications(tab).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <User className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No applications found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filterApplications(tab).map((application) => (
                  <Card key={application.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={application.user?.avatar_url} />
                          <AvatarFallback>
                            {application.user?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">
                                {application.user?.full_name || 'Unknown User'}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  Applied: {format(new Date(application.applied_at), 'MMM dd, yyyy')}
                                </span>
                              </div>
                            </div>
                            {getStatusBadge(application.status)}
                          </div>

                          {/* Links */}
                          <div className="flex items-center gap-4 mt-3">
                            {application.resume_url && (
                              <a 
                                href={application.resume_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-primary hover:underline"
                              >
                                <FileText className="h-4 w-4" />
                                Resume
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {application.portfolio_url && (
                              <a 
                                href={application.portfolio_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-primary hover:underline"
                              >
                                <LinkIcon className="h-4 w-4" />
                                Portfolio
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>

                          {/* Cover Letter Preview */}
                          {application.cover_letter && (
                            <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                              {application.cover_letter}
                            </p>
                          )}

                          {/* Actions */}
                          {application.status === 'pending' && (
                            <div className="flex items-center gap-2 mt-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedApplication(application)}
                              >
                                Review
                              </Button>
                              <OfferLetterGenerator 
                                application={application}
                                onSuccess={fetchApplications}
                              />
                            </div>
                          )}

                          {application.status === 'accepted' && (
                            <div className="flex items-center gap-2 mt-4">
                              <OfferLetterGenerator 
                                application={application}
                                onSuccess={fetchApplications}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedApplication.user?.avatar_url} />
                  <AvatarFallback>
                    {selectedApplication.user?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedApplication.user?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Applied {format(new Date(selectedApplication.applied_at), 'PPP')}
                  </p>
                </div>
              </div>

              {selectedApplication.cover_letter && (
                <div>
                  <label className="text-sm font-medium">Cover Letter</label>
                  <div className="mt-1 p-3 bg-muted rounded-lg text-sm">
                    {selectedApplication.cover_letter}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Review Notes (optional)</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this application..."
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate(selectedApplication.id, 'rejected')}
                  disabled={processing}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleStatusUpdate(selectedApplication.id, 'accepted')}
                  disabled={processing}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
