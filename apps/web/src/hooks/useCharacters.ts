import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import type {
  CharacterListResponse,
  CreateCharacterResponse,
  SetActiveCharacterResponse,
  PromoteToHeirResponse,
} from '@rotg/shared-types';

export function useCharacters(playerId: string | null) {
  return useQuery({
    queryKey: ['characters', playerId],
    queryFn: () => fetchApi<CharacterListResponse>(`/characters/${playerId}`),
    enabled: !!playerId,
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { playerId: string; name: string; role?: string }) =>
      fetchApi<CreateCharacterResponse>(`/characters/${data.playerId}`, {
        method: 'POST',
        body: JSON.stringify({ name: data.name, role: data.role }),
      }),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['characters', vars.playerId] });
    },
  });
}

export function useSetActiveCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { playerId: string; characterId: string }) =>
      fetchApi<SetActiveCharacterResponse>(`/characters/${data.playerId}/active`, {
        method: 'PATCH',
        body: JSON.stringify({ characterId: data.characterId }),
      }),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['characters', vars.playerId] });
      queryClient.invalidateQueries({ queryKey: ['player', vars.playerId] });
    },
  });
}

export function usePromoteToHeir() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { playerId: string; characterId: string }) =>
      fetchApi<PromoteToHeirResponse>(`/characters/${data.playerId}/${data.characterId}/heir`, {
        method: 'PATCH',
      }),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['characters', vars.playerId] });
    },
  });
}
