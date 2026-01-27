import AppLayout from '@/layouts/AppLayout';
import ApplicationTracker from '@/components/jobs/ApplicationTracker';
import ResumeBuilder from '@/components/jobs/ResumeBuilder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MyApplications() {
  return (
    <AppLayout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">My Job Applications</h1>
          <p className="text-muted-foreground">Track your applications and manage your resume</p>
        </div>
        <Tabs defaultValue="applications">
          <TabsList>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="resume">My Resume</TabsTrigger>
          </TabsList>
          <TabsContent value="applications" className="mt-6">
            <ApplicationTracker />
          </TabsContent>
          <TabsContent value="resume" className="mt-6">
            <ResumeBuilder />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
