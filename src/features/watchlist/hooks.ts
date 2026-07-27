import { useQuery } from '@tanstack/react-query';
import { watchlistApi } from './api';

export const useWatchlist = () =>
  useQuery({
    queryKey: ['watchlist'],
    queryFn: () => watchlistApi.list(),
  });
