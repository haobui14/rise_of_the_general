import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import type { TimelineDivergenceResponse } from '@rotg/shared-types';

export function useTimeline(dynastyId: string | null) {
  return useQuery({
    queryKey: ['timeline', dynastyId],
    queryFn: () => fetchApi<TimelineDivergenceResponse>(`/timeline/${dynastyId}`),
    enabled: !!dynastyId,
  });
}
