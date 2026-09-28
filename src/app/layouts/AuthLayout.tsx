import { Link, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/components/common/ScrollToTop';

export const AuthLayout = () => (
  <div className="grid min-h-screen lg:grid-cols-2">
    <ScrollToTop />
    <div className="flex items-center justify-center bg-canvas px-6 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="font-display text-3xl font-semibold tracking-tight text-ink">
          Aurene
        </Link>
        <div className="mt-12">
          <Outlet />
        </div>
      </div>
    </div>
    <div className="relative hidden bg-ink lg:block">
      <img
        src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-90"
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-ink/50 via-transparent to-transparent" />
      <div className="absolute bottom-12 left-12 right-12 text-canvas">
        <p className="kicker text-canvas/60">An archive, in motion</p>
        <h2 className="mt-3 font-display text-4xl font-semibold leading-tight">
          Designer fashion, <br /> brought to auction.
        </h2>
      </div>
    </div>
  </div>
);
