import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import type { GeneralsListResponse, RecruitGeneralResponse } from '@rotg/shared-types';

export function useGenerals(playerId: string | null) {
  return useQuery({
    queryKey: ['generals', playerId],
    queryFn: () => fetchApi<GeneralsListResponse>(`/generals/${playerId}`),
    enabled: !!playerId,
  });
}

export function useRecruitGeneral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (generalId: string) =>
      fetchApi<RecruitGeneralResponse>(`/generals/${generalId}/recruit`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generals'] });
    },
  });
}
