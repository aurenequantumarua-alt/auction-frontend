import { Link, useNavigate } from 'react-router-dom';
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
import { ArrowLeft, KeyRound } from 'lucide-react';

const RequestSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type RequestFormData = z.infer<typeof RequestSchema>;

const ResetSchema = z
  .object({
    code: z
      .string()
      .length(6, 'Verification code must be 6 digits')
      .regex(/^\d+$/, 'Code must contain only digits'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type ResetFormData = z.infer<typeof ResetSchema>;

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);

  const {
    register: registerRequest,
    handleSubmit: handleRequestSubmit,
    formState: { errors: requestErrors, isSubmitting: isRequestSubmitting },
  } = useForm<RequestFormData>({
    resolver: zodResolver(RequestSchema),
  });

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors, isSubmitting: isResetSubmitting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(ResetSchema),
  });

  const onRequestCode = async (data: RequestFormData) => {
    try {
      await authApi.forgotPassword({ email: data.email });
      setEmailSentTo(data.email);
      toast.success('Verification code sent to your email.');
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  const onResetPassword = async (data: ResetFormData) => {
    if (!emailSentTo) return;
    try {
      const res = await authApi.resetPassword({
        email: emailSentTo,
        code: data.code,
        newPassword: data.password,
      });

      setSession({ user: res.user, accessToken: res.accessToken, refreshToken: res.refreshToken });
      refreshSocketAuth();
      toast.success('Password updated successfully! Welcome back.');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  if (emailSentTo) {
    return (
      <>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted font-mono mb-1">
          <KeyRound className="h-3.5 w-3.5 text-accent" />
          <span>New Password</span>
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Set new password.</h1>
        <p className="mt-2 text-sm text-muted">
          We sent a 6-digit verification code to <span className="font-medium text-ink">{emailSentTo}</span>.
        </p>

        <form onSubmit={handleResetSubmit(onResetPassword)} className="mt-6 space-y-4" noValidate>
          <div>
            <Label htmlFor="code">6-digit Verification Code</Label>
            <Input
              id="code"
              {...registerReset('code')}
              invalid={!!resetErrors.code}
              className="mt-1.5 tabular tracking-[0.3em] font-mono text-center text-lg"
              placeholder="000000"
              maxLength={6}
              autoFocus
            />
            <FieldError message={resetErrors.code?.message} />
          </div>

          <div>
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...registerReset('password')}
              invalid={!!resetErrors.password}
              className="mt-1.5"
              placeholder="At least 8 characters"
            />
            <FieldError message={resetErrors.password?.message} />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...registerReset('confirmPassword')}
              invalid={!!resetErrors.confirmPassword}
              className="mt-1.5"
              placeholder="Re-enter new password"
            />
            <FieldError message={resetErrors.confirmPassword?.message} />
          </div>

          <Button type="submit" size="lg" className="w-full mt-2" disabled={isResetSubmitting}>
            {isResetSubmitting ? 'Resetting…' : 'Reset password & sign in'}
          </Button>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setEmailSentTo(null)}
              className="text-xs text-muted hover:text-ink transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Change email
            </button>
            <button
              type="button"
              onClick={() => onRequestCode({ email: emailSentTo })}
              className="text-xs text-muted hover:text-ink transition-colors font-medium"
            >
              Resend code
            </button>
          </div>
        </form>
      </>
    );
  }

  return (
    <>
      <p className="kicker">Account recovery</p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-ink">Reset password.</h1>
      <p className="mt-2 text-sm text-muted">
        Enter the email address associated with your account, and we'll send you a 6-digit code to set a new password.
      </p>

      <form onSubmit={handleRequestSubmit(onRequestCode)} className="mt-8 space-y-5" noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...registerRequest('email')}
            invalid={!!requestErrors.email}
            className="mt-1.5"
            placeholder="you@example.com"
            autoFocus
          />
          <FieldError message={requestErrors.email?.message} />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isRequestSubmitting}>
          {isRequestSubmitting ? 'Sending code…' : 'Send verification code'}
        </Button>
      </form>

      <div className="mt-8 pt-4 border-t border-border/40 flex items-center justify-between text-sm text-muted">
        <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-ink hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
        <Link to="/signup" className="text-muted hover:text-ink transition-colors">
          Create account
        </Link>
      </div>
    </>
  );
};
