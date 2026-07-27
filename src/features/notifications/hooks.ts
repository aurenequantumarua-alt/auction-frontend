import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from './api';

export const useNotifications = (enabled = true) =>
  useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
    enabled,
    refetchInterval: 60_000,
  });

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};
