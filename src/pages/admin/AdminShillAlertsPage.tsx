import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, type ShillAlert } from '@/features/admin/api';
import { AlertTriangle, Shield, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const AdminShillAlertsPage = () => {
  const [alerts, setAlerts] = useState<ShillAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getShillAlerts();
        setAlerts(data.alerts);
      } catch {
        toast.error('Failed to fetch shill alerts');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const critical = alerts.filter((a) => a.severity === 'CRITICAL');
  const warnings = alerts.filter((a) => a.severity === 'WARNING');

  return (
    <div className="container py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-ink" />
          <div>
            <h1 className="display-serif text-display-md font-semibold">Shill Bid Detection</h1>
            <p className="mt-1 text-sm text-muted">
              Auctions where multiple accounts bid from the same IP address
            </p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-lg border border-line p-4">
            <p className="text-xs font-semibold uppercase tracking-kicker text-muted">Total Alerts</p>
            <p className="mt-1 text-2xl font-semibold tabular">{alerts.length}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-kicker text-red-600">Critical</p>
            <p className="mt-1 text-2xl font-semibold tabular text-red-700">{critical.length}</p>
            <p className="text-xs text-red-500 mt-0.5">Seller bidding on own auction</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-kicker text-amber-600">Warnings</p>
            <p className="mt-1 text-2xl font-semibold tabular text-amber-700">{warnings.length}</p>
            <p className="text-xs text-amber-500 mt-0.5">Multiple users from same IP</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-muted">Analyzing bid patterns…</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16">
          <Shield className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-ink">No shill bidding detected</p>
          <p className="text-sm text-muted mt-1">All auctions look clean. No shared IPs between different bidders.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, i) => (
            <div
              key={`${alert.auctionId}-${alert.sharedIp}-${i}`}
              className={`rounded-lg border p-5 ${
                alert.severity === 'CRITICAL'
                  ? 'border-red-300 bg-red-50/50'
                  : 'border-amber-200 bg-amber-50/30'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      alert.severity === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/auctions/${alert.auctionId}`}
                        className="font-medium text-ink hover:text-accent transition-colors underline underline-offset-2"
                      >
                        {alert.auctionTitle}
                      </Link>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      {alert.sellerIsBidder && (
                        <span className="text-xs text-red-600 font-medium">
                          ⚠ Seller is one of the bidders!
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted mt-1">
                      Shared IP: <code className="bg-ink-50 px-1.5 py-0.5 rounded text-[11px] font-mono">{alert.sharedIp}</code>
                      {' · '}{alert.bidCount} bids from this IP
                      {' · '}Status: {alert.auctionStatus}
                    </p>

                    {alert.seller && (
                      <p className="text-xs text-muted mt-1">
                        Seller: <span className="text-ink">{alert.seller.name}</span> ({alert.seller.email})
                      </p>
                    )}

                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-semibold text-ink-500">Bidders from this IP:</p>
                      {alert.bidders.map((bidder) => (
                        <div
                          key={bidder.id}
                          className={`text-xs flex items-center gap-2 ${
                            alert.seller && alert.seller.email === bidder.email
                              ? 'text-red-600 font-semibold'
                              : 'text-ink-600'
                          }`}
                        >
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                          {bidder.name} ({bidder.email})
                          {alert.seller && alert.seller.email === bidder.email && ' ← SELLER'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

