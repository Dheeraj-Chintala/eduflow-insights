import AppLayout from '@/layouts/AppLayout';
import JobList from '@/components/jobs/JobList';

export default function JobListPage() {
  return (
    <AppLayout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Job Opportunities</h1>
          <p className="text-muted-foreground">Browse and apply for available positions</p>
        </div>
        <JobList />
      </div>
    </AppLayout>
  );
}
