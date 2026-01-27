import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, Users, Lock, CalendarDays, Loader2 } from 'lucide-react';
import type { Course, CourseType, EnrollmentType, DifficultyLevel } from '@/types/database';

interface CourseSettingsFormProps {
  course: Course;
  onSave: (settings: Partial<Course>) => Promise<void>;
  isSaving: boolean;
}

const DIFFICULTIES: { value: DifficultyLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const COURSE_TYPES: { value: CourseType; label: string; description: string }[] = [
  { value: 'free', label: 'Free', description: 'No payment required' },
  { value: 'paid', label: 'Paid', description: 'Requires payment to access' },
  { value: 'demo', label: 'Demo', description: 'Preview version with limited content' },
];

const ENROLLMENT_TYPES: { value: EnrollmentType; label: string; description: string }[] = [
  { value: 'open', label: 'Open Enrollment', description: 'Anyone can enroll anytime' },
  { value: 'batch', label: 'Batch-based', description: 'Enrollment in scheduled batches' },
  { value: 'approval', label: 'Approval Required', description: 'Manual approval needed' },
];

export function CourseSettingsForm({ course, onSave, isSaving }: CourseSettingsFormProps) {
  const [courseType, setCourseType] = useState<CourseType>(course.course_type || 'free');
  const [price, setPrice] = useState(course.price?.toString() || '0');
  const [currency, setCurrency] = useState(course.currency || 'USD');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(course.difficulty || 'beginner');
  const [estimatedHours, setEstimatedHours] = useState(course.estimated_hours?.toString() || '');
  const [maxStudents, setMaxStudents] = useState(course.max_students?.toString() || '');
  const [enrollmentType, setEnrollmentType] = useState<EnrollmentType>(course.enrollment_type || 'open');
  const [accessDays, setAccessDays] = useState(course.access_days?.toString() || '');
  const [isFeatured, setIsFeatured] = useState(course.is_featured || false);

  const handleSave = async () => {
    await onSave({
      course_type: courseType,
      price: parseFloat(price) || 0,
      currency,
      difficulty,
      estimated_hours: estimatedHours ? parseInt(estimatedHours) : undefined,
      max_students: maxStudents ? parseInt(maxStudents) : undefined,
      enrollment_type: enrollmentType,
      access_days: accessDays ? parseInt(accessDays) : null,
      is_featured: isFeatured,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-display">Course Settings</CardTitle>
        <CardDescription>Configure pricing, access, and enrollment options</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pricing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pricing" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="enrollment" className="gap-2">
              <Users className="h-4 w-4" />
              Enrollment
            </TabsTrigger>
            <TabsTrigger value="access" className="gap-2">
              <Lock className="h-4 w-4" />
              Access
            </TabsTrigger>
          </TabsList>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            <div className="space-y-4">
              <Label>Course Type</Label>
              <div className="grid gap-3 md:grid-cols-3">
                {COURSE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setCourseType(type.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      courseType === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {courseType === 'paid' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <Label>Featured Course</Label>
                <p className="text-xs text-muted-foreground">Show this course prominently on the platform</p>
              </div>
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
            </div>
          </TabsContent>

          {/* Enrollment Tab */}
          <TabsContent value="enrollment" className="space-y-6">
            <div className="space-y-4">
              <Label>Enrollment Type</Label>
              <div className="grid gap-3">
                {ENROLLMENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setEnrollmentType(type.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      enrollmentType === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{type.label}</div>
                      {enrollmentType === type.value && (
                        <Badge className="bg-primary">Selected</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxStudents">Maximum Students</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="maxStudents"
                    type="number"
                    min="0"
                    placeholder="Unlimited"
                    value={maxStudents}
                    onChange={(e) => setMaxStudents(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Leave empty for unlimited</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimated Duration (hours)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="estimatedHours"
                  type="number"
                  min="0"
                  placeholder="e.g., 20"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </TabsContent>

          {/* Access Tab */}
          <TabsContent value="access" className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="accessDays">Access Duration (days)</Label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="accessDays"
                  type="number"
                  min="0"
                  placeholder="Lifetime access"
                  value={accessDays}
                  onChange={(e) => setAccessDays(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty for lifetime access. Students will lose access after this many days from enrollment.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Access Rules</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Configure additional access requirements like prerequisites, roles, or completion requirements.
              </p>
              <Button variant="outline" size="sm">
                Manage Access Rules
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-6 border-t mt-6">
          <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-primary hover:opacity-90">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
