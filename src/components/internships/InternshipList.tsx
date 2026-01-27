import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  IndianRupee, 
  Calendar,
  Users,
  Search,
  Filter
} from 'lucide-react';
import { fromTable } from '@/lib/supabase-helpers';
import type { Internship, InternshipStatus, INTERNSHIP_STATUS_LABELS } from '@/types/internship';
import { format } from 'date-fns';

interface InternshipListProps {
  onSelect?: (internship: Internship) => void;
  showActions?: boolean;
  filterStatus?: InternshipStatus;
}

export function InternshipList({ onSelect, showActions = true, filterStatus }: InternshipListProps) {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(filterStatus || 'all');

  useEffect(() => {
    fetchInternships();
  }, [statusFilter]);

  const fetchInternships = async () => {
    setLoading(true);
    try {
      let query = fromTable('internships').select('*').order('created_at', { ascending: false });
      
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setInternships(data || []);
    } catch (error) {
      console.error('Error fetching internships:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInternships = internships.filter(internship => 
    internship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    internship.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    internship.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: InternshipStatus) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'draft': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'closed': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'completed': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search internships..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Internship Cards */}
      {filteredInternships.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No internships found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredInternships.map((internship) => (
            <Card 
              key={internship.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelect?.(internship)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{internship.title}</CardTitle>
                    {internship.department && (
                      <p className="text-sm text-muted-foreground mt-1">{internship.department}</p>
                    )}
                  </div>
                  <Badge className={getStatusColor(internship.status)}>
                    {internship.status.charAt(0).toUpperCase() + internship.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {internship.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{internship.is_remote ? 'Remote' : internship.location}</span>
                    </div>
                  )}
                  {internship.duration_weeks && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{internship.duration_weeks} weeks</span>
                    </div>
                  )}
                  {internship.stipend_amount && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <IndianRupee className="h-4 w-4" />
                      <span>{internship.stipend_amount.toLocaleString()}/month</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{internship.max_positions} position(s)</span>
                  </div>
                </div>

                {internship.skills_required && internship.skills_required.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {internship.skills_required.slice(0, 5).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {internship.skills_required.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{internship.skills_required.length - 5} more
                      </Badge>
                    )}
                  </div>
                )}

                {internship.application_deadline && (
                  <div className="flex items-center gap-2 mt-4 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Apply by: {format(new Date(internship.application_deadline), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}

                {showActions && (
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); onSelect?.(internship); }}>
                      View Details
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
