import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Heart, Landmark, LogOut, Menu, Plus, User, Wallet, Shield } from 'lucide-react';
import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuthStore } from '@/features/auth/authStore';
import { useNotifications } from '@/features/notifications/hooks';
import { useWallet } from '@/features/wallet/hooks';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';

const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
  cn(
    'text-sm transition-colors',
    isActive ? 'text-ink' : 'text-muted hover:text-ink',
  );

export const Header = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: notifData } = useNotifications(!!user);
  const unread = notifData?.unread ?? 0;
  const { data: walletData } = useWallet(!!user);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur supports-[backdrop-filter]:bg-canvas/70">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-10">
          <Link to="/" className="font-display text-2xl font-semibold tracking-tight text-ink">
            Aurene
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <NavLink to="/browse" className={navLinkClasses}>Browse</NavLink>
            <NavLink to="/sell" className={navLinkClasses}>Sell</NavLink>
            {user && (
              <>
                <NavLink to="/watchlist" className={navLinkClasses}>Watchlist</NavLink>
                <NavLink to="/me/bids" className={navLinkClasses}>My bids</NavLink>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="group relative hidden sm:block">
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  aria-label={`Wallet${walletData ? ` (balance ${formatPrice(walletData.balance, true)})` : ''}`}
                >
                  <Link to="/me/wallet"><Wallet className="h-4 w-4" /></Link>
                </Button>
                <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-max origin-top-right scale-95 rounded-lg border border-line bg-canvas px-4 py-3 opacity-0 shadow-card transition-all duration-150 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100">
                  <p className="kicker">Wallet balance</p>
                  <p className="mt-1 font-display text-lg font-semibold tabular text-ink">
                    {walletData ? formatPrice(walletData.balance, true) : '—'}
                  </p>
                  <Link
                    to="/me/wallet"
                    className="mt-1 block text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
                  >
                    Open wallet
                  </Link>
                </div>
              </div>
              <Button asChild variant="ghost" size="icon" aria-label="Watchlist" className="hidden sm:inline-flex">
                <Link to="/watchlist"><Heart className="h-4 w-4" /></Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
                className="relative hidden sm:inline-flex"
              >
                <Link to="/me">
                  <Bell className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
                  )}
                </Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link to="/sell/new"><Plus className="h-4 w-4" />List item</Link>
              </Button>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-canvas text-sm font-medium text-ink hover:border-ink-200"
                    aria-label="Account"
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="z-50 min-w-[200px] rounded-lg border border-line bg-canvas p-1 shadow-card"
                  >
                    <div className="px-3 py-2 text-xs text-muted">{user.email}</div>
                    <DropdownMenu.Separator className="my-1 h-px bg-line" />
                    <DropdownMenu.Item asChild>
                      <Link to="/me" className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm hover:bg-ink-50">
                        <User className="h-4 w-4" />Profile & activity
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link to="/me/listings" className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm hover:bg-ink-50">
                        <Plus className="h-4 w-4" />My listings
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link to="/me/wallet" className="flex cursor-pointer items-center justify-between gap-2 rounded px-3 py-2 text-sm hover:bg-ink-50">
                        <span className="flex items-center gap-2"><Wallet className="h-4 w-4" />Wallet</span>
                        {walletData && (
                          <span className="tabular text-xs text-muted">{formatPrice(walletData.balance, true)}</span>
                        )}
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link to="/me/bank" className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm hover:bg-ink-50">
                        <Landmark className="h-4 w-4" />Bank account
                      </Link>
                    </DropdownMenu.Item>
                    {user.role === 'ADMIN' && (
                      <>
                        <DropdownMenu.Separator className="my-1 h-px bg-line" />
                        <DropdownMenu.Item asChild>
                          <Link to="/admin" className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-accent hover:bg-ink-50">
                            <Shield className="h-4 w-4" />Admin Panel
                          </Link>
                        </DropdownMenu.Item>
                      </>
                    )}
                    <DropdownMenu.Separator className="my-1 h-px bg-line" />
                    <DropdownMenu.Item
                      className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-danger hover:bg-ink-50"
                      onSelect={async () => { await logout(); navigate('/'); }}
                    >
                      <LogOut className="h-4 w-4" />Sign out
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/signup">Create account</Link>
              </Button>
            </>
          )}

          <button
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded border border-line"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-line">
          <nav className="container flex flex-col gap-3 py-4 text-sm">
            <NavLink to="/browse" onClick={() => setOpen(false)} className={navLinkClasses}>Browse</NavLink>
            <NavLink to="/sell" onClick={() => setOpen(false)} className={navLinkClasses}>Sell</NavLink>
            {user && (
              <>
                <NavLink to="/watchlist" onClick={() => setOpen(false)} className={navLinkClasses}>Watchlist</NavLink>
                <NavLink to="/me/bids" onClick={() => setOpen(false)} className={navLinkClasses}>My bids</NavLink>
                <NavLink to="/me/wins" onClick={() => setOpen(false)} className={navLinkClasses}>Won auctions</NavLink>
                <NavLink to="/me/wallet" onClick={() => setOpen(false)} className={navLinkClasses}>
                  Wallet{walletData ? ` · ${formatPrice(walletData.balance, true)}` : ''}
                </NavLink>
                <NavLink to="/me/bank" onClick={() => setOpen(false)} className={navLinkClasses}>Bank account</NavLink>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
