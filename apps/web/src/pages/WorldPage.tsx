import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useWorldMap, useAttackTerritory } from '@/hooks/useWorld';
import { usePlayerCampaign } from '@/hooks/useCampaigns';
import { useSpawnAllGenerals } from '@/hooks/useAiContent';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQueryClient } from '@tanstack/react-query';
import type { ITerritory, TerritoryGeneralSummary } from '@rotg/shared-types';

const regionColors: Record<string, string> = {
  north: 'bg-blue-500/20 text-blue-300 border-blue-500',
  central: 'bg-yellow-500/20 text-yellow-300 border-yellow-500',
  south: 'bg-green-500/20 text-green-300 border-green-500',
};

type AttackOutcome = {
  outcome: string;
  meritBonus: number;
  exhaustionChange: number;
  leadershipGained: number;
  territoryId: string;
  generalDefeated: string | null;
};

export function WorldPage() {
  const playerId = useAuthStore((s) => s.playerId);
  const { data, isLoading } = useWorldMap();
  const queryClient = useQueryClient();
  const attackMutation = useAttackTerritory();
  const { data: activeCampaign, isLoading: campaignLoading } = usePlayerCampaign(playerId);
  const [lastResult, setLastResult] = useState<AttackOutcome | null>(null);
  const [attackingId, setAttackingId] = useState<string | null>(null);
  const [spawnSummary, setSpawnSummary] = useState<string | null>(null);
  const [spawnError, setSpawnError] = useState<string | null>(null);

  const spawnAll = useSpawnAllGenerals((res) => {
    queryClient.invalidateQueries({ queryKey: ['worldMap'] });
    setSpawnSummary(
      `✨ ${res.spawned} general${res.spawned !== 1 ? 's' : ''} spawned across the realm (${res.skipped} territories already had one).`,
    );
  });

  if (isLoading) return <div className="text-muted-foreground">Loading world map...</div>;
  if (!data) return <div className="text-destructive">Failed to load world map</div>;

  const { territories, generalsByTerritory } = data;
  const byRegion: Record<string, ITerritory[]> = { north: [], central: [], south: [] };
  for (const t of territories) {
    (byRegion[t.region] ??= []).push(t);
  }

  function handleAttack(territoryId: string) {
    if (!playerId) return;
    setAttackingId(territoryId);
    setLastResult(null);
    attackMutation.mutate(
      { playerId, territoryId },
      {
        onSuccess: (res) => {
          setLastResult({
            outcome: res.outcome,
            meritBonus: res.meritBonus,
            leadershipGained: res.leadershipGained ?? 0,
            exhaustionChange: res.exhaustionChange,
            territoryId,
            generalDefeated: res.enemyGeneralDefeated
              ? (res.enemyGeneralDefeated as any).name
              : null,
          });
          setAttackingId(null);
        },
        onError: () => setAttackingId(null),
      },
    );
  }

  function handleSpawnAll() {
    setSpawnError(null);
    setSpawnSummary(null);
    spawnAll.mutate(undefined, {
      onError: (err: any) => setSpawnError(err?.message ?? 'Failed to spawn generals.'),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">World Map</h2>
          <p className="text-muted-foreground">
            Conquer territories to earn merit and advance your campaigns. Defeating enemy generals
            inside a territory counts toward campaign victory conditions.
          </p>
        </div>
        <button
          onClick={handleSpawnAll}
          disabled={spawnAll.isPending}
          className="sm:shrink-0 rounded-md border border-orange-500/40 px-3 py-2 text-sm text-orange-300 hover:bg-orange-500/10 transition-colors disabled:opacity-40"
        >
          {spawnAll.isPending ? 'Spawning generals…' : '✨ AI Spawn All Generals'}
        </button>
      </div>

      {/* How-to banner */}
      <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">How territory capture works</p>
        <p>
          ⚔️ <strong>Attack</strong> any territory not owned by your faction.
        </p>
        <p>
          🏆 <strong>Win</strong> → you capture it, earn merit, and the defense rating drops by 40%.
        </p>
        <p>
          💀 <strong>Enemy generals</strong> inside a territory make it harder — defeating one
          counts toward your active campaign.
        </p>
        <p>
          😴 <strong>Exhaustion</strong> rises with each fight. Use <em>Rest</em> on the Dynasty
          page to recover.
        </p>
      </div>

      {/* Campaign status banner */}
      {!campaignLoading && !activeCampaign && (
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
          ⚠️ <strong>No active campaign.</strong> Conquering territories won't count toward any
          campaign goals.{' '}
          <Link to="/campaigns" className="underline font-medium hover:text-yellow-100">
            Go to Campaigns to start one →
          </Link>
        </div>
      )}
      {!campaignLoading && activeCampaign && (
        <div className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
          📋 Active campaign: <strong>{activeCampaign.campaign?.name}</strong> — territories left:{' '}
          <strong>{activeCampaign.progress?.territoriesRemaining}</strong>, generals left:{' '}
          <strong>{activeCampaign.progress?.generalsRemaining}</strong>
        </div>
      )}

      {/* Last attack result */}
      {lastResult && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm space-y-0.5 ${
            lastResult.outcome === 'won'
              ? 'border-green-500/40 bg-green-500/10 text-green-300'
              : 'border-red-500/40 bg-red-500/10 text-red-300'
          }`}
        >
          <p className="font-semibold">
            {lastResult.outcome === 'won'
              ? '⚔️ Victory! Territory captured.'
              : '🛡 Defeated! The enemy held the line.'}
          </p>
          <p className="text-xs">
            Merit +{lastResult.meritBonus} &nbsp;|&nbsp; Leadership +{lastResult.leadershipGained}{' '}
            &nbsp;|&nbsp; Exhaustion {lastResult.exhaustionChange >= 0 ? '+' : ''}
            {lastResult.exhaustionChange}
            {lastResult.generalDefeated && (
              <>
                {' '}
                &nbsp;|&nbsp; General <strong>{lastResult.generalDefeated}</strong> defeated!
              </>
            )}
          </p>
        </div>
      )}

      {/* Spawn summary */}
      {spawnSummary && (
        <div className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-3 text-sm text-orange-300">
          {spawnSummary}
        </div>
      )}

      {/* Spawn error */}
      {spawnError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {spawnError}
        </div>
      )}

      {(['north', 'central', 'south'] as const).map((region) => (
        <div key={region}>
          <h3 className="text-lg font-semibold capitalize mb-3">{region} Region</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {byRegion[region].map((territory) => {
              const generals: TerritoryGeneralSummary[] = generalsByTerritory[territory._id] ?? [];
              const hasGenerals = generals.length > 0;
              return (
                <Card key={territory._id} className={hasGenerals ? 'border-orange-500/40' : ''}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span className="flex items-center gap-1.5">
                        {hasGenerals && <span title="Enemy general present">⚔️</span>}
                        {territory.name}
                      </span>
                      <Badge className={regionColors[territory.region] ?? ''} variant="outline">
                        {territory.region}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Strategic Value</p>
                        <p className="font-semibold">{territory.strategicValue}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Defense Rating</p>
                        <p className="font-semibold">{territory.defenseRating}</p>
                      </div>
                    </div>

                    {/* Enemy generals list */}
                    {hasGenerals && (
                      <div className="rounded-md bg-orange-500/10 border border-orange-500/30 px-3 py-2 space-y-1">
                        <p className="text-xs font-medium text-orange-300">Enemy Generals</p>
                        {generals.map((g) => (
                          <div
                            key={g.name}
                            className="flex justify-between text-xs text-orange-200"
                          >
                            <span>{g.name.replace(' (enemy)', '')}</span>
                            <span>
                              Lv.{g.level} · ×{g.powerMultiplier.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Defense</p>
                      <Progress value={territory.defenseRating} max={100} />
                    </div>

                    <button
                      onClick={() => handleAttack(territory._id)}
                      disabled={attackMutation.isPending && attackingId === territory._id}
                      className="w-full rounded-md bg-primary/90 hover:bg-primary text-primary-foreground text-sm py-1.5 transition-colors disabled:opacity-50"
                    >
                      {attackMutation.isPending && attackingId === territory._id
                        ? 'Attacking…'
                        : 'Attack'}
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
