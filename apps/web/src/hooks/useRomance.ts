import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import type {
  BrotherhoodListResponse,
  CreateBrotherhoodResponse,
  ChallengeDuelResponse,
  DuelListResponse,
  OmenListResponse,
  ToggleRomanceModeResponse,
} from '@rotg/shared-types';

export function useToggleRomanceMode(playerId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (romanceMode: boolean) =>
      fetchApi<ToggleRomanceModeResponse>(`/player/${playerId}/romance-mode`, {
        method: 'PATCH',
        body: JSON.stringify({ romanceMode }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['player', playerId] }),
  });
}

export function useBrotherhoods(playerId: string | null) {
  return useQuery({
    queryKey: ['brotherhood', playerId],
    enabled: !!playerId,
    queryFn: () => fetchApi<BrotherhoodListResponse>(`/brotherhood/${playerId}`),
  });
}

export function useCreateBrotherhood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { playerId: string; name: string; memberCharacterIds: string[] }) =>
      fetchApi<CreateBrotherhoodResponse>(`/brotherhood/${data.playerId}`, {
        method: 'POST',
        body: JSON.stringify({ name: data.name, memberCharacterIds: data.memberCharacterIds }),
      }),
    onSuccess: (_res, vars) => qc.invalidateQueries({ queryKey: ['brotherhood', vars.playerId] }),
  });
}

export function useDuels(playerId: string | null) {
  return useQuery({
    queryKey: ['duels', playerId],
    enabled: !!playerId,
    queryFn: () => fetchApi<DuelListResponse>(`/duel/player/${playerId}`),
  });
}

export function useChallengeDuel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      playerId: string;
      challengerCharacterId: string;
      opponentName: string;
      opponentStats: { strength: number; defense: number; strategy: number; speed: number; leadership: number };
      trigger: 'insult' | 'ambush' | 'challenge' | 'honor_dispute';
    }) => fetchApi<ChallengeDuelResponse>('/duel/challenge', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_res, vars) => qc.invalidateQueries({ queryKey: ['duels', vars.playerId] }),
  });
}

export function useOmens(dynastyId: string | null) {
  return useQuery({
    queryKey: ['omens', dynastyId],
    enabled: !!dynastyId,
    queryFn: () => fetchApi<OmenListResponse>(`/omens/${dynastyId}`),
  });
}
