import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/features/auth/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (socket) return socket;
  socket = io(SOCKET_URL, {
    autoConnect: true,
    withCredentials: true,
    transports: ['websocket', 'polling'],
    auth: () => ({ token: useAuthStore.getState().accessToken ?? null }),
  });
  return socket;
};

export const refreshSocketAuth = (): void => {
  if (!socket) return;
  socket.disconnect();
  socket.connect();
};

export const SOCKET_EVENTS = {
  bidPlaced: 'bid:placed',
  auctionStatusChanged: 'auction:status-changed',
  auctionExtended: 'auction:extended',
  notificationNew: 'notification:new',
} as const;
