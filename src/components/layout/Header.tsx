import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Bell, Heart, Landmark, LogOut, Menu, Plus, User, Wallet, Shield } from 'lucide-react';
import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuthStore } from '@/features/auth/authStore';
import { useNotifications } from '@/features/notifications/hooks';
import { useWallet } from '@/features/wallet/hooks';
import { useThemeStore } from '@/features/theme/themeStore';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';

export const Header = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const isAntiqueMode = useThemeStore((s) => s.isAntiqueMode);
  const isAntiquesRoute = isAntiqueMode || location.pathname.startsWith('/antiques');
  const [open, setOpen] = useState(false);
  const { data: notifData } = useNotifications(!!user);
  const unread = notifData?.unread ?? 0;
  const { data: walletData } = useWallet(!!user);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 transition-colors duration-200 backdrop-blur',
        isAntiquesRoute
          ? 'border-b border-[#B89C6F]/30 bg-[#0E1622]/95 text-[#FBFBF9]'
          : 'border-b border-line bg-canvas/85 supports-[backdrop-filter]:bg-canvas/70 text-ink',
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className={cn(
              'font-display text-2xl font-semibold tracking-tight',
              isAntiquesRoute ? 'text-[#FBFBF9]' : 'text-ink',
            )}
          >
            Aurene
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <NavLink
              to="/browse"
              className={({ isActive }) =>
                cn(
                  'text-sm transition-colors',
                  isAntiquesRoute
                    ? isActive
                      ? 'text-[#FBFBF9] font-medium'
                      : 'text-[#C4B7A5] hover:text-[#FFFFFF]'
                    : isActive
                      ? 'text-ink font-medium'
                      : 'text-muted hover:text-ink',
                )
              }
            >
              Explore Auctions
            </NavLink>
            <NavLink
              to="/antiques"
              className={({ isActive }) =>
                cn(
                  'text-xs tracking-wider uppercase transition-all px-3 py-1 rounded border font-semibold',
                  isAntiquesRoute
                    ? isActive
                      ? 'border-[#B89C6F] bg-[#162132] text-[#FBFBF9] shadow-sm'
                      : 'border-[#B89C6F]/40 bg-[#162132]/70 text-[#E8DCC8] hover:border-[#B89C6F] hover:text-[#FFFFFF]'
                    : isActive
                      ? 'border-[#B89C6F] bg-[#0E1622] text-[#FBFBF9] shadow-sm'
                      : 'border-[#B89C6F]/60 bg-[#F4EFE6] text-[#5C4522] hover:bg-[#EDE3D2] hover:text-[#0E1622] hover:border-[#B89C6F]',
                )
              }
            >
              Antiques
            </NavLink>
            <NavLink
              to="/sell"
              className={({ isActive }) =>
                cn(
                  'text-sm transition-colors',
                  isAntiquesRoute
                    ? isActive
                      ? 'text-[#FBFBF9] font-medium'
                      : 'text-[#C4B7A5] hover:text-[#FFFFFF]'
                    : isActive
                      ? 'text-ink font-medium'
                      : 'text-muted hover:text-ink',
                )
              }
            >
              Sell
            </NavLink>
            {user && (
              <>
                <NavLink
                  to="/watchlist"
                  className={({ isActive }) =>
                    cn(
                      'text-sm transition-colors',
                      isAntiquesRoute
                        ? isActive
                          ? 'text-[#FBFBF9] font-medium'
                          : 'text-[#C4B7A5] hover:text-[#FFFFFF]'
                        : isActive
                          ? 'text-ink font-medium'
                          : 'text-muted hover:text-ink',
                    )
                  }
                >
                  Watchlist
                </NavLink>
                <NavLink
                  to="/me/bids"
                  className={({ isActive }) =>
                    cn(
                      'text-sm transition-colors',
                      isAntiquesRoute
                        ? isActive
                          ? 'text-[#FBFBF9] font-medium'
                          : 'text-[#C4B7A5] hover:text-[#FFFFFF]'
                        : isActive
                          ? 'text-ink font-medium'
                          : 'text-muted hover:text-ink',
                    )
                  }
                >
                  My bids
                </NavLink>
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
                  className={cn(isAntiquesRoute && 'text-[#C4B7A5] hover:text-[#FFFFFF] hover:bg-[#162132]')}
                  aria-label={`Wallet${walletData ? ` (balance ${formatPrice(walletData.balance, true)})` : ''}`}
                >
                  <Link to="/me/wallet"><Wallet className="h-4 w-4" /></Link>
                </Button>
                <div
                  className={cn(
                    'pointer-events-none absolute right-0 top-full z-50 mt-2 w-max origin-top-right scale-95 rounded-lg border px-4 py-3 opacity-0 shadow-card transition-all duration-150 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100',
                    isAntiquesRoute
                      ? 'border-[#B89C6F]/30 bg-[#0E1622] text-[#FBFBF9]'
                      : 'border-line bg-canvas text-ink',
                  )}
                >
                  <p className={cn('text-xs uppercase tracking-wider', isAntiquesRoute ? 'text-[#B89C6F]' : 'kicker')}>
                    Wallet balance
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold tabular">
                    {walletData ? formatPrice(walletData.balance, true) : '—'}
                  </p>
                  <Link
                    to="/me/wallet"
                    className={cn(
                      'mt-1 block text-xs underline-offset-2 hover:underline',
                      isAntiquesRoute ? 'text-[#C4B7A5] hover:text-white' : 'text-muted hover:text-ink',
                    )}
                  >
                    Open wallet
                  </Link>
                </div>
              </div>
              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label="Watchlist"
                className={cn('hidden sm:inline-flex', isAntiquesRoute && 'text-[#C4B7A5] hover:text-[#FFFFFF] hover:bg-[#162132]')}
              >
                <Link to="/watchlist"><Heart className="h-4 w-4" /></Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
                className={cn('relative hidden sm:inline-flex', isAntiquesRoute && 'text-[#C4B7A5] hover:text-[#FFFFFF] hover:bg-[#162132]')}
              >
                <Link to="/me">
                  <Bell className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
                  )}
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className={cn(
                  'hidden sm:inline-flex',
                  isAntiquesRoute
                    ? 'border-0 bg-[#B89C6F] text-[#0E1622] hover:bg-[#C9B085] font-semibold text-xs rounded shadow-sm'
                    : '',
                )}
              >
                <Link to="/sell/new"><Plus className="h-4 w-4" />Sell an Item</Link>
              </Button>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-colors',
                      isAntiquesRoute
                        ? 'border-[#B89C6F]/40 bg-[#162132] text-[#E8DCC8] hover:border-[#B89C6F]'
                        : 'border-line bg-canvas text-ink hover:border-ink-200',
                    )}
                    aria-label="Account"
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className={cn(
                      'z-50 min-w-[200px] rounded-lg border p-1 shadow-card',
                      isAntiquesRoute
                        ? 'border-[#B89C6F]/30 bg-[#0E1622] text-[#FBFBF9]'
                        : 'border-line bg-canvas text-ink',
                    )}
                  >
                    <div className={cn('px-3 py-2 text-xs', isAntiquesRoute ? 'text-[#C4B7A5]' : 'text-muted')}>
                      {user.email}
                    </div>
                    <DropdownMenu.Separator className={cn('my-1 h-px', isAntiquesRoute ? 'bg-[#1E2B3E]' : 'bg-line')} />
                    <DropdownMenu.Item asChild>
                      <Link
                        to="/me"
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm',
                          isAntiquesRoute ? 'hover:bg-[#162335] text-[#E8DCC8]' : 'hover:bg-ink-50',
                        )}
                      >
                        <User className="h-4 w-4" />Profile & activity
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        to="/me/wins"
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm',
                          isAntiquesRoute ? 'hover:bg-[#162335] text-[#E8DCC8]' : 'hover:bg-ink-50',
                        )}
                      >
                        <Shield className="h-4 w-4" />Won Auctions
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        to="/me/listings"
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm',
                          isAntiquesRoute ? 'hover:bg-[#162335] text-[#E8DCC8]' : 'hover:bg-ink-50',
                        )}
                      >
                        <Plus className="h-4 w-4" />My Listings
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        to="/me/wallet"
                        className={cn(
                          'flex cursor-pointer items-center justify-between gap-2 rounded px-3 py-2 text-sm',
                          isAntiquesRoute ? 'hover:bg-[#162132] text-[#E8DCC8]' : 'hover:bg-ink-50',
                        )}
                      >
                        <span className="flex items-center gap-2"><Wallet className="h-4 w-4" />Wallet</span>
                        {walletData && (
                          <span className={cn('tabular text-xs', isAntiquesRoute ? 'text-[#C4B7A5]' : 'text-muted')}>
                            {formatPrice(walletData.balance, true)}
                          </span>
                        )}
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        to="/me/bank"
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm',
                          isAntiquesRoute ? 'hover:bg-[#162132] text-[#E8DCC8]' : 'hover:bg-ink-50',
                        )}
                      >
                        <Landmark className="h-4 w-4" />Bank account
                      </Link>
                    </DropdownMenu.Item>
                    {user.role === 'ADMIN' && (
                      <>
                        <DropdownMenu.Separator className={cn('my-1 h-px', isAntiquesRoute ? 'bg-[#1E2B3E]' : 'bg-line')} />
                        <DropdownMenu.Item asChild>
                          <Link
                            to="/admin"
                            className={cn(
                              'flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-accent',
                              isAntiquesRoute ? 'hover:bg-[#162132]' : 'hover:bg-ink-50',
                            )}
                          >
                            <Shield className="h-4 w-4" />Admin Panel
                          </Link>
                        </DropdownMenu.Item>
                      </>
                    )}
                    <DropdownMenu.Separator className={cn('my-1 h-px', isAntiquesRoute ? 'bg-[#1E2B3E]' : 'bg-line')} />
                    <DropdownMenu.Item
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-danger',
                        isAntiquesRoute ? 'hover:bg-[#162132]' : 'hover:bg-ink-50',
                      )}
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
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={cn(isAntiquesRoute && 'text-[#C4B7A5] hover:text-[#FFFFFF] hover:bg-[#162132]')}
              >
                <Link to="/login">Sign In</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className={cn(
                  isAntiquesRoute
                    ? 'border-0 bg-[#B89C6F] text-[#0E1622] hover:bg-[#C9B085] font-semibold text-xs rounded'
                    : '',
                )}
              >
                <Link to="/signup">Join Auréne</Link>
              </Button>
            </>
          )}

          <button
            className={cn(
              'md:hidden inline-flex h-9 w-9 items-center justify-center rounded border transition-colors',
              isAntiquesRoute
                ? 'border-[#B89C6F]/40 text-[#FBFBF9] bg-[#162132]'
                : 'border-line text-ink',
            )}
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open && (
        <div className={cn('md:hidden border-t', isAntiquesRoute ? 'border-[#B89C6F]/30 bg-[#0E1622]' : 'border-line bg-canvas')}>
          <nav className="container flex flex-col gap-3 py-4 text-sm">
            <NavLink
              to="/browse"
              onClick={() => setOpen(false)}
              className={isAntiquesRoute ? 'text-[#C4B7A5] hover:text-white' : 'text-muted hover:text-ink'}
            >
              Explore Auctions
            </NavLink>
            <NavLink
              to="/antiques"
              onClick={() => setOpen(false)}
              className={isAntiquesRoute ? 'text-[#D4BC94] font-medium' : 'text-accent font-medium'}
            >
              Antiques
            </NavLink>
            <NavLink
              to="/sell"
              onClick={() => setOpen(false)}
              className={isAntiquesRoute ? 'text-[#C4B7A5] hover:text-white' : 'text-muted hover:text-ink'}
            >
              Sell
            </NavLink>
            {user && (
              <>
                <NavLink
                  to="/watchlist"
                  onClick={() => setOpen(false)}
                  className={isAntiquesRoute ? 'text-[#C4B7A5] hover:text-white' : 'text-muted hover:text-ink'}
                >
                  Watchlist
                </NavLink>
                <NavLink
                  to="/me/bids"
                  onClick={() => setOpen(false)}
                  className={isAntiquesRoute ? 'text-[#C4B7A5] hover:text-white' : 'text-muted hover:text-ink'}
                >
                  My Bids
                </NavLink>
                <NavLink
                  to="/me/wins"
                  onClick={() => setOpen(false)}
                  className={isAntiquesRoute ? 'text-[#C4B7A5] hover:text-white' : 'text-muted hover:text-ink'}
                >
                  Won Auctions
                </NavLink>
                <NavLink
                  to="/me/wallet"
                  onClick={() => setOpen(false)}
                  className={isAntiquesRoute ? 'text-[#C4B7A5] hover:text-white' : 'text-muted hover:text-ink'}
                >
                  Wallet{walletData ? ` · ${formatPrice(walletData.balance, true)}` : ''}
                </NavLink>
                <NavLink
                  to="/me/bank"
                  onClick={() => setOpen(false)}
                  className={isAntiquesRoute ? 'text-[#C4B7A5] hover:text-white' : 'text-muted hover:text-ink'}
                >
                  Bank account
                </NavLink>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
