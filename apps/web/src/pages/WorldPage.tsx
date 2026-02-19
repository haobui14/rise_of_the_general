import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useWorldMap, useAttackTerritory } from '@/hooks/useWorld';
import { usePlayerCampaign } from '@/hooks/useCampaigns';
import { usePlayer } from '@/hooks/usePlayer';
import { useSpawnAllGenerals } from '@/hooks/useAiContent';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { WorldMapCanvas } from '@/components/canvas/WorldMapCanvas';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import type { ITerritory, TerritoryGeneralSummary } from '@rotg/shared-types';

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
  const { data: playerData } = usePlayer(playerId);
  const { data, isLoading } = useWorldMap();
  const queryClient = useQueryClient();
  const attackMutation = useAttackTerritory();
  const { data: activeCampaign, isLoading: campaignLoading } = usePlayerCampaign(playerId);
  const [lastResult, setLastResult] = useState<AttackOutcome | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<ITerritory | null>(null);
  const [spawnSummary, setSpawnSummary] = useState<string | null>(null);
  const [spawnError, setSpawnError] = useState<string | null>(null);

  const spawnAll = useSpawnAllGenerals((res) => {
    queryClient.invalidateQueries({ queryKey: ['world'] });
    setSpawnSummary(
      `${res.spawned} general${res.spawned !== 1 ? 's' : ''} spawned across the realm (${res.skipped} territories already had one).`,
    );
  });

  if (isLoading) return <div className="text-muted-foreground p-8">Loading world map...</div>;
  if (!data) return <div className="text-destructive p-8">Failed to load world map</div>;

  const { territories, generalsByTerritory } = data;

  function handleAttack(territoryId: string) {
    if (!playerId) return;
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
        },
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

  const selectedGenerals: TerritoryGeneralSummary[] = selectedTerritory
    ? (generalsByTerritory[selectedTerritory._id] ?? [])
    : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display">World Map</h2>
          <p className="text-sm text-muted-foreground">
            Click a territory to view details and attack
          </p>
        </div>
        <button
          onClick={handleSpawnAll}
          disabled={spawnAll.isPending}
          className="sm:shrink-0 rounded-md border border-orange-500/40 px-3 py-2 text-sm text-orange-300 hover:bg-orange-500/10 transition-colors disabled:opacity-40"
        >
          {spawnAll.isPending ? 'Spawning...' : 'AI Spawn Generals'}
        </button>
      </div>

      {/* Campaign banner */}
      {!campaignLoading && !activeCampaign && (
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-2.5 text-sm text-yellow-300">
          No active campaign.{' '}
          <Link to="/campaigns" className="underline font-medium hover:text-yellow-100">
            Start one →
          </Link>
        </div>
      )}
      {!campaignLoading && activeCampaign && (
        <div className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm text-primary">
          Active: <strong>{activeCampaign.campaign?.name}</strong> — {activeCampaign.progress?.territoriesRemaining} territories, {activeCampaign.progress?.generalsRemaining} generals remaining
        </div>
      )}

      {/* Notifications */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-lg border px-4 py-3 text-sm ${
              lastResult.outcome === 'won'
                ? 'border-green-500/40 bg-green-500/10 text-green-300'
                : 'border-red-500/40 bg-red-500/10 text-red-300'
            }`}
          >
            <p className="font-semibold">
              {lastResult.outcome === 'won' ? 'Victory! Territory captured.' : 'Defeated! The enemy held.'}
            </p>
            <p className="text-xs mt-0.5">
              Merit +{lastResult.meritBonus} | Leadership +{lastResult.leadershipGained} | Exhaustion {lastResult.exhaustionChange >= 0 ? '+' : ''}{lastResult.exhaustionChange}
              {lastResult.generalDefeated && <> | <strong>{lastResult.generalDefeated}</strong> defeated!</>}
            </p>
          </motion.div>
        )}
        {spawnSummary && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-2.5 text-sm text-orange-300">
            {spawnSummary}
          </motion.div>
        )}
        {spawnError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {spawnError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map + Detail Panel */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Canvas Map */}
        <div className="flex-1 min-w-0">
          <WorldMapCanvas
            territories={territories}
            generalsByTerritory={generalsByTerritory}
            playerFactionId={playerData?.player?.factionId}
            onTerritoryClick={setSelectedTerritory}
          />
        </div>

        {/* Territory Detail Panel */}
        <AnimatePresence mode="wait">
          {selectedTerritory && (
            <motion.div
              key={selectedTerritory._id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="lg:w-72 shrink-0"
            >
              <Card className="border-border/60 sticky top-4">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-lg">{selectedTerritory.name}</h3>
                    <Badge variant="outline" className="capitalize text-xs">
                      {selectedTerritory.region}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Strategic Value</p>
                      <p className="font-bold text-lg text-primary">{selectedTerritory.strategicValue}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Defense Rating</p>
                      <p className="font-bold text-lg">{selectedTerritory.defenseRating}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Defense</p>
                    <Progress value={selectedTerritory.defenseRating} max={50} />
                  </div>

                  {/* Enemy generals */}
                  {selectedGenerals.length > 0 && (
                    <div className="rounded-md bg-orange-500/10 border border-orange-500/30 px-3 py-2 space-y-1">
                      <p className="text-xs font-semibold text-orange-300">Enemy Generals</p>
                      {selectedGenerals.map((g) => (
                        <div key={g.name} className="flex justify-between text-xs text-orange-200">
                          <span>{g.name.replace(' (enemy)', '')}</span>
                          <span>Lv.{g.level} x{g.powerMultiplier.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={() => handleAttack(selectedTerritory._id)}
                    disabled={attackMutation.isPending}
                  >
                    {attackMutation.isPending ? 'Attacking...' : 'Attack Territory'}
                  </Button>

                  <button
                    onClick={() => setSelectedTerritory(null)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    Close
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
