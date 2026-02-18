import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import type {
  WorldMapResponse,
  TerritoryResponse,
  AttackTerritoryRequest,
  AttackTerritoryResponse,
} from '@rotg/shared-types';

export function useWorldMap() {
  return useQuery({
    queryKey: ['world'],
    queryFn: () => fetchApi<WorldMapResponse>('/world/map'),
  });
}

export function useTerritory(territoryId: string | null) {
  return useQuery({
    queryKey: ['territory', territoryId],
    queryFn: () => fetchApi<TerritoryResponse>(`/world/territory/${territoryId}`),
    enabled: !!territoryId,
  });
}

export function useAttackTerritory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AttackTerritoryRequest) =>
      fetchApi<AttackTerritoryResponse>('/world/attack', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['world'] });
      queryClient.invalidateQueries({ queryKey: ['player'] });
      queryClient.invalidateQueries({ queryKey: ['playerCampaign'] });
    },
  });
}
