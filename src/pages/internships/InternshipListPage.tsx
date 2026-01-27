import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { InternshipList } from '@/components/internships/InternshipList';
import { useAuth } from '@/hooks/useAuth';
import type { Internship } from '@/types/internship';

export default function InternshipListPage() {
  const navigate = useNavigate();
  const { primaryRole } = useAuth();
  const canCreate = ['super_admin', 'admin', 'trainer', 'mentor'].includes(primaryRole || '');

  const handleSelect = (internship: Internship) => {
    navigate(`/internships/${internship.id}`);
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Internships</h1>
            <p className="text-muted-foreground mt-1">
              Browse and manage internship opportunities
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => navigate('/internships/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Internship
            </Button>
          )}
        </div>

        <InternshipList onSelect={handleSelect} />
      </div>
    </AppLayout>
  );
}
