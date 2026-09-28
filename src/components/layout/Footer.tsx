import { Link } from 'react-router-dom';

export const Footer = () => (
  <footer className="mt-24 border-t border-line py-12">
    <div className="container flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
      <div>
        <div className="font-display text-xl font-semibold text-ink">Aurene</div>
        <p className="mt-2 max-w-sm text-sm text-muted">
          A curated auction house for designer fashion — archive pieces, deadstock, and personal pulls.
        </p>
      </div>
      <div className="flex flex-wrap gap-6 text-sm text-muted">
        <Link to="/browse" className="hover:text-ink transition-colors">Browse</Link>
        <Link to="/sell" className="hover:text-ink transition-colors">Sell</Link>
        <Link to="/about" className="hover:text-ink transition-colors">About</Link>
        <Link to="/terms" className="hover:text-ink transition-colors">Terms</Link>
        <Link to="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
      </div>
    </div>
    <div className="container mt-8 text-xs text-ink-300">
      © {new Date().getFullYear()} Aurene. All rights reserved.
    </div>
  </footer>
);
