import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Link2, Plus, Trash2, AlertCircle } from 'lucide-react';
import { fromTable } from '@/lib/supabase-helpers';
import { useToast } from '@/hooks/use-toast';
import type { Course, CoursePrerequisite } from '@/types/database';

interface PrerequisitesManagerProps {
  courseId: string;
  orgId: string;
}

interface PrerequisiteWithCourse extends CoursePrerequisite {
  prerequisite_course?: Course;
}

export function PrerequisitesManager({ courseId, orgId }: PrerequisitesManagerProps) {
  const { toast } = useToast();
  const [prerequisites, setPrerequisites] = useState<PrerequisiteWithCourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [isRequired, setIsRequired] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      // Fetch existing prerequisites
      const { data: prereqData } = await fromTable('course_prerequisites')
        .select('*')
        .eq('course_id', courseId);

      if (prereqData) {
        // Fetch prerequisite course details
        const prereqCourseIds = (prereqData as CoursePrerequisite[]).map(p => p.prerequisite_course_id);
        
        if (prereqCourseIds.length > 0) {
          const { data: coursesData } = await fromTable('courses')
            .select('*')
            .in('id', prereqCourseIds);

          const courseMap = new Map((coursesData as Course[] || []).map(c => [c.id, c]));
          
          const prereqsWithCourses = (prereqData as CoursePrerequisite[]).map(p => ({
            ...p,
            prerequisite_course: courseMap.get(p.prerequisite_course_id),
          }));
          
          setPrerequisites(prereqsWithCourses);
        } else {
          setPrerequisites([]);
        }
      }

      // Fetch available courses (published courses in same org, excluding current course)
      const { data: allCourses } = await fromTable('courses')
        .select('*')
        .eq('org_id', orgId)
        .eq('status', 'published')
        .neq('id', courseId);

      setAvailableCourses((allCourses as Course[]) || []);
    } catch (error) {
      console.error('Error fetching prerequisites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPrerequisite = async () => {
    if (!selectedCourseId) return;

    setIsAdding(true);
    try {
      const { data, error } = await fromTable('course_prerequisites')
        .insert({
          course_id: courseId,
          prerequisite_course_id: selectedCourseId,
          is_required: isRequired,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already added',
            description: 'This course is already a prerequisite.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      const course = availableCourses.find(c => c.id === selectedCourseId);
      setPrerequisites([...prerequisites, { ...data, prerequisite_course: course }]);
      setSelectedCourseId('');
      
      toast({
        title: 'Prerequisite added',
        description: 'Course prerequisite has been added.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add prerequisite.',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemovePrerequisite = async (prereqId: string) => {
    try {
      const { error } = await fromTable('course_prerequisites')
        .delete()
        .eq('id', prereqId);

      if (error) throw error;

      setPrerequisites(prerequisites.filter(p => p.id !== prereqId));
      
      toast({
        title: 'Prerequisite removed',
        description: 'Course prerequisite has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove prerequisite.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleRequired = async (prereqId: string, newValue: boolean) => {
    try {
      const { error } = await fromTable('course_prerequisites')
        .update({ is_required: newValue })
        .eq('id', prereqId);

      if (error) throw error;

      setPrerequisites(prerequisites.map(p => 
        p.id === prereqId ? { ...p, is_required: newValue } : p
      ));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update prerequisite.',
        variant: 'destructive',
      });
    }
  };

  // Filter out courses that are already prerequisites
  const selectableCourses = availableCourses.filter(
    c => !prerequisites.some(p => p.prerequisite_course_id === c.id)
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Prerequisites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Prerequisites
        </CardTitle>
        <CardDescription>
          Require students to complete other courses before enrolling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Prerequisite */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a course..." />
            </SelectTrigger>
            <SelectContent>
              {selectableCourses.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No available courses
                </div>
              ) : (
                selectableCourses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="required"
                checked={isRequired}
                onCheckedChange={setIsRequired}
              />
              <Label htmlFor="required" className="text-sm whitespace-nowrap">Required</Label>
            </div>
            <Button 
              onClick={handleAddPrerequisite}
              disabled={!selectedCourseId || isAdding}
              className="bg-gradient-primary hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Prerequisites List */}
        {prerequisites.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No prerequisites configured</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add courses that students must complete before enrolling
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {prerequisites.map((prereq) => (
              <div 
                key={prereq.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {prereq.prerequisite_course?.title || 'Unknown Course'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {prereq.prerequisite_course?.category || 'No category'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={prereq.is_required ? 'default' : 'secondary'}>
                    {prereq.is_required ? 'Required' : 'Recommended'}
                  </Badge>
                  <Switch
                    checked={prereq.is_required}
                    onCheckedChange={(v) => handleToggleRequired(prereq.id, v)}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemovePrerequisite(prereq.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
