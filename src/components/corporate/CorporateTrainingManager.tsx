import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, Users, BookOpen, Calendar, Plus, Loader2, 
  CheckCircle, Clock, Target, Settings, BarChart3 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface TrainingProgram {
  id: string;
  name: string;
  description: string | null;
  course_ids: string[];
  target_departments: string[] | null;
  mandatory: boolean;
  deadline: string | null;
  status: string;
  created_at: string;
}

interface ProgramEnrollment {
  id: string;
  user_id: string;
  progress: number;
  status: string;
  enrolled_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
}

export const CorporateTrainingManager: React.FC = () => {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [enrollments, setEnrollments] = useState<ProgramEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Form state
  const [newProgram, setNewProgram] = useState({
    name: '',
    description: '',
    mandatory: false,
    deadline: '',
    target_departments: ''
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('corporate_training_programs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Failed to fetch programs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEnrollments = async (programId: string) => {
    try {
      const { data, error } = await supabase
        .from('corporate_training_enrollments')
        .select(`
          *,
          profiles:user_id (full_name, email)
        `)
        .eq('program_id', programId);

      if (error) throw error;
      
      setEnrollments((data || []).map(e => ({
        ...e,
        profile: Array.isArray(e.profiles) ? e.profiles[0] : e.profiles
      })));
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
    }
  };

  const createProgram = async () => {
    if (!user || !newProgram.name.trim()) {
      toast.error('Please enter a program name');
      return;
    }

    setIsCreating(true);
    try {
      // Get user's org_id
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (!userRole?.org_id) {
        toast.error('Organization not found');
        return;
      }

      const { error } = await supabase
        .from('corporate_training_programs')
        .insert({
          org_id: userRole.org_id,
          name: newProgram.name,
          description: newProgram.description || null,
          mandatory: newProgram.mandatory,
          deadline: newProgram.deadline || null,
          target_departments: newProgram.target_departments 
            ? newProgram.target_departments.split(',').map(d => d.trim())
            : null,
          created_by: user.id,
          status: 'draft'
        });

      if (error) throw error;

      toast.success('Training program created!');
      setShowCreateDialog(false);
      setNewProgram({ name: '', description: '', mandatory: false, deadline: '', target_departments: '' });
      fetchPrograms();
    } catch (error) {
      console.error('Failed to create program:', error);
      toast.error('Failed to create program');
    } finally {
      setIsCreating(false);
    }
  };

  const updateProgramStatus = async (programId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('corporate_training_programs')
        .update({ status })
        .eq('id', programId);

      if (error) throw error;
      toast.success(`Program ${status === 'active' ? 'activated' : 'updated'}!`);
      fetchPrograms();
    } catch (error) {
      console.error('Failed to update program:', error);
      toast.error('Failed to update program');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'draft': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              Corporate Training Programs
            </CardTitle>
            <CardDescription>
              Create and manage training programs for your organization
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Program
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Training Program</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Program Name</Label>
                  <Input
                    value={newProgram.name}
                    onChange={(e) => setNewProgram(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g., Q1 Compliance Training"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newProgram.description}
                    onChange={(e) => setNewProgram(p => ({ ...p, description: e.target.value }))}
                    placeholder="Program description..."
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Deadline</Label>
                    <Input
                      type="date"
                      value={newProgram.deadline}
                      onChange={(e) => setNewProgram(p => ({ ...p, deadline: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Target Departments</Label>
                    <Input
                      value={newProgram.target_departments}
                      onChange={(e) => setNewProgram(p => ({ ...p, target_departments: e.target.value }))}
                      placeholder="HR, Sales, IT"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Mandatory for all employees</Label>
                  <Switch
                    checked={newProgram.mandatory}
                    onCheckedChange={(checked) => setNewProgram(p => ({ ...p, mandatory: checked }))}
                  />
                </div>
                <Button onClick={createProgram} disabled={isCreating} className="w-full">
                  {isCreating ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    'Create Program'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {programs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No training programs yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {programs.map((program) => (
              <div
                key={program.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{program.name}</span>
                    <Badge variant={getStatusColor(program.status)}>{program.status}</Badge>
                    {program.mandatory && (
                      <Badge variant="destructive">Mandatory</Badge>
                    )}
                  </div>
                  {program.description && (
                    <p className="text-sm text-muted-foreground mt-1">{program.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {program.course_ids?.length || 0} courses
                    </span>
                    {program.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {new Date(program.deadline).toLocaleDateString()}
                      </span>
                    )}
                    {program.target_departments?.length && (
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {program.target_departments.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {program.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => updateProgramStatus(program.id, 'active')}
                    >
                      Activate
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedProgram(program);
                      fetchEnrollments(program.id);
                    }}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
