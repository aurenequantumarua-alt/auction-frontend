import * as LabelPrimitive from '@radix-ui/react-label';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

export const Label = forwardRef<
  HTMLLabelElement,
  ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn('text-xs font-medium uppercase tracking-kicker text-muted', className)}
    {...props}
  />
));
Label.displayName = 'Label';

export const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1.5 text-xs text-danger">{message}</p> : null;
