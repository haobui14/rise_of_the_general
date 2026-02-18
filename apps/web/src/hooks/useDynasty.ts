import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import type {
  DynastyStateResponse,
  StrategicActionRequest,
  StrategicActionResponse,
} from '@rotg/shared-types';

export function useDynastyState() {
  return useQuery({
    queryKey: ['dynastyState'],
    queryFn: () => fetchApi<DynastyStateResponse>('/dynasty-state'),
    staleTime: 30_000,
  });
}

export function useStrategicAction(actionType: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StrategicActionRequest) =>
      fetchApi<StrategicActionResponse>(`/strategy/${actionType}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player'] });
      queryClient.invalidateQueries({ queryKey: ['dynastyState'] });
      queryClient.invalidateQueries({ queryKey: ['world'] });
    },
  });
}
