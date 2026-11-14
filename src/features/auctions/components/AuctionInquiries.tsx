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
  'Exact physical dimensions?',
  'Any flaws or unphotographed wear?',
  'Is the original patina intact?',
  'Is documentation or paperwork included?',
  'How will this be packaged for courier dispatch?',
];

interface Props {
  auctionId: string;
  sellerId: string;
  isAntique?: boolean;
}

// ---------------------------------------------------------------------------
// Individual Inquiry Card
// ---------------------------------------------------------------------------

const InquiryCard = ({
  inquiry,
  isSeller,
  auctionId,
  isAntique,
}: {
  inquiry: Inquiry;
  isSeller: boolean;
  auctionId: string;
  isAntique?: boolean;
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
        'rounded-lg border transition-all duration-200 overflow-hidden',
        isAntique
          ? 'border-[#E5E0D8] bg-white shadow-sm'
          : inquiry.isPinned
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
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                isAntique
                  ? 'border border-[#B89C6F]/40 bg-[#0E1622] text-[#E8DCC8]'
                  : 'bg-ink-100 text-ink-500',
              )}
            >
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-medium', isAntique ? 'text-[#0E1622]' : 'text-ink-600')}>
                {sanitize(inquiry.asker.name)}
              </span>
              <span className={cn('text-[10px]', isAntique ? 'text-[#8E8070]' : 'text-muted')}>
                {formatRelative(inquiry.createdAt)}
              </span>
              {inquiry.isPinned && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium',
                    isAntique
                      ? 'border border-[#B89C6F]/40 bg-[#FAF6EE] text-[#7A633F]'
                      : 'bg-ink-100 text-ink-600',
                  )}
                >
                  <Pin className="h-2.5 w-2.5" /> Pinned
                </span>
              )}
            </div>
            <p className={cn('mt-1 text-sm leading-relaxed', isAntique ? 'text-[#131C2A]' : 'text-ink')}>
              {sanitize(inquiry.question)}
            </p>
          </div>

          {/* Seller pin toggle */}
          {isSeller && (
            <button
              onClick={handlePin}
              disabled={pinMut.isPending}
              className="shrink-0 rounded p-1 text-muted transition-colors hover:bg-neutral-100 hover:text-black"
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
        <div
          className={cn(
            'px-4 py-3 border-t',
            isAntique
              ? 'border-[#F0ECE1] bg-[#FAF8F5]'
              : 'border-line/60 bg-ink-50/30',
          )}
        >
          <div className="flex items-start gap-2">
            <CheckCircle2
              className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', isAntique ? 'text-[#B89C6F]' : 'text-emerald-600')}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-[10px] font-semibold uppercase tracking-wider',
                    isAntique ? 'text-[#8E764E]' : 'text-emerald-700',
                  )}
                >
                  Seller Reply
                </span>
                {inquiry.answeredAt && (
                  <span className={cn('text-[10px]', isAntique ? 'text-[#8E8070]' : 'text-muted')}>
                    {formatRelative(inquiry.answeredAt)}
                  </span>
                )}
              </div>
              <p
                className={cn(
                  'mt-1 text-sm leading-relaxed',
                  isAntique ? 'text-[#131C2A]' : 'text-ink-700',
                )}
              >
                {sanitize(inquiry.answer)}
              </p>
              {inquiry.imageUrl && (
                <img
                  src={inquiry.imageUrl}
                  alt="Verification"
                  className="mt-2 max-h-48 rounded border border-[#E5E0D8] object-contain"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </div>
        </div>
      ) : isSeller ? (
        /* Seller answer form */
        <div className={cn('px-4 py-3 border-t', isAntique ? 'border-[#F0ECE1]' : 'border-line/60')}>
          {answerOpen ? (
            <form onSubmit={handleAnswer} className="space-y-2">
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type your response…"
                maxLength={1000}
                rows={2}
                className="w-full rounded border border-[#E0DAD0] bg-white px-3 py-2 text-sm text-[#0E1622] placeholder:text-[#888] focus:border-[#B89C6F] focus:outline-none resize-y"
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
                    className={cn(
                      isAntique && 'bg-[#0E1622] text-[#FBFBF9] hover:bg-[#162335] rounded',
                    )}
                  >
                    {answerMut.isPending ? 'Posting…' : 'Post Reply'}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAnswerOpen(true)}
              className={cn(
                'text-xs font-medium transition-colors',
                isAntique ? 'text-[#B89C6F] hover:underline' : 'text-accent hover:underline',
              )}
            >
              Reply →
            </button>
          )}
        </div>
      ) : (
        /* Unanswered badge for non-sellers */
        <div className={cn('px-4 py-2 border-t', isAntique ? 'border-[#F0ECE1]' : 'border-line/60')}>
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

export const AuctionInquiries = ({ auctionId, sellerId, isAntique }: Props) => {
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
        toast.success('Question submitted');
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
          <MessageCircleQuestion className="h-4 w-4 text-[#8E8070]" />
          <span className={cn(isAntique ? 'font-serif text-lg text-[#0E1622] font-medium' : 'kicker')}>
            {isAntique ? 'Questions for the Seller' : 'Questions & Answers'}{' '}
            {inquiries.length > 0 && (
              <span className="ml-1 text-xs text-muted font-normal">
                ({inquiries.length})
              </span>
            )}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[#8E8070]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#8E8070]" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Ask form (only for non-sellers when logged in) */}
          {user && !isSeller && (
            <div>
              {/* Quick prompts */}
              <div className="mb-3 flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePill(p)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs transition-all duration-150',
                      question === p
                        ? 'border border-[#0E1622] bg-[#0E1622] text-[#FBFBF9]'
                        : 'border border-[#E0DAD0] bg-white text-[#4A5568] hover:border-[#B89C6F]',
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
                  placeholder="Ask the seller a question about this item…"
                  maxLength={500}
                  className="h-10 flex-1 rounded border border-[#E0DAD0] bg-white px-3 text-sm text-[#0E1622] placeholder:text-[#888] focus:border-[#B89C6F] focus:outline-none transition-colors"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!question.trim() || askMut.isPending}
                  className={cn(
                    'shrink-0',
                    isAntique && 'bg-[#0E1622] text-[#FBFBF9] hover:bg-[#162335] rounded',
                  )}
                >
                  <Send className="h-3.5 w-3.5" />
                  {askMut.isPending ? 'Sending…' : 'Ask Question'}
                </Button>
              </form>
              <p className="mt-1.5 text-[10px] text-muted">
                Questions and answers are public for all bidders to see.
              </p>
            </div>
          )}

          {!user && (
            <p className="text-sm text-muted">
              <a href="/login" className="underline font-medium hover:text-black">
                Sign In
              </a>{' '}
              to ask a question about this item.
            </p>
          )}

          {/* Inquiry list */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-lg bg-neutral-100"
                />
              ))}
            </div>
          ) : inquiries.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#E5E0D8] bg-white py-8 text-center">
              <MessageCircleQuestion className="mx-auto h-6 w-6 text-[#8E8070]" />
              <p className="mt-2 text-sm text-muted">
                No questions have been asked about this item yet.
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
                  isAntique={isAntique}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
