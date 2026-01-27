import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, Award, Calendar, User, Clock, Building, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { formatCertificateDate, getCertificateTypeLabel, validateCertificateNumber } from '@/lib/certificate-utils';
import type { Certificate, LetterOfRecommendation } from '@/types/certificate';

type VerificationResult = 'valid' | 'expired' | 'revoked' | 'not_found' | null;

interface VerificationData {
  type: 'certificate' | 'lor';
  data: Certificate | LetterOfRecommendation;
  result: VerificationResult;
}

export default function VerifyCertificate() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [searchId, setSearchId] = useState(id || searchParams.get('id') || '');
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (id) {
      handleVerify(id);
    }
  }, [id]);

  const logVerification = async (
    certificateId: string | null,
    lorId: string | null,
    method: 'qr_scan' | 'id_lookup' | 'url',
    result: VerificationResult
  ) => {
    try {
      await supabase.from('certificate_verification_logs').insert({
        certificate_id: certificateId,
        lor_id: lorId,
        verification_method: method,
        verification_result: result || 'not_found',
        verifier_user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Failed to log verification:', error);
    }
  };

  const handleVerify = async (certificateNumber: string) => {
    if (!certificateNumber.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);
    setVerification(null);

    try {
      // Check if it's a certificate
      if (certificateNumber.startsWith('CERT')) {
        const { data: certData } = await supabase
          .from('certificates')
          .select('*, course:courses(*)')
          .eq('certificate_number', certificateNumber)
          .single();

        if (certData) {
          let result: VerificationResult = 'valid';
          
          if (certData.is_revoked) {
            result = 'revoked';
          } else if (certData.expires_at && new Date(certData.expires_at) < new Date()) {
            result = 'expired';
          }

          await logVerification(certData.id, null, id ? 'url' : 'id_lookup', result);
          
          setVerification({
            type: 'certificate',
            data: certData as Certificate,
            result
          });
          return;
        }
      }
      
      // Check if it's a LOR
      if (certificateNumber.startsWith('LOR')) {
        const { data: lorData } = await supabase
          .from('letters_of_recommendation')
          .select('*, course:courses(*)')
          .eq('lor_number', certificateNumber)
          .single();

        if (lorData) {
          let result: VerificationResult = 'valid';
          
          if (lorData.status === 'revoked') {
            result = 'revoked';
          } else if (lorData.expires_at && new Date(lorData.expires_at) < new Date()) {
            result = 'expired';
          }

          await logVerification(null, lorData.id, id ? 'url' : 'id_lookup', result);
          
          setVerification({
            type: 'lor',
            data: lorData as LetterOfRecommendation,
            result
          });
          return;
        }
      }

      await logVerification(null, null, id ? 'url' : 'id_lookup', 'not_found');
      setVerification({ type: 'certificate', data: {} as Certificate, result: 'not_found' });
    } catch (error) {
      console.error('Verification error:', error);
      setVerification({ type: 'certificate', data: {} as Certificate, result: 'not_found' });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (result: VerificationResult) => {
    switch (result) {
      case 'valid':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'expired':
        return <AlertCircle className="h-16 w-16 text-yellow-500" />;
      case 'revoked':
        return <XCircle className="h-16 w-16 text-red-500" />;
      default:
        return <XCircle className="h-16 w-16 text-slate-400" />;
    }
  };

  const getStatusMessage = (result: VerificationResult) => {
    switch (result) {
      case 'valid':
        return { title: 'Verified', description: 'This credential is valid and authentic.' };
      case 'expired':
        return { title: 'Expired', description: 'This credential has expired.' };
      case 'revoked':
        return { title: 'Revoked', description: 'This credential has been revoked.' };
      default:
        return { title: 'Not Found', description: 'No credential found with this ID.' };
    }
  };

  const getStatusBadge = (result: VerificationResult) => {
    switch (result) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Valid</Badge>;
      case 'expired':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Expired</Badge>;
      case 'revoked':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Revoked</Badge>;
      default:
        return <Badge variant="outline">Not Found</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container max-w-4xl mx-auto py-6 px-4">
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Credential Verification</h1>
              <p className="text-sm text-muted-foreground">Verify the authenticity of certificates and letters</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto py-8 px-4">
        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Verify a Credential</CardTitle>
            <CardDescription>
              Enter the certificate or LOR ID to verify its authenticity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Enter Certificate ID (e.g., CERT-ABC123-XYZ789)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify(searchId)}
                className="flex-1"
              />
              <Button 
                onClick={() => handleVerify(searchId)} 
                disabled={isLoading || !searchId.trim()}
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {!isLoading && hasSearched && verification && (
          <Card>
            <CardContent className="py-8">
              {/* Status Header */}
              <div className="flex flex-col items-center text-center mb-8">
                {getStatusIcon(verification.result)}
                <h2 className="text-2xl font-bold mt-4">{getStatusMessage(verification.result).title}</h2>
                <p className="text-muted-foreground">{getStatusMessage(verification.result).description}</p>
              </div>

              {/* Details */}
              {verification.result !== 'not_found' && (
                <div className="border rounded-lg p-6 bg-muted/20">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-lg">
                      {verification.type === 'certificate' ? 'Certificate Details' : 'Letter of Recommendation'}
                    </h3>
                    {getStatusBadge(verification.result)}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {verification.type === 'certificate' ? (
                      <>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">Recipient</p>
                              <p className="font-medium">{(verification.data as Certificate).recipient_name || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">Program</p>
                              <p className="font-medium">{(verification.data as Certificate).course?.title || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">Type</p>
                              <p className="font-medium">
                                {getCertificateTypeLabel((verification.data as Certificate).certificate_type || 'course')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">Issue Date</p>
                              <p className="font-medium">
                                {formatCertificateDate((verification.data as Certificate).issued_at)}
                              </p>
                            </div>
                          </div>
                          {(verification.data as Certificate).expires_at && (
                            <div className="flex items-start gap-3">
                              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm text-muted-foreground">Expiry Date</p>
                                <p className="font-medium">
                                  {formatCertificateDate((verification.data as Certificate).expires_at!)}
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-start gap-3">
                            <ExternalLink className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">Certificate ID</p>
                              <p className="font-mono text-sm">{(verification.data as Certificate).certificate_number}</p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">Recipient</p>
                              <p className="font-medium">{(verification.data as LetterOfRecommendation).recipient_name}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">Title</p>
                              <p className="font-medium">{(verification.data as LetterOfRecommendation).title}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">Recommended By</p>
                              <p className="font-medium">
                                {(verification.data as LetterOfRecommendation).recommender_name}
                                {(verification.data as LetterOfRecommendation).recommender_title && (
                                  <span className="text-muted-foreground">
                                    {' '}• {(verification.data as LetterOfRecommendation).recommender_title}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">Issue Date</p>
                              <p className="font-medium">
                                {formatCertificateDate((verification.data as LetterOfRecommendation).issued_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <ExternalLink className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">Reference ID</p>
                              <p className="font-mono text-sm">{(verification.data as LetterOfRecommendation).lor_number}</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Revocation Info */}
                  {verification.result === 'revoked' && verification.type === 'certificate' && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Revocation Reason:</strong>{' '}
                        {(verification.data as Certificate).revoked_reason || 'No reason provided'}
                      </p>
                      {(verification.data as Certificate).revoked_at && (
                        <p className="text-sm text-red-700 mt-1">
                          Revoked on: {formatCertificateDate((verification.data as Certificate).revoked_at!)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {!hasSearched && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">How to Verify</h3>
              <ul className="text-sm text-muted-foreground space-y-2 max-w-md mx-auto">
                <li>1. Scan the QR code on the certificate or letter</li>
                <li>2. Or enter the Certificate/LOR ID in the search box above</li>
                <li>3. View the verification result and credential details</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container max-w-4xl mx-auto py-6 px-4 text-center text-sm text-muted-foreground">
          <p>This verification service ensures the authenticity of issued credentials.</p>
        </div>
      </footer>
    </div>
  );
}
