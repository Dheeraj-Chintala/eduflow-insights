import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ArrowLeft, FileText, CheckCircle, Calendar } from 'lucide-react';
import { sanitizeHTML } from '@/lib/sanitize-html';
import type { LegalDocument } from '@/types/legal';
import { DOCUMENT_TYPE_LABELS } from '@/types/legal';

interface LegalPageViewerProps {
  documentType: 'terms' | 'privacy' | 'refund';
}

export default function LegalPageViewer({ documentType }: LegalPageViewerProps) {
  const { user } = useAuth();
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [hasConsented, setHasConsented] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConsenting, setIsConsenting] = useState(false);

  useEffect(() => {
    fetchDocument();
    if (user) {
      checkConsent();
    }
  }, [documentType, user]);

  const fetchDocument = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('document_type', documentType)
        .eq('is_active', true)
        .order('effective_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setDocument(data as unknown as LegalDocument);
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkConsent = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('user_consent_records')
        .select('id')
        .eq('user_id', user.id)
        .eq('document_type', documentType)
        .eq('consent_given', true)
        .is('withdrawn_at', null)
        .limit(1)
        .maybeSingle();

      setHasConsented(!!data);
    } catch (error) {
      console.error('Error checking consent:', error);
    }
  };

  const handleConsent = async () => {
    if (!user || !document) return;

    try {
      setIsConsenting(true);
      
      const { error } = await supabase
        .from('user_consent_records')
        .insert([{
          user_id: user.id,
          document_id: document.id,
          document_type: documentType,
          document_version: document.version,
          consent_given: true,
          consent_method: 'click',
          user_agent: navigator.userAgent
        }]);

      if (error) throw error;

      setHasConsented(true);
      toast.success('Consent recorded successfully');
    } catch (error) {
      console.error('Error recording consent:', error);
      toast.error('Failed to record consent');
    } finally {
      setIsConsenting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Document Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The {DOCUMENT_TYPE_LABELS[documentType]} has not been published yet.
            </p>
            <Button variant="outline" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{document.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Effective: {format(new Date(document.effective_date), 'MMMM d, yyyy')}
                </span>
                <Badge variant="outline">Version {document.version}</Badge>
              </div>
            </div>
            {hasConsented && (
              <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Accepted
              </Badge>
            )}
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Content */}
        <Card>
          <CardContent className="py-8">
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(document.content) }}
            />
          </CardContent>
        </Card>

        {/* Consent Button */}
        {user && !hasConsented && (
          <div className="mt-8 p-6 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-4">
              By clicking "I Accept", you acknowledge that you have read and agree to the {DOCUMENT_TYPE_LABELS[documentType]}.
            </p>
            <Button onClick={handleConsent} disabled={isConsenting}>
              {isConsenting ? 'Recording...' : 'I Accept'}
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Last updated: {format(new Date(document.updated_at), 'MMMM d, yyyy')}</p>
          <div className="mt-4 flex justify-center gap-4">
            <Link to="/terms" className="hover:underline">Terms & Conditions</Link>
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link to="/refund" className="hover:underline">Refund Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
