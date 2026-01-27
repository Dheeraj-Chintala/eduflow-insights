import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { fromTable } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import type { Internship, InternshipStatus } from '@/types/internship';

const internshipSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  is_remote: z.boolean().default(false),
  duration_weeks: z.coerce.number().min(1).optional(),
  stipend_amount: z.coerce.number().min(0).optional(),
  stipend_currency: z.string().default('INR'),
  max_positions: z.coerce.number().min(1).default(1),
  skills_required: z.string().optional(),
  responsibilities: z.string().optional(),
  eligibility: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  application_deadline: z.string().optional(),
  status: z.enum(['draft', 'active', 'closed', 'completed']).default('draft'),
});

type InternshipFormData = z.infer<typeof internshipSchema>;

interface InternshipFormProps {
  internship?: Internship;
  onSuccess?: (internship: Internship) => void;
  onCancel?: () => void;
}

export function InternshipForm({ internship, onSuccess, onCancel }: InternshipFormProps) {
  const { user, orgId } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<InternshipFormData>({
    resolver: zodResolver(internshipSchema),
    defaultValues: {
      title: internship?.title || '',
      description: internship?.description || '',
      department: internship?.department || '',
      location: internship?.location || '',
      is_remote: internship?.is_remote || false,
      duration_weeks: internship?.duration_weeks || undefined,
      stipend_amount: internship?.stipend_amount || undefined,
      stipend_currency: internship?.stipend_currency || 'INR',
      max_positions: internship?.max_positions || 1,
      skills_required: internship?.skills_required?.join(', ') || '',
      responsibilities: internship?.responsibilities || '',
      eligibility: internship?.eligibility || '',
      start_date: internship?.start_date || '',
      end_date: internship?.end_date || '',
      application_deadline: internship?.application_deadline || '',
      status: internship?.status || 'draft',
    },
  });

  const onSubmit = async (data: InternshipFormData) => {
    if (!user || !orgId) {
      toast.error('You must be logged in');
      return;
    }

    setLoading(true);
    try {
      const internshipData = {
        ...data,
        skills_required: data.skills_required 
          ? data.skills_required.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        org_id: orgId,
        mentor_id: user.id,
        created_by: user.id,
      };

      let result;
      if (internship) {
        const { data: updated, error } = await fromTable('internships')
          .update(internshipData)
          .eq('id', internship.id)
          .select()
          .single();
        if (error) throw error;
        result = updated;
        toast.success('Internship updated successfully');
      } else {
        const { data: created, error } = await fromTable('internships')
          .insert(internshipData)
          .select()
          .single();
        if (error) throw error;
        result = created;
        toast.success('Internship created successfully');
      }

      onSuccess?.(result);
    } catch (error: any) {
      console.error('Error saving internship:', error);
      toast.error(error.message || 'Failed to save internship');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Internship Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Web Development Intern" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the internship opportunity..."
                      className="min-h-24"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Engineering" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mumbai, India" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_remote"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Remote Internship</FormLabel>
                    <FormDescription>
                      Allow interns to work from anywhere
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Duration & Compensation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="duration_weeks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (weeks)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="e.g., 12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stipend_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stipend Amount (per month)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="e.g., 10000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_positions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Positions</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="e.g., 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="skills_required"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Skills</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., React, Node.js, Python (comma separated)" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter skills separated by commas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responsibilities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsibilities</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List the key responsibilities..."
                      className="min-h-24"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eligibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eligibility Criteria</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe who can apply..."
                      className="min-h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dates & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="application_deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Deadline</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : internship ? 'Update Internship' : 'Create Internship'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
