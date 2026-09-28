import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, SOCKET_EVENTS } from '@/lib/socket';
import { auctionKeys } from '@/features/auctions/hooks';

/**
 * Bridges Socket.IO events into TanStack Query cache invalidations.
 * Mounts once at app boot inside Providers.
 */
export const useRealtimeBridge = () => {
  const qc = useQueryClient();

  useEffect(() => {
    const s = getSocket();

    const onBidPlaced = (e: { auctionId: string }) => {
      qc.invalidateQueries({ queryKey: auctionKeys.detail(e.auctionId) });
      qc.invalidateQueries({ queryKey: auctionKeys.bids(e.auctionId) });
    };
    const onStatusChanged = (e: { auctionId: string }) => {
      qc.invalidateQueries({ queryKey: auctionKeys.detail(e.auctionId) });
      qc.invalidateQueries({ queryKey: auctionKeys.all });
    };
    const onExtended = (e: { auctionId: string }) => {
      qc.invalidateQueries({ queryKey: auctionKeys.detail(e.auctionId) });
    };
    const onNotification = () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    };
    const onInquiry = (e: { auctionId: string }) => {
      qc.invalidateQueries({ queryKey: ['inquiries', e.auctionId] });
    };

    s.on(SOCKET_EVENTS.bidPlaced, onBidPlaced);
    s.on(SOCKET_EVENTS.auctionStatusChanged, onStatusChanged);
    s.on(SOCKET_EVENTS.auctionExtended, onExtended);
    s.on(SOCKET_EVENTS.notificationNew, onNotification);
    s.on(SOCKET_EVENTS.inquiryNew, onInquiry);
    s.on(SOCKET_EVENTS.inquiryAnswered, onInquiry);

    return () => {
      s.off(SOCKET_EVENTS.bidPlaced, onBidPlaced);
      s.off(SOCKET_EVENTS.auctionStatusChanged, onStatusChanged);
      s.off(SOCKET_EVENTS.auctionExtended, onExtended);
      s.off(SOCKET_EVENTS.notificationNew, onNotification);
      s.off(SOCKET_EVENTS.inquiryNew, onInquiry);
      s.off(SOCKET_EVENTS.inquiryAnswered, onInquiry);
    };
  }, [qc]);
};

/**
 * Subscribe to a specific auction room for the lifetime of the calling component.
 * Use on the auction detail page so we only get events for the auction being viewed.
 */
export const useAuctionSubscription = (auctionId: string | undefined) => {
  useEffect(() => {
    if (!auctionId) return;
    const s = getSocket();
    s.emit('auction:subscribe', auctionId);
    return () => {
      s.emit('auction:unsubscribe', auctionId);
    };
  }, [auctionId]);
};
