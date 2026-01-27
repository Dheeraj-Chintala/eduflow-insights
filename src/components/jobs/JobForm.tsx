import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fromTable } from '@/lib/supabase-helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { JobPosting, EmploymentType } from '@/types/jobs';

const jobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  responsibilities: z.string().optional(),
  requirements: z.string().optional(),
  skills_required: z.string().optional(),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'internship', 'freelance']),
  experience_min_years: z.coerce.number().min(0),
  experience_max_years: z.coerce.number().optional(),
  salary_min: z.coerce.number().optional(),
  salary_max: z.coerce.number().optional(),
  salary_currency: z.string().default('INR'),
  location: z.string().optional(),
  is_remote: z.boolean().default(false),
  eligibility_criteria: z.string().optional(),
  application_deadline: z.string().optional(),
  max_applications: z.coerce.number().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

interface JobFormProps {
  employerId: string;
  orgId: string;
  job?: JobPosting;
  onSuccess?: () => void;
}

export default function JobForm({ employerId, orgId, job, onSuccess }: JobFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: job?.title || '',
      description: job?.description || '',
      responsibilities: job?.responsibilities || '',
      requirements: job?.requirements || '',
      skills_required: job?.skills_required?.join(', ') || '',
      employment_type: job?.employment_type || 'full_time',
      experience_min_years: job?.experience_min_years || 0,
      experience_max_years: job?.experience_max_years,
      salary_min: job?.salary_min,
      salary_max: job?.salary_max,
      salary_currency: job?.salary_currency || 'INR',
      location: job?.location || '',
      is_remote: job?.is_remote || false,
      eligibility_criteria: job?.eligibility_criteria || '',
      application_deadline: job?.application_deadline?.split('T')[0] || '',
      max_applications: job?.max_applications,
    },
  });

  async function onSubmit(data: JobFormData) {
    setLoading(true);
    try {
      const jobData = {
        ...data,
        employer_id: employerId,
        org_id: orgId,
        skills_required: data.skills_required
          ? data.skills_required.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        application_deadline: data.application_deadline || null,
      };

      if (job) {
        const { error } = await fromTable('job_postings')
          .update(jobData)
          .eq('id', job.id);

        if (error) throw error;
        toast.success('Job updated successfully');
      } else {
        const { error } = await fromTable('job_postings')
          .insert(jobData);

        if (error) throw error;
        toast.success('Job created successfully');
      }

      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save job');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{job ? 'Edit Job' : 'Create New Job'}</CardTitle>
        <CardDescription>
          {job ? 'Update the job posting details' : 'Fill in the details for your new job posting'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Senior Software Engineer" {...field} />
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
                      placeholder="Describe the role and what the candidate will be doing..."
                      rows={4}
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
                name="employment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Input placeholder="e.g. Mumbai, India" {...field} />
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Remote Work</FormLabel>
                    <FormDescription>
                      Is this position available for remote work?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="experience_min_years"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Experience (years)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience_max_years"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Experience (years)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="salary_currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salary_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Salary</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="e.g. 500000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salary_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Salary</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="e.g. 1000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="skills_required"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Skills</FormLabel>
                  <FormControl>
                    <Input placeholder="React, Node.js, TypeScript (comma-separated)" {...field} />
                  </FormControl>
                  <FormDescription>Enter skills separated by commas</FormDescription>
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
                      placeholder="Key responsibilities for this role..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirements</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Qualifications and requirements..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eligibility_criteria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eligibility Criteria</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Who can apply..."
                      rows={2}
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

              <FormField
                control={form.control}
                name="max_applications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Applications</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="Leave empty for unlimited" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {job ? 'Update Job' : 'Create Job'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
