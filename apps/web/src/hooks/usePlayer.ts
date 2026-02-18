import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import type {
  AuthResponse,
  PlayerResponse,
  PromotePlayerResponse,
  RegisterRequest,
  RankListResponse,
  InventoryResponse,
  EquipItemResponse,
} from '@rotg/shared-types';

export function usePlayer(playerId: string | null) {
  return useQuery({
    queryKey: ['player', playerId],
    queryFn: () => fetchApi<PlayerResponse>(`/player/${playerId}`),
    enabled: !!playerId,
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) =>
      fetchApi<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (data: { username: string }) =>
      fetchApi<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  });
}

export function usePromotePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playerId: string) =>
      fetchApi<PromotePlayerResponse>(`/player/${playerId}/promote`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player'] });
    },
  });
}

export function useRanks() {
  return useQuery({
    queryKey: ['ranks'],
    queryFn: () => fetchApi<RankListResponse>('/ranks'),
  });
}

export function useInventory(playerId: string | null) {
  return useQuery({
    queryKey: ['inventory', playerId],
    queryFn: () => fetchApi<InventoryResponse>(`/player/${playerId}/inventory`),
    enabled: !!playerId,
  });
}

export function useEquipItem(playerId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      fetchApi<EquipItemResponse>(`/player/${playerId}/inventory/equip`, {
        method: 'POST',
        body: JSON.stringify({ itemId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useUnequipItem(playerId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      fetchApi<EquipItemResponse>(`/player/${playerId}/inventory/unequip`, {
        method: 'POST',
        body: JSON.stringify({ itemId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
