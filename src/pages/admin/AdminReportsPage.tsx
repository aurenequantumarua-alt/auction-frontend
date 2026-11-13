import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/features/admin/api';
import { sanitize } from '@/lib/sanitize';
import { Filter, Check, X, Search } from 'lucide-react';
import { toast } from 'sonner';


type ReportStatus = 'ALL' | 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'ACTION_TAKEN';

const STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'DISMISSED', label: 'Dismissed' },
  { value: 'ACTION_TAKEN', label: 'Action Taken' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  REVIEWED: 'bg-blue-50 text-blue-700 border-blue-200',
  DISMISSED: 'bg-gray-100 text-gray-500 border-gray-200',
  ACTION_TAKEN: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const REASON_LABELS: Record<string, string> = {
  FRAUD: 'Fraudulent listing',
  COUNTERFEIT: 'Counterfeit item',
  MISLEADING_DESCRIPTION: 'Misleading description',
  WRONG_IMAGES: 'Images don\'t match',
  PROHIBITED_ITEM: 'Prohibited item',
  OTHER: 'Other',
};

export const AdminReportsPage = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReportStatus>('ALL');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getReports(filter);
      setReports(data);
    } catch (error) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const updated = await adminApi.updateReport(id, { status: newStatus });
      setReports(reports.map(r => r.id === id ? updated : r));
      toast.success('Report status updated');
    } catch (err) {
      toast.error('Failed to update report status');
    }
  };

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="kicker">Administration</p>
          <h1 className="display-serif mt-2 text-display-md font-semibold">User Reports</h1>
          <p className="mt-1 text-sm text-muted">
            Manage flagged listings and user reports.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/admin"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink-50"
          >
            Back to Auctions
          </Link>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted" />
        {STATUS_OPTIONS.map((opt) => {
          const isActive = filter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`
                inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium
                transition-all duration-200
                ${isActive
                  ? 'bg-ink text-canvas border-ink shadow-sm'
                  : 'bg-canvas text-muted border-line hover:border-ink/30 hover:text-ink'}
              `}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted">Loading reports…</div>
      ) : (
        <div className="grid gap-4">
          {reports.length === 0 ? (
            <div className="rounded-lg border border-line bg-canvas p-12 text-center text-muted">
              No reports found for the selected status.
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="rounded-lg border border-line bg-canvas p-5">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_COLORS[report.status]}`}>
                        {report.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-medium text-ink">
                        {REASON_LABELS[report.reason] || report.reason}
                      </span>
                      <span className="text-xs text-muted">
                        • {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(report.createdAt))}
                      </span>
                    </div>
                    
                    <p className="text-sm text-ink-600 border-l-2 border-line pl-3 italic">
                      "{sanitize(report.details)}"
                    </p>
                    
                    <div className="text-xs text-muted flex items-center gap-4">
                      <span>Reported by: <span className="font-medium text-ink">{sanitize(report.reporter.name)}</span> ({report.reporter.email})</span>
                    </div>
                  </div>
                  
                  {/* Right auction card */}
                  <div className="w-full md:w-80 rounded border border-line bg-ink-50/50 p-4 shrink-0">
                    <p className="kicker mb-2">Reported Auction</p>
                    <Link to={`/auctions/${report.auction.id}`} className="block group">
                      <h4 className="font-medium text-sm text-ink group-hover:text-accent group-hover:underline underline-offset-2 line-clamp-1">
                        {sanitize(report.auction.title)}
                      </h4>
                      <p className="text-xs text-muted mt-1 font-mono">{report.auction.id}</p>
                    </Link>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <span className="px-1.5 py-0.5 rounded bg-ink/10 font-medium">
                        {report.auction.status}
                      </span>
                      <span className="text-muted">Seller: {sanitize(report.auction.seller.name)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Actions footer */}
                <div className="mt-5 pt-4 border-t border-line flex flex-wrap gap-2 justify-end">
                  {report.status !== 'DISMISSED' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'DISMISSED')}
                      className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-ink-50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Dismiss
                    </button>
                  )}
                  {report.status !== 'ACTION_TAKEN' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'ACTION_TAKEN')}
                      className="inline-flex items-center gap-1.5 rounded-md border border-transparent bg-emerald-100 text-emerald-700 px-3 py-1.5 text-xs font-medium hover:bg-emerald-200 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Mark Action Taken
                    </button>
                  )}
                  {report.status !== 'REVIEWED' && report.status === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'REVIEWED')}
                      className="inline-flex items-center gap-1.5 rounded-md border border-transparent bg-ink text-canvas px-3 py-1.5 text-xs font-medium hover:bg-ink/90 transition-colors"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Mark as Reviewed
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
