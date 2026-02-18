import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import type { PlayerInjuriesResponse } from '@rotg/shared-types';

export function useInjuries(playerId: string | null) {
  return useQuery({
    queryKey: ['injuries', playerId],
    queryFn: () => fetchApi<PlayerInjuriesResponse>(`/player/${playerId}/injuries`),
    enabled: !!playerId,
  });
}
