import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fromTable } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import type { StudentResume } from '@/types/jobs';

const resumeSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  skills: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  portfolio_url: z.string().url().optional().or(z.literal('')),
  is_public: z.boolean().default(false),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string(),
    start_year: z.string(),
    end_year: z.string().optional(),
    grade: z.string().optional(),
  })),
  experience: z.array(z.object({
    company: z.string(),
    title: z.string(),
    location: z.string().optional(),
    start_date: z.string(),
    end_date: z.string().optional(),
    current: z.boolean(),
    description: z.string().optional(),
  })),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    url: z.string().optional(),
    technologies: z.string().optional(),
  })),
});

type ResumeFormData = z.infer<typeof resumeSchema>;

interface ResumeBuilderProps {
  onSave?: (resume: StudentResume) => void;
}

export default function ResumeBuilder({ onSave }: ResumeBuilderProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [existingResume, setExistingResume] = useState<StudentResume | null>(null);

  const form = useForm<ResumeFormData>({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      email: user?.email || '',
      phone: '',
      headline: '',
      summary: '',
      skills: '',
      linkedin_url: '',
      portfolio_url: '',
      is_public: false,
      education: [],
      experience: [],
      projects: [],
    },
  });

  const { fields: educationFields, append: appendEducation, remove: removeEducation } = 
    useFieldArray({ control: form.control, name: 'education' });
  
  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = 
    useFieldArray({ control: form.control, name: 'experience' });
  
  const { fields: projectFields, append: appendProject, remove: removeProject } = 
    useFieldArray({ control: form.control, name: 'projects' });

  useEffect(() => {
    if (user) {
      fetchResume();
    }
  }, [user]);

  async function fetchResume() {
    if (!user) return;
    
    setFetching(true);
    const { data, error } = await fromTable('student_resumes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setExistingResume(data as StudentResume);
      form.reset({
        full_name: data.full_name || profile?.full_name || '',
        email: data.email || user.email || '',
        phone: data.phone || '',
        headline: data.headline || '',
        summary: data.summary || '',
        skills: data.skills?.join(', ') || '',
        linkedin_url: data.linkedin_url || '',
        portfolio_url: data.portfolio_url || '',
        is_public: data.is_public || false,
        education: data.education || [],
        experience: data.experience || [],
        projects: (data.projects || []).map((p: any) => ({
          ...p,
          technologies: p.technologies?.join(', ') || '',
        })),
      });
    }
    setFetching(false);
  }

  async function onSubmit(data: ResumeFormData) {
    if (!user) return;

    setLoading(true);
    try {
      const resumeData = {
        user_id: user.id,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
        headline: data.headline || null,
        summary: data.summary || null,
        skills: data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        linkedin_url: data.linkedin_url || null,
        portfolio_url: data.portfolio_url || null,
        is_public: data.is_public,
        education: data.education,
        experience: data.experience,
        projects: data.projects.map(p => ({
          ...p,
          technologies: p.technologies ? p.technologies.split(',').map(t => t.trim()).filter(Boolean) : [],
        })),
      };

      let result;
      if (existingResume) {
        result = await fromTable('student_resumes')
          .update(resumeData)
          .eq('id', existingResume.id)
          .select()
          .single();
      } else {
        result = await fromTable('student_resumes')
          .insert(resumeData)
          .select()
          .single();
      }

      if (result.error) throw result.error;
      
      setExistingResume(result.data as StudentResume);
      toast.success('Resume saved successfully');
      onSave?.(result.data as StudentResume);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save resume');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume Builder</CardTitle>
        <CardDescription>
          Build your professional resume to apply for jobs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Accordion type="multiple" defaultValue={['personal', 'education']} className="space-y-4">
              {/* Personal Information */}
              <AccordionItem value="personal" className="border rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold">Personal Information</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="headline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Professional Headline</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Full Stack Developer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Summary</FormLabel>
                        <FormControl>
                          <Textarea rows={4} placeholder="Brief overview of your experience and goals..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skills</FormLabel>
                        <FormControl>
                          <Input placeholder="JavaScript, React, Node.js (comma-separated)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="linkedin_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://linkedin.com/in/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="portfolio_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Portfolio URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="is_public"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Make Resume Public</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Allow employers to discover your profile
                          </p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Education */}
              <AccordionItem value="education" className="border rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold">Education</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  {educationFields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Education {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEducation(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`education.${index}.institution`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Institution</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`education.${index}.degree`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Degree</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Bachelor's" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`education.${index}.field`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Field of Study</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Computer Science" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`education.${index}.grade`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Grade/CGPA</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`education.${index}.start_year`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Year</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`education.${index}.end_year`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Year</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendEducation({
                      institution: '',
                      degree: '',
                      field: '',
                      start_year: '',
                      end_year: '',
                      grade: '',
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Education
                  </Button>
                </AccordionContent>
              </AccordionItem>

              {/* Experience */}
              <AccordionItem value="experience" className="border rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold">Work Experience</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  {experienceFields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Experience {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExperience(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`experience.${index}.company`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`experience.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Title</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`experience.${index}.location`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`experience.${index}.current`}
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 pt-6">
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="!mt-0">Currently working here</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`experience.${index}.start_date`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <Input type="month" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`experience.${index}.end_date`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="month" 
                                  disabled={form.watch(`experience.${index}.current`)}
                                  {...field} 
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`experience.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea rows={3} placeholder="Key responsibilities and achievements..." {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendExperience({
                      company: '',
                      title: '',
                      location: '',
                      start_date: '',
                      end_date: '',
                      current: false,
                      description: '',
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Experience
                  </Button>
                </AccordionContent>
              </AccordionItem>

              {/* Projects */}
              <AccordionItem value="projects" className="border rounded-lg px-4">
                <AccordionTrigger className="text-lg font-semibold">Projects</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  {projectFields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Project {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProject(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`projects.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`projects.${index}.url`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://..." {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`projects.${index}.technologies`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Technologies Used</FormLabel>
                              <FormControl>
                                <Input placeholder="React, Node.js (comma-separated)" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`projects.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea rows={2} {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendProject({
                      name: '',
                      description: '',
                      url: '',
                      technologies: '',
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Project
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Resume
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
