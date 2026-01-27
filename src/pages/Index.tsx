import { useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const Index = forwardRef<HTMLDivElement>(function Index(_, ref) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [user, isLoading, navigate]);

  return (
    <div ref={ref} className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label="Loading application">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" aria-hidden="true" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
});

export default Index;
