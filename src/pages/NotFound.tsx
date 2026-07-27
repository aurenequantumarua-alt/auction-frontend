import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export const NotFoundPage = () => (
  <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
    <p className="kicker">404</p>
    <h1 className="display-serif mt-3 text-display-lg font-semibold">Page not found</h1>
    <p className="mt-3 text-sm text-muted">The page you&apos;re looking for doesn&apos;t exist.</p>
    <Button asChild className="mt-6"><Link to="/">Back home</Link></Button>
  </div>
);
