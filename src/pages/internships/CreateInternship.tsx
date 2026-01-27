import { useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { InternshipForm } from '@/components/internships/InternshipForm';
import type { Internship } from '@/types/internship';

export default function CreateInternship() {
  const navigate = useNavigate();

  const handleSuccess = (internship: Internship) => {
    navigate(`/internships/${internship.id}`);
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/internships')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Internships
          </Button>
          <h1 className="text-2xl font-bold">Create Internship</h1>
          <p className="text-muted-foreground mt-1">
            Set up a new internship opportunity
          </p>
        </div>

        <InternshipForm 
          onSuccess={handleSuccess}
          onCancel={() => navigate('/internships')}
        />
      </div>
    </AppLayout>
  );
}
