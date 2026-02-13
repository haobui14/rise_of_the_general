import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import type {
  BattleTemplateListResponse,
  StartBattleRequest,
  ResolveBattleResponse,
} from '@rotg/shared-types';

export function useBattleTemplates() {
  return useQuery({
    queryKey: ['battleTemplates'],
    queryFn: () => fetchApi<BattleTemplateListResponse>('/battle/templates'),
  });
}

export function useFight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StartBattleRequest) =>
      fetchApi<ResolveBattleResponse>('/battle/fight', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
