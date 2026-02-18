import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import type { CourtStateResponse, CourtActionResponse } from '@rotg/shared-types';

export function useCourtState(playerId: string | null) {
  return useQuery({
    queryKey: ['court', playerId],
    queryFn: () => fetchApi<CourtStateResponse>(`/politics/${playerId}`),
    enabled: !!playerId,
  });
}

export function useCourtAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { playerId: string; action: string }) =>
      fetchApi<CourtActionResponse>('/politics/action', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['court', vars.playerId] });
      queryClient.invalidateQueries({ queryKey: ['player', vars.playerId] });
    },
  });
}
