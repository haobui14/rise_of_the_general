import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import type { SuccessionStateResponse, ConfirmSuccessionResponse } from '@rotg/shared-types';

export function useSuccessionState(playerId: string | null) {
  return useQuery({
    queryKey: ['succession', playerId],
    queryFn: () => fetchApi<SuccessionStateResponse>(`/succession/${playerId}`),
    enabled: !!playerId,
  });
}

export function useConfirmSuccession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { playerId: string; successorId: string }) =>
      fetchApi<ConfirmSuccessionResponse>(`/succession/${data.playerId}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ successorId: data.successorId }),
      }),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['succession', vars.playerId] });
      queryClient.invalidateQueries({ queryKey: ['player', vars.playerId] });
      queryClient.invalidateQueries({ queryKey: ['characters', vars.playerId] });
    },
  });
}
