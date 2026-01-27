import { useEffect, useState, useRef } from 'react';
import { Award, Download, ExternalLink, Calendar, Eye, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fromTable } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import { formatCertificateDate, getCertificateTypeLabel } from '@/lib/certificate-utils';
import { CertificateTemplate } from '@/components/certificates/CertificateTemplate';
import { LorTemplate } from '@/components/certificates/LorTemplate';
import type { Certificate, LetterOfRecommendation } from '@/types/certificate';
import type { Course } from '@/types/database';

interface CertificateWithCourse extends Certificate {
  course?: Course;
}

interface LorWithCourse extends LetterOfRecommendation {
  course?: Course;
}

export function CertificatesSection() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<CertificateWithCourse[]>([]);
  const [lors, setLors] = useState<LorWithCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateWithCourse | null>(null);
  const [selectedLor, setSelectedLor] = useState<LorWithCourse | null>(null);
  const [activeTab, setActiveTab] = useState('certificates');

  useEffect(() => {
    if (user) {
      fetchCredentials();
    }
  }, [user]);

  const fetchCredentials = async () => {
    try {
      const [certsRes, lorsRes] = await Promise.all([
        fromTable('certificates')
          .select('*, course:courses(*)')
          .order('issued_at', { ascending: false }),
        fromTable('letters_of_recommendation')
          .select('*, course:courses(*)')
          .order('issued_at', { ascending: false })
      ]);

      setCertificates((certsRes.data || []) as CertificateWithCourse[]);
      setLors((lorsRes.data || []) as LorWithCourse[]);
    } catch (error) {
      console.error('Error fetching credentials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = (number: string) => {
    window.open(`/verify/${number}`, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Award className="h-5 w-5 text-accent" />
            My Credentials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCredentials = certificates.length + lors.length;

  if (totalCredentials === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Award className="h-5 w-5 text-accent" />
            My Credentials
          </CardTitle>
          <CardDescription>Your certificates and letters of recommendation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No credentials earned yet. Complete a course to receive your first certificate!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Award className="h-5 w-5 text-accent" />
            My Credentials
          </CardTitle>
          <CardDescription>Your earned certifications and letters of recommendation</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="certificates">
                Certificates ({certificates.length})
              </TabsTrigger>
              <TabsTrigger value="lors">
                Letters ({lors.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="certificates">
              <div className="space-y-3">
                {certificates.map((cert) => (
                  <div 
                    key={cert.id} 
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      cert.is_revoked 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-gradient-to-r from-accent/5 to-transparent'
                    }`}
                  >
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${
                      cert.is_revoked ? 'bg-red-100' : 'bg-accent/10'
                    }`}>
                      <Award className={`h-6 w-6 ${cert.is_revoked ? 'text-red-500' : 'text-accent'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{cert.course?.title || 'Course Certificate'}</p>
                        {cert.is_revoked && (
                          <Badge variant="destructive" className="text-xs">Revoked</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatCertificateDate(cert.issued_at)}
                        </span>
                        <Badge variant="outline" className="text-[10px] h-5">
                          {getCertificateTypeLabel(cert.certificate_type || 'course')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedCertificate(cert)}
                        disabled={cert.is_revoked}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleVerify(cert.certificate_number)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="lors">
              <div className="space-y-3">
                {lors.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No letters of recommendation yet</p>
                  </div>
                ) : (
                  lors.map((lor) => (
                    <div 
                      key={lor.id} 
                      className="flex items-center gap-4 p-4 rounded-lg border bg-gradient-to-r from-primary/5 to-transparent"
                    >
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{lor.title}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatCertificateDate(lor.issued_at)}
                          </span>
                          <span>By: {lor.recommender_name}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedLor(lor)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleVerify(lor.lor_number)}
                        >
                          <ExternalLink className="h-4 w-4" />
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

      {/* Certificate Preview */}
      {selectedCertificate && (
        <Dialog open={!!selectedCertificate} onOpenChange={() => setSelectedCertificate(null)}>
          <DialogContent className="max-w-[1100px] max-h-[95vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Certificate</DialogTitle>
            </DialogHeader>
            <div className="overflow-auto">
              <CertificateTemplate certificate={selectedCertificate} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* LOR Preview */}
      {selectedLor && (
        <Dialog open={!!selectedLor} onOpenChange={() => setSelectedLor(null)}>
          <DialogContent className="max-w-[900px] max-h-[95vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Letter of Recommendation</DialogTitle>
            </DialogHeader>
            <div className="overflow-auto">
              <LorTemplate lor={selectedLor} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
