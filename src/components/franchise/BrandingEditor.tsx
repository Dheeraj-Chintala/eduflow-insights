import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fromTable } from '@/lib/supabase-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2, Palette } from 'lucide-react';
import type { FranchiseBranding } from '@/types/franchise';

const brandingSchema = z.object({
  logo_url: z.string().url().optional().or(z.literal('')),
  favicon_url: z.string().url().optional().or(z.literal('')),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  custom_domain: z.string().optional(),
  tagline: z.string().max(100).optional(),
  support_email: z.string().email().optional().or(z.literal('')),
  support_phone: z.string().optional(),
  footer_text: z.string().optional(),
  social_facebook: z.string().url().optional().or(z.literal('')),
  social_twitter: z.string().url().optional().or(z.literal('')),
  social_linkedin: z.string().url().optional().or(z.literal('')),
  social_instagram: z.string().url().optional().or(z.literal('')),
});

type BrandingFormData = z.infer<typeof brandingSchema>;

interface BrandingEditorProps {
  franchiseId: string;
  branding?: FranchiseBranding;
  onSave?: () => void;
}

export default function BrandingEditor({ franchiseId, branding, onSave }: BrandingEditorProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      logo_url: branding?.logo_url || '',
      favicon_url: branding?.favicon_url || '',
      primary_color: branding?.primary_color || '#3B82F6',
      secondary_color: branding?.secondary_color || '#1E40AF',
      accent_color: branding?.accent_color || '#F59E0B',
      custom_domain: branding?.custom_domain || '',
      tagline: branding?.tagline || '',
      support_email: branding?.support_email || '',
      support_phone: branding?.support_phone || '',
      footer_text: branding?.footer_text || '',
      social_facebook: branding?.social_facebook || '',
      social_twitter: branding?.social_twitter || '',
      social_linkedin: branding?.social_linkedin || '',
      social_instagram: branding?.social_instagram || '',
    },
  });

  async function onSubmit(data: BrandingFormData) {
    setLoading(true);
    try {
      const brandingData = {
        franchise_id: franchiseId,
        ...data,
        logo_url: data.logo_url || null,
        favicon_url: data.favicon_url || null,
        custom_domain: data.custom_domain || null,
        tagline: data.tagline || null,
        support_email: data.support_email || null,
        support_phone: data.support_phone || null,
        footer_text: data.footer_text || null,
        social_facebook: data.social_facebook || null,
        social_twitter: data.social_twitter || null,
        social_linkedin: data.social_linkedin || null,
        social_instagram: data.social_instagram || null,
      };

      if (branding) {
        const { error } = await fromTable('franchise_branding')
          .update(brandingData)
          .eq('id', branding.id);
        if (error) throw error;
      } else {
        const { error } = await fromTable('franchise_branding')
          .insert(brandingData);
        if (error) throw error;
      }

      toast.success('Branding saved successfully');
      onSave?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save branding');
    } finally {
      setLoading(false);
    }
  }

  const watchedColors = form.watch(['primary_color', 'secondary_color', 'accent_color']);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          White-Label Branding
        </CardTitle>
        <CardDescription>Customize your brand appearance</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Logo & Favicon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://your-logo.com/logo.png" {...field} />
                    </FormControl>
                    <FormDescription>Your brand logo (recommended: 200x60px)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="favicon_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favicon URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://your-site.com/favicon.ico" {...field} />
                    </FormControl>
                    <FormDescription>Browser tab icon (32x32px)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Colors */}
            <div>
              <h3 className="font-medium mb-4">Brand Colors</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="primary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input type="color" className="w-12 h-10 p-1" {...field} />
                        </FormControl>
                        <Input value={field.value} onChange={field.onChange} className="flex-1" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Color</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input type="color" className="w-12 h-10 p-1" {...field} />
                        </FormControl>
                        <Input value={field.value} onChange={field.onChange} className="flex-1" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accent_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accent Color</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input type="color" className="w-12 h-10 p-1" {...field} />
                        </FormControl>
                        <Input value={field.value} onChange={field.onChange} className="flex-1" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Color Preview */}
              <div className="mt-4 p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Preview</p>
                <div className="flex gap-2">
                  <div 
                    className="w-20 h-10 rounded flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: watchedColors[0] }}
                  >
                    Primary
                  </div>
                  <div 
                    className="w-20 h-10 rounded flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: watchedColors[1] }}
                  >
                    Secondary
                  </div>
                  <div 
                    className="w-20 h-10 rounded flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: watchedColors[2] }}
                  >
                    Accent
                  </div>
                </div>
              </div>
            </div>

            {/* Domain & Tagline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="custom_domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Domain</FormLabel>
                    <FormControl>
                      <Input placeholder="learn.yourbrand.com" {...field} />
                    </FormControl>
                    <FormDescription>Your custom subdomain (requires DNS setup)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tagline</FormLabel>
                    <FormControl>
                      <Input placeholder="Learn. Grow. Succeed." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Support Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="support_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Support Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="support@yourbrand.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="support_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Support Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="footer_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Footer Text</FormLabel>
                  <FormControl>
                    <Input placeholder="© 2024 Your Brand. All rights reserved." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Social Links */}
            <div>
              <h3 className="font-medium mb-4">Social Media Links</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="social_facebook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook</FormLabel>
                      <FormControl>
                        <Input placeholder="https://facebook.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="social_twitter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter</FormLabel>
                      <FormControl>
                        <Input placeholder="https://twitter.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="social_linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl>
                        <Input placeholder="https://linkedin.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="social_instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl>
                        <Input placeholder="https://instagram.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Branding
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
