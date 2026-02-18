import { useMutation } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import type {
  CampaignDraftResponse,
  NarrativeResponse,
  OfficerDraftResponse,
  SpawnEnemyGeneralResponse,
  SpawnAllGeneralsResponse,
} from '@rotg/shared-types';

export function useGenerateCampaign() {
  return useMutation({
    mutationFn: (data: { playerId: string; context?: string }) =>
      fetchApi<CampaignDraftResponse>('/ai-content/generate-campaign', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

export function useGenerateNarrative() {
  return useMutation({
    mutationFn: (data: { playerId: string; event: string; context?: string }) =>
      fetchApi<NarrativeResponse>('/ai-content/generate-narrative', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

export function useGenerateOfficer() {
  return useMutation({
    mutationFn: (data: { playerId: string; role?: string }) =>
      fetchApi<OfficerDraftResponse>('/ai-content/generate-officer', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

export function useSpawnEnemyGeneral(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (data: { territoryId: string; faction?: string; level?: number }) =>
      fetchApi<SpawnEnemyGeneralResponse>('/ai-content/spawn-enemy-general', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess,
  });
}

export function useSpawnAllGenerals(onSuccess?: (data: SpawnAllGeneralsResponse) => void) {
  return useMutation({
    mutationFn: () =>
      fetchApi<SpawnAllGeneralsResponse>('/ai-content/spawn-all-generals', {
        method: 'POST',
        body: '{}',
      }),
    onSuccess,
  });
}
