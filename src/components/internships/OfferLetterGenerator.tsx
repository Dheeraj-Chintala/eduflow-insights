import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Send, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { fromTable } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import type { InternshipApplication, Internship, InternshipOfferLetter } from '@/types/internship';
import { format } from 'date-fns';
import { nanoid } from 'nanoid';

interface OfferLetterGeneratorProps {
  application: InternshipApplication & { internship?: Internship; user?: { full_name?: string } };
  onSuccess?: () => void;
}

const defaultOfferTemplate = (data: {
  candidateName: string;
  internshipTitle: string;
  department?: string;
  startDate: string;
  endDate?: string;
  stipend?: number;
  location?: string;
  isRemote?: boolean;
}) => `
Dear ${data.candidateName},

We are pleased to offer you the position of ${data.internshipTitle} Intern${data.department ? ` in our ${data.department} department` : ''}.

INTERNSHIP DETAILS:
- Position: ${data.internshipTitle} Intern
- Start Date: ${data.startDate}
${data.endDate ? `- End Date: ${data.endDate}` : ''}
${data.stipend ? `- Monthly Stipend: ₹${data.stipend.toLocaleString()}` : ''}
- Work Mode: ${data.isRemote ? 'Remote' : data.location || 'On-site'}

During this internship, you will have the opportunity to gain valuable hands-on experience and contribute to real projects. We believe you will be a valuable addition to our team.

Please confirm your acceptance of this offer by the deadline mentioned below. If you have any questions, please don't hesitate to reach out.

We look forward to having you on board!

Best regards,
The Team
`;

export function OfferLetterGenerator({ application, onSuccess }: OfferLetterGeneratorProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    start_date: application.internship?.start_date || '',
    end_date: application.internship?.end_date || '',
    stipend_amount: application.internship?.stipend_amount || 0,
    expires_at: '',
    terms_and_conditions: '',
    content: '',
  });

  const generateContent = () => {
    const content = defaultOfferTemplate({
      candidateName: application.user?.full_name || 'Candidate',
      internshipTitle: application.internship?.title || 'Internship',
      department: application.internship?.department,
      startDate: formData.start_date ? format(new Date(formData.start_date), 'MMMM dd, yyyy') : 'TBD',
      endDate: formData.end_date ? format(new Date(formData.end_date), 'MMMM dd, yyyy') : undefined,
      stipend: formData.stipend_amount,
      location: application.internship?.location,
      isRemote: application.internship?.is_remote,
    });
    setFormData({ ...formData, content });
  };

  const handleSave = async (sendNow: boolean = false) => {
    if (!formData.start_date) {
      toast.error('Start date is required');
      return;
    }
    if (!formData.content) {
      toast.error('Please generate or enter offer letter content');
      return;
    }

    setLoading(true);
    try {
      const offerData = {
        application_id: application.id,
        internship_id: application.internship_id,
        user_id: application.user_id,
        offer_number: `OL-${nanoid(8).toUpperCase()}`,
        content: formData.content,
        stipend_amount: formData.stipend_amount || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        terms_and_conditions: formData.terms_and_conditions || null,
        expires_at: formData.expires_at || null,
        status: sendNow ? 'sent' : 'draft',
        sent_at: sendNow ? new Date().toISOString() : null,
        issued_by: user?.id,
      };

      const { error } = await fromTable('internship_offer_letters').insert(offerData);
      if (error) throw error;

      if (sendNow) {
        // Update application status to accepted
        await fromTable('internship_applications')
          .update({ status: 'accepted', reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
          .eq('id', application.id);
      }

      toast.success(sendNow ? 'Offer letter sent successfully' : 'Offer letter saved as draft');
      setIsOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving offer letter:', error);
      toast.error(error.message || 'Failed to save offer letter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm">
        <FileText className="h-4 w-4 mr-2" />
        Generate Offer
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Offer Letter</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Applicant Info */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Applicant Information</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{application.user?.full_name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">
                      {application.internship?.title}
                    </p>
                  </div>
                  <Badge>Application #{application.id.slice(0, 8)}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Offer Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="stipend_amount">Monthly Stipend (₹)</Label>
                <Input
                  id="stipend_amount"
                  type="number"
                  value={formData.stipend_amount}
                  onChange={(e) => setFormData({ ...formData, stipend_amount: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="expires_at">Offer Expiry Date</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            {/* Offer Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Offer Letter Content</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={generateContent}>
                    Generate Template
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsPreview(!isPreview)}
                    disabled={!formData.content}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {isPreview ? 'Edit' : 'Preview'}
                  </Button>
                </div>
              </div>
              
              {isPreview ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                      {formData.content}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter or generate offer letter content..."
                  className="min-h-64 font-mono text-sm"
                />
              )}
            </div>

            <div>
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={formData.terms_and_conditions}
                onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
                placeholder="Any additional terms and conditions..."
                className="min-h-20"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={() => handleSave(false)} disabled={loading}>
                <Download className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button onClick={() => handleSave(true)} disabled={loading}>
                <Send className="h-4 w-4 mr-2" />
                Send Offer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
