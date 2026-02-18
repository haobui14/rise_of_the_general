import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import type { PlayerLegacyResponse, CompleteDynastyResponse } from '@rotg/shared-types';

export function useLegacy(playerId: string | null) {
  return useQuery({
    queryKey: ['legacy', playerId],
    queryFn: () => fetchApi<PlayerLegacyResponse>(`/player/${playerId}/legacy`),
    enabled: !!playerId,
  });
}

export function useCompleteDynasty(playerId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchApi<CompleteDynastyResponse>(`/player/${playerId}/dynasty/complete`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player'] });
      queryClient.invalidateQueries({ queryKey: ['legacy'] });
      queryClient.invalidateQueries({ queryKey: ['army'] });
      queryClient.invalidateQueries({ queryKey: ['injuries'] });
    },
  });
}
