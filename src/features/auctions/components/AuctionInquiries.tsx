import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  MessageCircleQuestion,
  Pin,
  PinOff,
  Send,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { sanitize } from '@/lib/sanitize';
import { formatRelative } from '@/lib/format';
import { extractApiError } from '@/lib/api';
import { useAuthStore } from '@/features/auth/authStore';
import {
  useInquiries,
  useAskQuestion,
  useAnswerQuestion,
  usePinInquiry,
} from '../hooks';
import type { Inquiry } from '../api';

/** Quick-prompt pills for common buyer questions. */
const QUICK_PROMPTS = [
  'What are the exact measurements?',
  'Any flaws not shown in photos?',
  'What is the fabric composition?',
  'Is the price negotiable?',
  'How will this be shipped?',
];

interface Props {
  auctionId: string;
  sellerId: string;
}

// ---------------------------------------------------------------------------
// Individual Inquiry Card
// ---------------------------------------------------------------------------

const InquiryCard = ({
  inquiry,
  isSeller,
  auctionId,
}: {
  inquiry: Inquiry;
  isSeller: boolean;
  auctionId: string;
}) => {
  const [answerOpen, setAnswerOpen] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const answerMut = useAnswerQuestion(auctionId);
  const pinMut = usePinInquiry(auctionId);

  const handleAnswer = (e: FormEvent) => {
    e.preventDefault();
    if (!answerText.trim()) return;
    answerMut.mutate(
      { inquiryId: inquiry.id, answer: answerText.trim() },
      {
        onSuccess: () => {
          toast.success('Answer posted');
          setAnswerOpen(false);
          setAnswerText('');
        },
        onError: (err) => toast.error(extractApiError(err).message),
      },
    );
  };

  const handlePin = () => {
    pinMut.mutate(inquiry.id, {
      onError: (err) => toast.error(extractApiError(err).message),
    });
  };

  const initials = inquiry.asker.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        'rounded-lg border transition-all duration-200',
        inquiry.isPinned
          ? 'border-ink-200 bg-ink-50/40'
          : 'border-line bg-canvas',
      )}
    >
      {/* Question */}
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          {inquiry.asker.avatarUrl ? (
            <img
              src={inquiry.asker.avatarUrl}
              alt={sanitize(inquiry.asker.name)}
              className="h-7 w-7 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[10px] font-semibold text-ink-500">
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ink-600">
                {sanitize(inquiry.asker.name)}
              </span>
              <span className="text-[10px] text-muted">
                {formatRelative(inquiry.createdAt)}
              </span>
              {inquiry.isPinned && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-600">
                  <Pin className="h-2.5 w-2.5" /> Pinned
                </span>
              )}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-ink">
              {sanitize(inquiry.question)}
            </p>
          </div>

          {/* Seller pin toggle */}
          {isSeller && (
            <button
              onClick={handlePin}
              disabled={pinMut.isPending}
              className="shrink-0 rounded p-1 text-muted transition-colors hover:bg-ink-50 hover:text-ink"
              title={inquiry.isPinned ? 'Unpin' : 'Pin to top'}
            >
              {inquiry.isPinned ? (
                <PinOff className="h-3.5 w-3.5" />
              ) : (
                <Pin className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Answer */}
      {inquiry.answer ? (
        <div className="border-t border-line/60 bg-ink-50/30 px-4 py-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                  Seller Reply
                </span>
                {inquiry.answeredAt && (
                  <span className="text-[10px] text-muted">
                    {formatRelative(inquiry.answeredAt)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-ink-700">
                {sanitize(inquiry.answer)}
              </p>
              {inquiry.imageUrl && (
                <img
                  src={inquiry.imageUrl}
                  alt="Verification"
                  className="mt-2 max-h-48 rounded border border-line object-contain"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </div>
        </div>
      ) : isSeller ? (
        /* Seller answer form */
        <div className="border-t border-line/60 px-4 py-3">
          {answerOpen ? (
            <form onSubmit={handleAnswer} className="space-y-2">
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type your answer…"
                maxLength={1000}
                rows={2}
                className={cn(
                  'w-full rounded border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-300',
                  'border-line focus:border-ink focus:outline-none resize-y',
                )}
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted">
                  {answerText.length}/1000
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAnswerOpen(false);
                      setAnswerText('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!answerText.trim() || answerMut.isPending}
                  >
                    {answerMut.isPending ? 'Posting…' : 'Post answer'}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAnswerOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-ink-500 transition-colors hover:text-ink"
            >
              <Send className="h-3 w-3" /> Reply to this question
            </button>
          )}
        </div>
      ) : (
        /* Unanswered badge for non-sellers */
        <div className="border-t border-line/60 px-4 py-2">
          <span className="inline-flex items-center gap-1 text-[10px] text-muted">
            <Clock className="h-3 w-3" /> Awaiting seller reply
          </span>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const AuctionInquiries = ({ auctionId, sellerId }: Props) => {
  const user = useAuthStore((s) => s.user);
  const isSeller = user?.id === sellerId;
  const { data, isLoading } = useInquiries(auctionId);
  const askMut = useAskQuestion(auctionId);

  const [question, setQuestion] = useState('');
  const [expanded, setExpanded] = useState(true);

  const inquiries = data?.items ?? [];

  const handleAsk = (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    askMut.mutate(question.trim(), {
      onSuccess: () => {
        toast.success('Question posted');
        setQuestion('');
      },
      onError: (err) => toast.error(extractApiError(err).message),
    });
  };

  const handlePill = (prompt: string) => {
    if (!user) {
      toast.error('Log in to ask a question');
      return;
    }
    setQuestion(prompt);
  };

  return (
    <section className="mt-12" id="qa-section">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <MessageCircleQuestion className="h-4 w-4 text-muted" />
          <span className="kicker">
            Questions{' '}
            {inquiries.length > 0 && (
              <span className="ml-1 text-muted">({inquiries.length})</span>
            )}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Ask form (only for non-sellers when logged in) */}
          {user && !isSeller && (
            <div>
              {/* Quick prompts */}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePill(p)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-[11px] transition-all duration-150',
                      question === p
                        ? 'border-ink bg-ink text-canvas'
                        : 'border-line bg-canvas text-muted hover:border-ink-200 hover:text-ink',
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAsk} className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask the seller a question…"
                  maxLength={500}
                  className={cn(
                    'h-10 flex-1 rounded border bg-canvas px-3 text-sm text-ink placeholder:text-ink-300',
                    'border-line hover:border-ink-200 focus:border-ink focus:outline-none transition-colors',
                  )}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!question.trim() || askMut.isPending}
                  className="shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                  {askMut.isPending ? 'Sending…' : 'Ask'}
                </Button>
              </form>
              <p className="mt-1.5 text-[10px] text-muted">
                Questions are public. Do not share personal contact information.
              </p>
            </div>
          )}

          {!user && (
            <p className="text-sm text-muted">
              <a href="/login" className="underline hover:text-ink">
                Log in
              </a>{' '}
              to ask the seller a question.
            </p>
          )}

          {/* Inquiry list */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-lg bg-ink-50"
                />
              ))}
            </div>
          ) : inquiries.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line py-8 text-center">
              <MessageCircleQuestion className="mx-auto h-6 w-6 text-ink-200" />
              <p className="mt-2 text-sm text-muted">
                No questions yet. Be the first to ask!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inq) => (
                <InquiryCard
                  key={inq.id}
                  inquiry={inq}
                  isSeller={isSeller}
                  auctionId={auctionId}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
