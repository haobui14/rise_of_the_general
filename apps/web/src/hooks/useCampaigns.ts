import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import type {
  CampaignListResponse,
  CreateCampaignRequest,
  CreateCampaignResponse,
  StartCampaignRequest,
  StartCampaignResponse,
  PlayerCampaignResponse,
} from '@rotg/shared-types';

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: () => fetchApi<CampaignListResponse>('/campaigns'),
  });
}

export function usePlayerCampaign(playerId: string | null) {
  return useQuery({
    queryKey: ['playerCampaign', playerId],
    queryFn: async () => {
      try {
        return await fetchApi<PlayerCampaignResponse>(`/campaigns/${playerId}/active`);
      } catch (err: any) {
        // 404 means no active campaign — treat as null, not an error
        if (err?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!playerId,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCampaignRequest) =>
      fetchApi<CreateCampaignResponse>('/campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useStartCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StartCampaignRequest) =>
      fetchApi<StartCampaignResponse>('/campaigns/start', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerCampaign'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}
