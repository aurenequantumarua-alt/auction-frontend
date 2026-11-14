import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { useThemeStore } from '@/features/theme/themeStore';
import { cn } from '@/lib/cn';

export const RootLayout = () => {
  const location = useLocation();
  const isAntiqueMode = useThemeStore((s) => s.isAntiqueMode);
  const isAntique = isAntiqueMode || location.pathname.startsWith('/antiques');

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col transition-colors duration-200',
        isAntique ? 'bg-[#FBFBF9] text-[#131C2A]' : 'bg-canvas text-ink',
      )}
    >
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
