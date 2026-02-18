import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import type { PlayerArmyResponse } from '@rotg/shared-types';

export function useArmy(playerId: string | null) {
  return useQuery({
    queryKey: ['army', playerId],
    queryFn: () => fetchApi<PlayerArmyResponse>(`/player/${playerId}/army`),
    enabled: !!playerId,
  });
}

export function useCreateArmy(playerId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (troopType: string) =>
      fetchApi<PlayerArmyResponse>(`/player/${playerId}/army`, {
        method: 'POST',
        body: JSON.stringify({ troopType }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['army'] });
    },
  });
}

export function useRecruitTroops(playerId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (count: number) =>
      fetchApi(`/player/${playerId}/army/recruit`, {
        method: 'PATCH',
        body: JSON.stringify({ count }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['army'] });
      queryClient.invalidateQueries({ queryKey: ['player'] });
    },
  });
}

export function useChangeFormation(playerId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formation: string) =>
      fetchApi(`/player/${playerId}/army/formation`, {
        method: 'PATCH',
        body: JSON.stringify({ formation }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['army'] });
    },
  });
}

export function useChangeTroopType(playerId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (troopType: string) =>
      fetchApi(`/player/${playerId}/army/troop-type`, {
        method: 'PATCH',
        body: JSON.stringify({ troopType }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['army'] });
    },
  });
}
