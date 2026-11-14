import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { auctionsApi, inquiriesApi, type AuctionListQuery, type CreateAuctionInput } from './api';

export const auctionKeys = {
  all: ['auctions'] as const,
  list: (query: AuctionListQuery) => ['auctions', 'list', query] as const,
  detail: (id: string) => ['auctions', 'detail', id] as const,
  myListings: () => ['auctions', 'me', 'listings'] as const,
  earnings: () => ['auctions', 'me', 'earnings'] as const,
  myBids: () => ['auctions', 'me', 'bids'] as const,
  myWins: () => ['auctions', 'me', 'wins'] as const,
  bids: (id: string) => ['auctions', id, 'bids'] as const,
  inquiries: (auctionId: string) => ['inquiries', auctionId] as const,
};

export const useAuctions = (query: AuctionListQuery) =>
  useQuery({
    queryKey: auctionKeys.list(query),
    queryFn: () => auctionsApi.list(query),
    placeholderData: (prev) => prev,
  });

export const useAuction = (id: string) =>
  useQuery({
    queryKey: auctionKeys.detail(id),
    queryFn: () => auctionsApi.detail(id),
    enabled: !!id,
  });

export const useAuctionBids = (id: string) =>
  useQuery({
    queryKey: auctionKeys.bids(id),
    queryFn: () => auctionsApi.bids(id),
    enabled: !!id,
  });

export const useMyListings = () =>
  useQuery({
    queryKey: auctionKeys.myListings(),
    queryFn: () => auctionsApi.myListings(),
  });

export const useMyBids = () =>
  useQuery({
    queryKey: auctionKeys.myBids(),
    queryFn: () => auctionsApi.myBids(),
  });

export const useMyWins = () =>
  useQuery({
    queryKey: auctionKeys.myWins(),
    queryFn: () => auctionsApi.myWins(),
  });

export const useEarnings = () =>
  useQuery({
    queryKey: auctionKeys.earnings(),
    queryFn: () => auctionsApi.earnings(),
  });

export const useCreateAuction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAuctionInput) => auctionsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: auctionKeys.all });
    },
  });
};

export const usePlaceBid = (auctionId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amount: string) => auctionsApi.placeBid(auctionId, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: auctionKeys.detail(auctionId) });
      qc.invalidateQueries({ queryKey: auctionKeys.bids(auctionId) });
      qc.invalidateQueries({ queryKey: auctionKeys.myBids() });
    },
  });
};

export const useEndAuctionNow = (auctionId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => auctionsApi.endNow(auctionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: auctionKeys.detail(auctionId) });
      qc.invalidateQueries({ queryKey: auctionKeys.all });
    },
  });
};

export const useCancelAuction = (auctionId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => auctionsApi.cancel(auctionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: auctionKeys.detail(auctionId) });
      qc.invalidateQueries({ queryKey: auctionKeys.all });
    },
  });
};

export const useBuyNow = (auctionId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => auctionsApi.buyNow(auctionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: auctionKeys.detail(auctionId) });
      qc.invalidateQueries({ queryKey: auctionKeys.all });
      qc.invalidateQueries({ queryKey: auctionKeys.myBids() });
      qc.invalidateQueries({ queryKey: auctionKeys.myWins() });
    },
  });
};

export const useWatchToggle = (auctionId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (watch: boolean) =>
      watch ? auctionsApi.watch(auctionId) : auctionsApi.unwatch(auctionId),
    onSuccess: (_data, watch) => {
      qc.invalidateQueries({ queryKey: auctionKeys.detail(auctionId) });
      qc.invalidateQueries({ queryKey: ['watchlist'] });
      if (watch) {
        toast.success('Added to your Watchlist');
      } else {
        toast.info('Removed from your Watchlist');
      }
    },
    onError: () => {
      toast.error('Could not update watchlist. Please try again.');
    },
  });
};

export const useReportAuction = (auctionId: string) => {
  return useMutation({
    mutationFn: (input: { reason: string; details: string }) => 
      auctionsApi.report(auctionId, input.reason, input.details),
  });
};

// ---------------------------------------------------------------------------
// Auction Q&A / Inquiries
// ---------------------------------------------------------------------------

export const useInquiries = (auctionId: string) =>
  useQuery({
    queryKey: auctionKeys.inquiries(auctionId),
    queryFn: () => inquiriesApi.list(auctionId),
    enabled: !!auctionId,
  });

export const useAskQuestion = (auctionId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (question: string) => inquiriesApi.ask(auctionId, question),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: auctionKeys.inquiries(auctionId) });
    },
  });
};

export const useAnswerQuestion = (auctionId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { inquiryId: string; answer: string; imageUrl?: string }) =>
      inquiriesApi.answer(input.inquiryId, input.answer, input.imageUrl),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: auctionKeys.inquiries(auctionId) });
    },
  });
};

export const usePinInquiry = (auctionId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inquiryId: string) => inquiriesApi.pin(inquiryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: auctionKeys.inquiries(auctionId) });
    },
  });
};
