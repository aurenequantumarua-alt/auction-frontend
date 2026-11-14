import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { LandingPage } from '@/pages/Landing';
import { BrowsePage } from '@/pages/Browse';
import { AuctionDetailPage } from '@/pages/AuctionDetail';
import { LoginPage } from '@/pages/auth/Login';
import { SignupPage } from '@/pages/auth/Signup';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPassword';
import { SellPage } from '@/pages/Sell';
import { CreateAuctionPage } from '@/pages/seller/CreateAuction';
import { WatchlistPage } from '@/pages/Watchlist';
import { BidHistoryPage } from '@/pages/BidHistoryPage';
import { WonAuctionsPage } from '@/pages/WonAuctions';
import { ProfilePage } from '@/pages/Profile';
import { WalletPage } from '@/pages/Wallet';
import { BankAccountPage } from '@/pages/BankAccount';
import { NotFoundPage } from '@/pages/NotFound';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { AdminRoute } from '@/components/common/AdminRoute';
import { AdminPage } from '@/pages/admin/AdminPage';
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage';
import { AdminDisputesPage } from '@/pages/admin/AdminDisputesPage';
import { AdminPayoutsPage } from '@/pages/admin/AdminPayoutsPage';
import { AdminShillAlertsPage } from '@/pages/admin/AdminShillAlertsPage';
import { AboutPage } from '@/pages/About';
import { TermsPage } from '@/pages/Terms';
import { PrivacyPage } from '@/pages/Privacy';
import { AntiquesLuxePage } from '@/pages/AntiquesLuxePage';

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/browse', element: <BrowsePage /> },
      { path: '/antiques', element: <AntiquesLuxePage /> },
      { path: '/auctions/:id', element: <AuctionDetailPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/terms', element: <TermsPage /> },
      { path: '/privacy', element: <PrivacyPage /> },
      { path: '/sell', element: <SellPage /> },
      {
        path: '/sell/new',
        element: (
          <ProtectedRoute>
            <CreateAuctionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/watchlist',
        element: (
          <ProtectedRoute>
            <WatchlistPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/me',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/me/wallet',
        element: (
          <ProtectedRoute>
            <WalletPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/me/bank',
        element: (
          <ProtectedRoute>
            <BankAccountPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/me/bids',
        element: (
          <ProtectedRoute>
            <BidHistoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/me/wins',
        element: (
          <ProtectedRoute>
            <WonAuctionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/me/listings',
        element: (
          <ProtectedRoute>
            <SellPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin',
        element: (
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        ),
      },
      {
        path: '/admin/reports',
        element: (
          <AdminRoute>
            <AdminReportsPage />
          </AdminRoute>
        ),
      },
      {
        path: '/admin/disputes',
        element: (
          <AdminRoute>
            <AdminDisputesPage />
          </AdminRoute>
        ),
      },
      {
        path: '/admin/payouts',
        element: (
          <AdminRoute>
            <AdminPayoutsPage />
          </AdminRoute>
        ),
      },
      {
        path: '/admin/shill-alerts',
        element: (
          <AdminRoute>
            <AdminShillAlertsPage />
          </AdminRoute>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
