import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded border bg-canvas px-3 text-sm text-ink placeholder:text-ink-300',
        'transition-colors duration-150',
        'border-line hover:border-ink-200 focus:border-ink focus:outline-none',
        invalid && 'border-danger focus:border-danger',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[120px] w-full rounded border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-300',
        'transition-colors duration-150 resize-y',
        'border-line hover:border-ink-200 focus:border-ink focus:outline-none',
        invalid && 'border-danger focus:border-danger',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
