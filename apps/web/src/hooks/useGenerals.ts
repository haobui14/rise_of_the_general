import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import type {
  GeneralsListResponse,
  RecruitGeneralResponse,
  ActiveGeneralsResponse,
  SynergyListResponse,
  ActiveSynergiesResponse,
} from '@rotg/shared-types';

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

export function useActiveGenerals(playerId: string | null) {
  return useQuery({
    queryKey: ['activeGenerals', playerId],
    queryFn: () => fetchApi<ActiveGeneralsResponse>(`/player/${playerId}/generals/active`),
    enabled: !!playerId,
  });
}

export function useDeployGeneral(playerId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (generalId: string) =>
      fetchApi(`/player/${playerId}/generals/deploy`, {
        method: 'POST',
        body: JSON.stringify({ generalId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeGenerals'] });
      queryClient.invalidateQueries({ queryKey: ['activeSynergies'] });
    },
  });
}

export function useWithdrawGeneral(playerId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (generalId: string) =>
      fetchApi(`/player/${playerId}/generals/withdraw`, {
        method: 'POST',
        body: JSON.stringify({ generalId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeGenerals'] });
      queryClient.invalidateQueries({ queryKey: ['activeSynergies'] });
    },
  });
}

export function useSynergies() {
  return useQuery({
    queryKey: ['synergies'],
    queryFn: () => fetchApi<SynergyListResponse>('/synergies'),
  });
}

export function useActiveSynergies(playerId: string | null) {
  return useQuery({
    queryKey: ['activeSynergies', playerId],
    queryFn: () => fetchApi<ActiveSynergiesResponse>(`/player/${playerId}/synergies/active`),
    enabled: !!playerId,
  });
}
