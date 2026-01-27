import { useState, useEffect, useRef } from 'react';
import { Award, Plus, Search, Download, Eye, XCircle, FileText, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { fromTable } from '@/lib/supabase-helpers';
import { generateCertificateNumber, generateLorNumber, getVerificationUrl, formatCertificateDate, getCertificateTypeLabel } from '@/lib/certificate-utils';
import { CertificateTemplate } from './CertificateTemplate';
import { LorTemplate } from './LorTemplate';
import type { Certificate, LetterOfRecommendation, CertificateType } from '@/types/certificate';
import type { Course, Profile } from '@/types/database';

interface CertificateWithUser extends Certificate {
  course?: Course;
  user?: Profile;
}

interface LorWithUser extends LetterOfRecommendation {
  course?: Course;
  user?: Profile;
}

export function CertificateManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('certificates');
  const [certificates, setCertificates] = useState<CertificateWithUser[]>([]);
  const [lors, setLors] = useState<LorWithUser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [isLorDialogOpen, setIsLorDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateWithUser | null>(null);
  const [selectedLor, setSelectedLor] = useState<LorWithUser | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  // Form states
  const [certForm, setCertForm] = useState({
    user_id: '',
    course_id: '',
    certificate_type: 'course' as CertificateType,
    recipient_name: '',
    recipient_email: '',
    course_duration: '',
    issued_by: '',
    expires_at: ''
  });

  const [lorForm, setLorForm] = useState({
    user_id: '',
    course_id: '',
    recipient_name: '',
    recipient_email: '',
    title: 'Letter of Recommendation',
    content: '',
    recommendation_type: 'course',
    skills_highlighted: '',
    achievements: '',
    performance_rating: 5,
    recommender_name: '',
    recommender_title: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [certsRes, lorsRes, coursesRes, usersRes] = await Promise.all([
        fromTable('certificates')
          .select('*, course:courses(*)')
          .order('issued_at', { ascending: false }),
        fromTable('letters_of_recommendation')
          .select('*, course:courses(*)')
          .order('issued_at', { ascending: false }),
        fromTable('courses').select('*').eq('status', 'published'),
        fromTable('profiles').select('*')
      ]);

      setCertificates((certsRes.data || []) as CertificateWithUser[]);
      setLors((lorsRes.data || []) as LorWithUser[]);
      setCourses(coursesRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueCertificate = async () => {
    if (!certForm.user_id || !certForm.course_id || !certForm.recipient_name) {
      toast({ title: 'Missing required fields', variant: 'destructive' });
      return;
    }

    try {
      const certificateNumber = generateCertificateNumber();
      const verificationUrl = getVerificationUrl(certificateNumber);

      const { error } = await supabase.from('certificates').insert({
        user_id: certForm.user_id,
        course_id: certForm.course_id,
        certificate_number: certificateNumber,
        certificate_type: certForm.certificate_type,
        recipient_name: certForm.recipient_name,
        recipient_email: certForm.recipient_email,
        course_duration: certForm.course_duration,
        issued_by: certForm.issued_by || user?.email,
        verification_url: verificationUrl,
        expires_at: certForm.expires_at || null
      });

      if (error) throw error;

      toast({ title: 'Certificate issued successfully!' });
      setIsIssueDialogOpen(false);
      resetCertForm();
      fetchData();
    } catch (error) {
      console.error('Error issuing certificate:', error);
      toast({ title: 'Failed to issue certificate', variant: 'destructive' });
    }
  };

  const handleIssueLor = async () => {
    if (!lorForm.user_id || !lorForm.recipient_name || !lorForm.content || !lorForm.recommender_name) {
      toast({ title: 'Missing required fields', variant: 'destructive' });
      return;
    }

    try {
      const lorNumber = generateLorNumber();

      const { error } = await supabase.from('letters_of_recommendation').insert({
        user_id: lorForm.user_id,
        course_id: lorForm.course_id || null,
        lor_number: lorNumber,
        recipient_name: lorForm.recipient_name,
        recipient_email: lorForm.recipient_email,
        title: lorForm.title,
        content: lorForm.content,
        recommendation_type: lorForm.recommendation_type,
        skills_highlighted: lorForm.skills_highlighted.split(',').map(s => s.trim()).filter(Boolean),
        achievements: lorForm.achievements.split(',').map(s => s.trim()).filter(Boolean),
        performance_rating: lorForm.performance_rating,
        recommender_name: lorForm.recommender_name,
        recommender_title: lorForm.recommender_title,
        status: 'issued',
        created_by: user?.id || ''
      });

      if (error) throw error;

      toast({ title: 'Letter of Recommendation issued successfully!' });
      setIsLorDialogOpen(false);
      resetLorForm();
      fetchData();
    } catch (error) {
      console.error('Error issuing LOR:', error);
      toast({ title: 'Failed to issue LOR', variant: 'destructive' });
    }
  };

  const handleRevokeCertificate = async (cert: CertificateWithUser, reason: string) => {
    try {
      const { error } = await supabase
        .from('certificates')
        .update({
          is_revoked: true,
          revoked_at: new Date().toISOString(),
          revoked_reason: reason
        })
        .eq('id', cert.id);

      if (error) throw error;

      toast({ title: 'Certificate revoked' });
      fetchData();
    } catch (error) {
      console.error('Error revoking certificate:', error);
      toast({ title: 'Failed to revoke certificate', variant: 'destructive' });
    }
  };

  const resetCertForm = () => {
    setCertForm({
      user_id: '',
      course_id: '',
      certificate_type: 'course',
      recipient_name: '',
      recipient_email: '',
      course_duration: '',
      issued_by: '',
      expires_at: ''
    });
  };

  const resetLorForm = () => {
    setLorForm({
      user_id: '',
      course_id: '',
      recipient_name: '',
      recipient_email: '',
      title: 'Letter of Recommendation',
      content: '',
      recommendation_type: 'course',
      skills_highlighted: '',
      achievements: '',
      performance_rating: 5,
      recommender_name: '',
      recommender_title: ''
    });
  };

  const handleUserSelect = (userId: string, formType: 'cert' | 'lor') => {
    const selectedUser = users.find(u => u.user_id === userId);
    if (formType === 'cert') {
      setCertForm(prev => ({
        ...prev,
        user_id: userId,
        recipient_name: selectedUser?.full_name || '',
        recipient_email: ''
      }));
    } else {
      setLorForm(prev => ({
        ...prev,
        user_id: userId,
        recipient_name: selectedUser?.full_name || '',
        recipient_email: ''
      }));
    }
  };

  const filteredCertificates = certificates.filter(cert =>
    cert.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.certificate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLors = lors.filter(lor =>
    lor.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lor.lor_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{certificates.length}</p>
                <p className="text-sm text-muted-foreground">Certificates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lors.length}</p>
                <p className="text-sm text-muted-foreground">LORs Issued</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{certificates.filter(c => !c.is_revoked).length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{certificates.filter(c => c.is_revoked).length}</p>
                <p className="text-sm text-muted-foreground">Revoked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Credential Management</CardTitle>
              <CardDescription>Issue and manage certificates and letters of recommendation</CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Issue Certificate
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Issue New Certificate</DialogTitle>
                    <DialogDescription>Create and issue a new certificate to a user</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Certificate Type</Label>
                      <Select 
                        value={certForm.certificate_type} 
                        onValueChange={(v) => setCertForm(p => ({ ...p, certificate_type: v as CertificateType }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="course">Course Completion</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                          <SelectItem value="experience">Experience</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Select User *</Label>
                      <Select value={certForm.user_id} onValueChange={(v) => handleUserSelect(v, 'cert')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map(u => (
                            <SelectItem key={u.user_id} value={u.user_id}>
                              {u.full_name || u.user_id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Select Course *</Label>
                      <Select value={certForm.course_id} onValueChange={(v) => setCertForm(p => ({ ...p, course_id: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Recipient Name *</Label>
                      <Input 
                        value={certForm.recipient_name}
                        onChange={(e) => setCertForm(p => ({ ...p, recipient_name: e.target.value }))}
                        placeholder="Full name as it will appear on certificate"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Input 
                          value={certForm.course_duration}
                          onChange={(e) => setCertForm(p => ({ ...p, course_duration: e.target.value }))}
                          placeholder="e.g., 40 hours"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Expiry Date</Label>
                        <Input 
                          type="date"
                          value={certForm.expires_at}
                          onChange={(e) => setCertForm(p => ({ ...p, expires_at: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Issued By</Label>
                      <Input 
                        value={certForm.issued_by}
                        onChange={(e) => setCertForm(p => ({ ...p, issued_by: e.target.value }))}
                        placeholder="Issuing authority name"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsIssueDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleIssueCertificate}>Issue Certificate</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isLorDialogOpen} onOpenChange={setIsLorDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Issue LOR
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Issue Letter of Recommendation</DialogTitle>
                    <DialogDescription>Create a personalized letter of recommendation</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Select User *</Label>
                        <Select value={lorForm.user_id} onValueChange={(v) => handleUserSelect(v, 'lor')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map(u => (
                              <SelectItem key={u.user_id} value={u.user_id}>
                                {u.full_name || u.user_id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Recommendation Type</Label>
                        <Select value={lorForm.recommendation_type} onValueChange={(v) => setLorForm(p => ({ ...p, recommendation_type: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="course">Course</SelectItem>
                            <SelectItem value="internship">Internship</SelectItem>
                            <SelectItem value="experience">Experience</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Recipient Name *</Label>
                        <Input 
                          value={lorForm.recipient_name}
                          onChange={(e) => setLorForm(p => ({ ...p, recipient_name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Related Course</Label>
                        <Select value={lorForm.course_id} onValueChange={(v) => setLorForm(p => ({ ...p, course_id: v }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select course (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Letter Title</Label>
                      <Input 
                        value={lorForm.title}
                        onChange={(e) => setLorForm(p => ({ ...p, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Letter Content *</Label>
                      <Textarea 
                        value={lorForm.content}
                        onChange={(e) => setLorForm(p => ({ ...p, content: e.target.value }))}
                        placeholder="Write the recommendation letter content..."
                        rows={6}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Skills (comma-separated)</Label>
                        <Input 
                          value={lorForm.skills_highlighted}
                          onChange={(e) => setLorForm(p => ({ ...p, skills_highlighted: e.target.value }))}
                          placeholder="Leadership, Communication, ..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Achievements (comma-separated)</Label>
                        <Input 
                          value={lorForm.achievements}
                          onChange={(e) => setLorForm(p => ({ ...p, achievements: e.target.value }))}
                          placeholder="Top performer, Best project, ..."
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Recommender Name *</Label>
                        <Input 
                          value={lorForm.recommender_name}
                          onChange={(e) => setLorForm(p => ({ ...p, recommender_name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Recommender Title</Label>
                        <Input 
                          value={lorForm.recommender_title}
                          onChange={(e) => setLorForm(p => ({ ...p, recommender_title: e.target.value }))}
                          placeholder="e.g., Program Director"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsLorDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleIssueLor}>Issue LOR</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="certificates">Certificates ({certificates.length})</TabsTrigger>
              <TabsTrigger value="lors">Letters of Recommendation ({lors.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="certificates" className="mt-4">
              <div className="space-y-3">
                {filteredCertificates.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No certificates issued yet</p>
                  </div>
                ) : (
                  filteredCertificates.map(cert => (
                    <div 
                      key={cert.id} 
                      className={`flex items-center gap-4 p-4 rounded-lg border ${cert.is_revoked ? 'bg-red-50 border-red-200' : 'bg-card'}`}
                    >
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Award className={`h-6 w-6 ${cert.is_revoked ? 'text-red-500' : 'text-primary'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{cert.recipient_name || 'Unknown'}</p>
                          <Badge variant={cert.is_revoked ? 'destructive' : 'outline'} className="text-xs">
                            {cert.is_revoked ? 'Revoked' : getCertificateTypeLabel(cert.certificate_type || 'course')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{cert.course?.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ID: {cert.certificate_number} • Issued: {formatCertificateDate(cert.issued_at)}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedCertificate(cert)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!cert.is_revoked && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const reason = prompt('Enter revocation reason:');
                              if (reason) handleRevokeCertificate(cert, reason);
                            }}
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="lors" className="mt-4">
              <div className="space-y-3">
                {filteredLors.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No letters of recommendation issued yet</p>
                  </div>
                ) : (
                  filteredLors.map(lor => (
                    <div key={lor.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                      <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <FileText className="h-6 w-6 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{lor.recipient_name}</p>
                          <Badge variant="outline" className="text-xs capitalize">{lor.recommendation_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{lor.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ID: {lor.lor_number} • By: {lor.recommender_name}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedLor(lor)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Certificate Preview Dialog */}
      {selectedCertificate && (
        <Dialog open={!!selectedCertificate} onOpenChange={() => setSelectedCertificate(null)}>
          <DialogContent className="max-w-[1100px] max-h-[95vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Certificate Preview</DialogTitle>
            </DialogHeader>
            <div className="overflow-auto">
              <CertificateTemplate
                ref={certificateRef}
                certificate={selectedCertificate}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* LOR Preview Dialog */}
      {selectedLor && (
        <Dialog open={!!selectedLor} onOpenChange={() => setSelectedLor(null)}>
          <DialogContent className="max-w-[900px] max-h-[95vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Letter Preview</DialogTitle>
            </DialogHeader>
            <div className="overflow-auto">
              <LorTemplate lor={selectedLor} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
