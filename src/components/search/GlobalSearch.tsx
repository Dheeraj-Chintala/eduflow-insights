import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { fromTable } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import {
  BookOpen,
  Users,
  Search,
  Briefcase,
  Award,
  GraduationCap,
  FileText,
  Settings,
  LayoutDashboard,
} from 'lucide-react';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  id: string;
  title: string;
  type: 'course' | 'user' | 'internship' | 'job' | 'page';
  href: string;
  description?: string;
}

const quickLinks: SearchResult[] = [
  { id: 'dashboard', title: 'Dashboard', type: 'page', href: '/dashboard', description: 'Go to your dashboard' },
  { id: 'courses', title: 'Browse Courses', type: 'page', href: '/courses', description: 'Explore available courses' },
  { id: 'my-learning', title: 'My Learning', type: 'page', href: '/my-learning', description: 'Continue learning' },
  { id: 'settings', title: 'Settings', type: 'page', href: '/settings', description: 'Account settings' },
  { id: 'internships', title: 'Internships', type: 'page', href: '/internships', description: 'Browse internships' },
  { id: 'jobs', title: 'Jobs', type: 'page', href: '/jobs', description: 'Find job opportunities' },
];

const typeIcons = {
  course: BookOpen,
  user: Users,
  internship: Briefcase,
  job: Award,
  page: FileText,
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const { toast } = useToast();

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  const searchData = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      // Search courses
      const { data: courses } = await fromTable('courses')
        .select('id, title, description')
        .ilike('title', `%${searchQuery}%`)
        .limit(5);

      if (courses) {
        courses.forEach((course: any) => {
          searchResults.push({
            id: course.id,
            title: course.title,
            type: 'course',
            href: `/courses/${course.id}`,
            description: course.description?.substring(0, 60) || 'Course',
          });
        });
      }

      // Search internships
      const { data: internships } = await fromTable('internships')
        .select('id, title, description')
        .ilike('title', `%${searchQuery}%`)
        .limit(3);

      if (internships) {
        internships.forEach((internship: any) => {
          searchResults.push({
            id: internship.id,
            title: internship.title,
            type: 'internship',
            href: `/internships/${internship.id}`,
            description: internship.description?.substring(0, 60) || 'Internship',
          });
        });
      }

      // Search jobs
      const { data: jobs } = await fromTable('job_postings')
        .select('id, title, company_name')
        .ilike('title', `%${searchQuery}%`)
        .limit(3);

      if (jobs) {
        jobs.forEach((job: any) => {
          searchResults.push({
            id: job.id,
            title: job.title,
            type: 'job',
            href: `/jobs/${job.id}`,
            description: job.company_name || 'Job posting',
          });
        });
      }

      // Filter quick links that match
      const matchingLinks = quickLinks.filter((link) =>
        link.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      searchResults.push(...matchingLinks);

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchData(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchData]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    navigate(result.href);
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
        aria-label="Search courses, users, and more. Press Control K to open."
      >
        <Search className="mr-2 h-4 w-4" aria-hidden="true" />
        <span className="hidden lg:inline-flex">Search...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        <DialogDescription className="sr-only">
          Search for courses, internships, jobs, and navigate to different pages
        </DialogDescription>
        <CommandInput
          placeholder="Search courses, internships, jobs..."
          value={query}
          onValueChange={setQuery}
          aria-label="Search input"
        />
        <CommandList>
          {isLoading && (
            <div className="py-6 text-center text-sm text-muted-foreground" role="status">
              <span className="animate-pulse">Searching...</span>
            </div>
          )}
          
          <CommandEmpty>No results found.</CommandEmpty>

          {!query && (
            <CommandGroup heading="Quick Links">
              {quickLinks.slice(0, 4).map((link) => {
                const Icon = typeIcons[link.type];
                return (
                  <CommandItem
                    key={link.id}
                    value={link.title}
                    onSelect={() => handleSelect(link)}
                  >
                    <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                    <div className="flex flex-col">
                      <span>{link.title}</span>
                      <span className="text-xs text-muted-foreground">{link.description}</span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {results.length > 0 && (
            <>
              {['course', 'internship', 'job', 'page'].map((type) => {
                const typeResults = results.filter((r) => r.type === type);
                if (typeResults.length === 0) return null;

                const Icon = typeIcons[type as keyof typeof typeIcons];
                const heading = type === 'course' ? 'Courses' : 
                               type === 'internship' ? 'Internships' : 
                               type === 'job' ? 'Jobs' : 'Pages';

                return (
                  <CommandGroup key={type} heading={heading}>
                    {typeResults.map((result) => (
                      <CommandItem
                        key={result.id}
                        value={result.title}
                        onSelect={() => handleSelect(result)}
                      >
                        <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                        <div className="flex flex-col">
                          <span>{result.title}</span>
                          {result.description && (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {result.description}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
