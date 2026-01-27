import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  FileText, 
  Users,
  Download,
  Shield,
  Clock,
  CheckCircle
} from 'lucide-react';
import type { LegalDocument, UserConsentRecord, GDPRDataRequest } from '@/types/legal';
import { DOCUMENT_TYPE_LABELS } from '@/types/legal';

export default function LegalDocumentManager() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [consents, setConsents] = useState<UserConsentRecord[]>([]);
  const [gdprRequests, setGdprRequests] = useState<GDPRDataRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDocDialog, setShowDocDialog] = useState(false);
  const [editingDoc, setEditingDoc] = useState<LegalDocument | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [docForm, setDocForm] = useState({
    document_type: 'terms',
    title: '',
    content: '',
    version: '1.0',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [docsResult, consentsResult, gdprResult] = await Promise.all([
        supabase.from('legal_documents').select('*').order('created_at', { ascending: false }),
        supabase.from('user_consent_records').select('*').order('consented_at', { ascending: false }).limit(50),
        supabase.from('gdpr_data_requests').select('*').order('requested_at', { ascending: false })
      ]);

      setDocuments((docsResult.data || []) as unknown as LegalDocument[]);
      setConsents((consentsResult.data || []) as unknown as UserConsentRecord[]);
      setGdprRequests((gdprResult.data || []) as unknown as GDPRDataRequest[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDocDialog = (doc?: LegalDocument) => {
    if (doc) {
      setEditingDoc(doc);
      setDocForm({
        document_type: doc.document_type,
        title: doc.title,
        content: doc.content,
        version: doc.version,
        is_active: doc.is_active
      });
    } else {
      setEditingDoc(null);
      setDocForm({
        document_type: 'terms',
        title: '',
        content: '',
        version: '1.0',
        is_active: true
      });
    }
    setShowDocDialog(true);
  };

  const handleSaveDocument = async () => {
    try {
      setIsProcessing(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user?.id)
        .single();

      if (editingDoc) {
        const { error } = await supabase
          .from('legal_documents')
          .update({
            title: docForm.title,
            content: docForm.content,
            version: docForm.version,
            is_active: docForm.is_active
          })
          .eq('id', editingDoc.id);

        if (error) throw error;
        toast.success('Document updated');
      } else {
        const { error } = await supabase
          .from('legal_documents')
          .insert([{
            org_id: profile?.org_id,
            document_type: docForm.document_type,
            title: docForm.title,
            content: docForm.content,
            version: docForm.version,
            is_active: docForm.is_active,
            created_by: user?.id
          }] as any);

        if (error) throw error;
        toast.success('Document created');
      }

      setShowDocDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessGDPR = async (request: GDPRDataRequest, status: 'completed' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('gdpr_data_requests')
        .update({
          status,
          processed_at: new Date().toISOString(),
          processed_by: user?.id
        })
        .eq('id', request.id);

      if (error) throw error;
      toast.success(`Request ${status}`);
      fetchData();
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('Failed to process request');
    }
  };

  const exportConsents = () => {
    const csv = [
      ['User ID', 'Document Type', 'Version', 'Consented At', 'Method'].join(','),
      ...consents.map(c => [
        c.user_id,
        c.document_type,
        c.document_version,
        format(new Date(c.consented_at), 'yyyy-MM-dd HH:mm:ss'),
        c.consent_method
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consent-records-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Legal & Compliance</h2>
          <p className="text-muted-foreground">Manage legal documents and user consent</p>
        </div>
      </div>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="consents" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Consent Records
          </TabsTrigger>
          <TabsTrigger value="gdpr" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            GDPR Requests
          </TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Legal Documents</CardTitle>
                <Button onClick={() => handleOpenDocDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No legal documents created yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Effective Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{DOCUMENT_TYPE_LABELS[doc.document_type]}</Badge>
                        </TableCell>
                        <TableCell>v{doc.version}</TableCell>
                        <TableCell>
                          <Badge variant={doc.is_active ? 'default' : 'secondary'}>
                            {doc.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(doc.effective_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" asChild>
                              <a href={`/${doc.document_type}`} target="_blank">
                                <Eye className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleOpenDocDialog(doc)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consents Tab */}
        <TabsContent value="consents">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>User Consent Records</CardTitle>
                <Button variant="outline" onClick={exportConsents}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {consents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No consent records yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consents.map((consent) => (
                      <TableRow key={consent.id}>
                        <TableCell className="font-mono text-sm">
                          {consent.user_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{DOCUMENT_TYPE_LABELS[consent.document_type] || consent.document_type}</Badge>
                        </TableCell>
                        <TableCell>v{consent.document_version}</TableCell>
                        <TableCell>{consent.consent_method}</TableCell>
                        <TableCell>
                          {format(new Date(consent.consented_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          {consent.withdrawn_at ? (
                            <Badge variant="destructive">Withdrawn</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GDPR Tab */}
        <TabsContent value="gdpr">
          <Card>
            <CardHeader>
              <CardTitle>GDPR Data Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {gdprRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No GDPR requests submitted
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Request Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gdprRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-sm">
                          {request.user_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.request_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            request.status === 'completed' ? 'default' :
                            request.status === 'rejected' ? 'destructive' : 'secondary'
                          }>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.requested_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          {request.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleProcessGDPR(request, 'completed')}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleProcessGDPR(request, 'rejected')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Document Dialog */}
      <Dialog open={showDocDialog} onOpenChange={setShowDocDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDoc ? 'Edit' : 'Create'} Legal Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Document Type</Label>
                <Select
                  value={docForm.document_type}
                  onValueChange={(v) => setDocForm({ ...docForm, document_type: v })}
                  disabled={!!editingDoc}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terms">Terms & Conditions</SelectItem>
                    <SelectItem value="privacy">Privacy Policy</SelectItem>
                    <SelectItem value="refund">Refund Policy</SelectItem>
                    <SelectItem value="cookie">Cookie Policy</SelectItem>
                    <SelectItem value="gdpr">GDPR Policy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Version</Label>
                <Input
                  value={docForm.version}
                  onChange={(e) => setDocForm({ ...docForm, version: e.target.value })}
                  placeholder="1.0"
                />
              </div>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={docForm.title}
                onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                placeholder="Enter document title"
              />
            </div>
            <div>
              <Label>Content (HTML supported)</Label>
              <Textarea
                value={docForm.content}
                onChange={(e) => setDocForm({ ...docForm, content: e.target.value })}
                placeholder="Enter document content..."
                rows={12}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={docForm.is_active}
                onCheckedChange={(checked) => setDocForm({ ...docForm, is_active: checked })}
              />
              <Label>Active (visible to users)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDocument} disabled={!docForm.title || !docForm.content || isProcessing}>
              {editingDoc ? 'Update' : 'Create'} Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
