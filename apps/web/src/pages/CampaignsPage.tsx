import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCampaigns, usePlayerCampaign, useStartCampaign } from '@/hooks/useCampaigns';
import { useGenerateCampaign } from '@/hooks/useAiContent';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { CampaignDraftResponse } from '@rotg/shared-types';

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-300 border-green-500',
  won: 'bg-yellow-500/20 text-yellow-300 border-yellow-500',
  lost: 'bg-red-500/20 text-red-300 border-red-500',
};

export function CampaignsPage() {
  const playerId = useAuthStore((s) => s.playerId);
  const { data: campaignsData, isLoading: loadingCampaigns } = useCampaigns();
  const { data: activeData } = usePlayerCampaign(playerId);
  const startMutation = useStartCampaign();
  const generateCampaign = useGenerateCampaign();
  const [aiDraft, setAiDraft] = useState<CampaignDraftResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  function handleGenerateCampaign() {
    if (!playerId) return;
    setAiDraft(null);
    setAiError(null);
    generateCampaign.mutate(
      { playerId },
      {
        onSuccess: (data) => setAiDraft(data),
        onError: (err: any) => setAiError(err?.message ?? 'AI generation failed.'),
      },
    );
  }

  if (loadingCampaigns) return <div className="text-muted-foreground">Loading campaigns...</div>;
  if (!campaignsData) return <div className="text-destructive">Failed to load campaigns</div>;

  const active = activeData?.playerCampaign;
  const activeCampaign = activeData?.campaign;

  function handleStart(campaignId: string) {
    if (!playerId) return;
    startMutation.mutate({ playerId, campaignId });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Campaigns</h2>
          <p className="text-muted-foreground">Embark on multi-stage military campaigns</p>
        </div>
        <button
          onClick={handleGenerateCampaign}
          disabled={generateCampaign.isPending}
          className="sm:shrink-0 rounded-md border border-primary/40 px-3 py-2 text-sm text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
        >
          {generateCampaign.isPending ? 'Generating…' : '✨ AI Campaign Idea'}
        </button>
      </div>

      {/* AI Draft */}
      {aiDraft && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-primary">{aiDraft.name}</p>
            <span className="text-xs text-muted-foreground">
              Difficulty {aiDraft.estimatedDifficulty}/5
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{aiDraft.description}</p>
          {aiDraft.suggestedObjectives.length > 0 && (
            <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
              {aiDraft.suggestedObjectives.map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* AI Error */}
      {aiError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {aiError}
        </div>
      )}

      {/* Active Campaign */}
      {active && activeCampaign && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Active Campaign: {activeCampaign.name}
              <Badge className={statusColors[active.status] ?? ''} variant="outline">
                {active.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Territories Captured</p>
                <p className="font-semibold text-lg">{active.territoriesCaptured.length}</p>
                <Progress
                  value={active.territoriesCaptured.length}
                  max={activeCampaign.victoryConditions.territoriesRequired}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {active.territoriesCaptured.length} /{' '}
                  {activeCampaign.victoryConditions.territoriesRequired} required
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Generals Defeated</p>
                <p className="font-semibold text-lg">{active.generalsDefeated}</p>
                <Progress
                  value={active.generalsDefeated}
                  max={activeCampaign.victoryConditions.generalsDefeated}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {active.generalsDefeated} / {activeCampaign.victoryConditions.generalsDefeated}{' '}
                  required
                </p>
              </div>
            </div>

            {/* Captured territories log */}
            {activeData?.progress?.capturedTerritoryNames &&
              activeData.progress.capturedTerritoryNames.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    🏴 Territories Captured
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeData.progress.capturedTerritoryNames.map((name) => (
                      <span
                        key={name}
                        className="rounded-full bg-primary/15 border border-primary/30 px-2.5 py-0.5 text-xs text-primary"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Generals defeated log */}
            {activeData?.progress?.generalsDefeatedLog &&
              activeData.progress.generalsDefeatedLog.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    ⚔️ Generals Defeated
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeData.progress.generalsDefeatedLog.map((name, i) => (
                      <span
                        key={`${name}-${i}`}
                        className="rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-xs text-red-300"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            <p className="text-xs text-muted-foreground">
              Started: {new Date(active.startedAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Campaign List */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Available Campaigns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaignsData.campaigns.map((campaign) => {
            const isActive = active?.campaignId === campaign._id && active.status === 'active';
            return (
              <Card key={campaign._id} className={isActive ? 'border-primary/40' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {campaign.name}
                    {isActive && (
                      <Badge className={statusColors.active} variant="outline">
                        Active
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Territories Needed</p>
                      <p className="font-semibold">
                        {campaign.victoryConditions.territoriesRequired}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Generals to Defeat</p>
                      <p className="font-semibold">{campaign.victoryConditions.generalsDefeated}</p>
                    </div>
                  </div>
                  {!isActive && (
                    <button
                      onClick={() => handleStart(campaign._id)}
                      disabled={startMutation.isPending || !!(active && active.status === 'active')}
                      className="w-full rounded-md bg-primary/90 hover:bg-primary text-primary-foreground text-sm py-1.5 transition-colors disabled:opacity-50"
                    >
                      {startMutation.isPending ? 'Starting…' : 'Start Campaign'}
                    </button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
