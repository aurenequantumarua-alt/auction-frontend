import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 select-none disabled:pointer-events-none disabled:opacity-50 active:translate-y-px',
  {
    variants: {
      variant: {
        primary:
          'bg-ink text-canvas hover:bg-ink-700 shadow-sm',
        secondary:
          'bg-canvas text-ink border border-line hover:border-ink hover:bg-ink-50',
        ghost: 'text-ink hover:bg-ink-50',
        danger: 'bg-danger text-canvas hover:opacity-90',
        link: 'text-ink underline-offset-4 hover:underline px-0',
      },
      size: {
        sm: 'h-9 px-3 text-sm rounded',
        md: 'h-11 px-5 text-sm rounded',
        lg: 'h-14 px-8 text-base rounded',
        icon: 'h-10 w-10 rounded',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
