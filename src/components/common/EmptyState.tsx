import { type ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export const EmptyState = ({ title, description, action, icon }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    {icon && <div className="mb-4 text-ink-300">{icon}</div>}
    <h3 className="text-xl font-display font-semibold text-ink">{title}</h3>
    {description && <p className="mt-2 max-w-md text-sm text-muted">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);
