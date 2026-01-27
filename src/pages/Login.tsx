import { useState, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, GraduationCap, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const Login = forwardRef<HTMLDivElement>(function Login(_, ref) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, user, roles, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  /* ---------- REDIRECT AFTER AUTH ---------- */
  useEffect(() => {
    if (user && !authLoading) {
      navigate(getRedirectPath(roles), { replace: true });
    }
  }, [user, authLoading, roles, navigate]);

  const getRedirectPath = (userRoles: string[]) => {
    if (userRoles.includes('super_admin') || userRoles.includes('org_admin')) {
      return '/org/overview';
    }
    if (
      userRoles.includes('instructor') ||
      userRoles.includes('content_creator')
    ) {
      return '/instructor/dashboard';
    }
    return '/dashboard';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast({
        title: 'Invalid input',
        description: parsed.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: 'Welcome back!',
      description: 'Signed in successfully.',
    });
  };

  return (
    <div ref={ref} className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero items-center justify-center p-12">
        <GraduationCap className="w-16 h-16 text-primary-foreground" aria-hidden="true" />
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Sign in</CardTitle>
            <CardDescription className="text-center">
              Access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" aria-label="Login form">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="email"
                  aria-required="true"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="pr-10"
                    autoComplete="current-password"
                    aria-required="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <Button className="w-full" disabled={isSubmitting} aria-busy={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export default Login;
