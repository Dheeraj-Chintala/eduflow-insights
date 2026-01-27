import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fromTable } from '@/lib/supabase-helpers';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Clock, Briefcase, DollarSign, Search, Building2 } from 'lucide-react';
import type { JobPosting, EmploymentType } from '@/types/jobs';
import { formatDistanceToNow } from 'date-fns';

const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  internship: 'Internship',
  freelance: 'Freelance',
};

export default function JobList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [employmentFilter, setEmploymentFilter] = useState<string>('all');

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    setLoading(true);
    const { data, error } = await fromTable('job_postings')
      .select('*, employer:employers(*)')
      .eq('status', 'open')
      .order('posted_at', { ascending: false });

    if (!error && data) {
      setJobs(data as JobPosting[]);
    }
    setLoading(false);
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.employer?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = employmentFilter === 'all' || job.employment_type === employmentFilter;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs, companies, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={employmentFilter} onValueChange={setEmploymentFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Employment Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No jobs found</h3>
            <p className="text-muted-foreground">Check back later for new opportunities</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredJobs.map(job => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Building2 className="h-4 w-4" />
                      {job.employer?.company_name || 'Unknown Company'}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {EMPLOYMENT_TYPE_LABELS[job.employment_type]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-2 mb-4">
                  {job.description || 'No description provided'}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                      {job.is_remote && ' (Remote)'}
                    </span>
                  )}
                  {job.experience_min_years !== undefined && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {job.experience_min_years}
                      {job.experience_max_years ? `-${job.experience_max_years}` : '+'} years
                    </span>
                  )}
                  {(job.salary_min || job.salary_max) && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {job.salary_min && job.salary_max
                        ? `${job.salary_currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                        : job.salary_min
                          ? `${job.salary_currency} ${job.salary_min.toLocaleString()}+`
                          : `Up to ${job.salary_currency} ${job.salary_max?.toLocaleString()}`}
                    </span>
                  )}
                </div>
                {job.skills_required && job.skills_required.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {job.skills_required.slice(0, 5).map(skill => (
                      <Badge key={skill} variant="outline">{skill}</Badge>
                    ))}
                    {job.skills_required.length > 5 && (
                      <Badge variant="outline">+{job.skills_required.length - 5} more</Badge>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Posted {job.posted_at ? formatDistanceToNow(new Date(job.posted_at), { addSuffix: true }) : 'recently'}
                </span>
                <Button onClick={() => navigate(`/jobs/${job.id}`)}>
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
