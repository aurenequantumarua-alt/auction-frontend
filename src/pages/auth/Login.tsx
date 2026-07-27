import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { Label, FieldError } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/authStore';
import { extractApiError } from '@/lib/api';
import { refreshSocketAuth } from '@/lib/socket';
import { useState } from 'react';

const Schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Required'),
});
type FormData = z.infer<typeof Schema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(Schema),
  });

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  const onSubmit = async (data: FormData) => {
    try {
      const result = await authApi.login(data);
      if ('requiresEmailVerification' in result) {
        setUnverifiedEmail(result.email);
        toast.success('Verification email sent — check your inbox');
        return;
      }
      setSession({ user: result.user, accessToken: result.accessToken });
      refreshSocketAuth();
      toast.success(`Welcome back, ${result.user.name.split(' ')[0]}.`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unverifiedEmail || otp.length !== 6) return;
    setIsVerifying(true);
    try {
      const result = await authApi.verifyEmail({ email: unverifiedEmail, code: otp });
      setSession({ user: result.user, accessToken: result.accessToken });
      refreshSocketAuth();
      toast.success('Email verified! You are now signed in.');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setIsVerifying(false);
    }
  };

  if (unverifiedEmail) {
    return (
      <>
        <p className="kicker">Verify email</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink">Check your inbox.</h1>
        <p className="mt-2 text-sm text-muted">
          We sent a 6-digit code to {unverifiedEmail}.
        </p>

        <form onSubmit={handleVerify} className="mt-8 space-y-5" noValidate>
          <div>
            <Label htmlFor="otp">Verification code</Label>
            <Input
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="mt-1.5 tabular tracking-[0.4em]"
              inputMode="numeric"
              placeholder="000000"
              autoFocus
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={isVerifying || otp.length !== 6}>
            {isVerifying ? 'Verifying…' : 'Verify & Continue'}
          </Button>
          <Button type="button" variant="ghost" size="lg" className="w-full" onClick={() => setUnverifiedEmail(null)}>
            Use a different email
          </Button>
        </form>
      </>
    );
  }

  return (
    <>
      <p className="kicker">Sign in</p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-ink">Welcome back.</h1>
      <p className="mt-2 text-sm text-muted">Continue where you left off.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} invalid={!!errors.email} className="mt-1.5" />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" {...register('password')} invalid={!!errors.password} className="mt-1.5" />
          <FieldError message={errors.password?.message} />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-8 text-sm text-muted">
        New to Aurene?{' '}
        <Link to="/signup" className="font-medium text-ink hover:underline">Create an account</Link>
      </p>
    </>
  );
};
