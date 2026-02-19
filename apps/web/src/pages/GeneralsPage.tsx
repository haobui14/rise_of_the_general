import { useAuthStore } from '@/stores/authStore';
import {
  useGenerals,
  useRecruitGeneral,
  useActiveGenerals,
  useDeployGeneral,
  useWithdrawGeneral,
  useActiveSynergies,
} from '@/hooks/useGenerals';
import { usePlayer } from '@/hooks/usePlayer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GeneralPortrait } from '@/components/canvas/GeneralPortrait';
import { motion } from 'framer-motion';

const rarityColors: Record<string, string> = {
  uncommon: 'border-green-500/50 bg-green-500/5',
  rare: 'border-blue-500/60 bg-blue-500/5 shadow-[0_0_10px_rgba(59,130,246,0.1)]',
  legendary: 'border-yellow-500/70 bg-yellow-500/5 shadow-[0_0_16px_rgba(234,179,8,0.15)]',
};

const rarityBadge: Record<string, string> = {
  uncommon: 'bg-green-500/20 text-green-300 border-green-500',
  rare: 'bg-blue-500/20 text-blue-300 border-blue-500',
  legendary: 'bg-yellow-500/20 text-yellow-300 border-yellow-500',
};

export function GeneralsPage() {
  const playerId = useAuthStore((s) => s.playerId);
  const { data: playerData } = usePlayer(playerId);
  const { data, isLoading } = useGenerals(playerId);
  const recruit = useRecruitGeneral();
  const { data: activeData } = useActiveGenerals(playerId);
  const deploy = useDeployGeneral(playerId);
  const withdraw = useWithdrawGeneral(playerId);
  const { data: synergyData } = useActiveSynergies(playerId);

  if (isLoading) {
    return <div className="text-muted-foreground animate-pulse">Summoning the officer corps…</div>;
  }

  const generals = data?.generals ?? [];
  const playerTier = playerData?.rank?.tier ?? 1;
  const maxSlots = activeData?.maxSlots ?? 0;
  const currentSlots = activeData?.currentSlots ?? 0;
  const activeGeneralIds = new Set(
    (activeData?.activeGenerals ?? []).map((g: any) => g._id),
  );

  const recruited = generals.filter((g) => g.recruited);
  const available = generals.filter((g) => !g.recruited);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display">Generals</h2>
        <p className="text-muted-foreground">
          Build relationships and recruit famous officers to your cause
        </p>
      </div>

      {/* Active Slots */}
      {maxSlots > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between font-display">
              Active General Slots
              <Badge variant="default">{currentSlots} / {maxSlots}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeData?.activeGenerals && activeData.activeGenerals.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {(activeData.activeGenerals as any[]).map((g: any) => (
                  <Badge key={g._id} variant="secondary" className="text-sm py-1">
                    {g.name}
                    <button
                      className="ml-2 text-xs opacity-70 hover:opacity-100"
                      onClick={() => withdraw.mutate(g._id)}
                    >
                      x
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No generals deployed. Deploy recruited generals below.</p>
            )}

            {/* Active Synergies */}
            {synergyData && synergyData.activeSynergies && synergyData.activeSynergies.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {synergyData.activeSynergies.map((s: any) => (
                  <Badge key={s.name} className="bg-yellow-500/20 text-yellow-300 border-yellow-500">
                    {s.name} (+{Math.round((s.bonusMultiplier - 1) * 100)}%)
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recruited generals */}
      {recruited.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold font-display mb-3">Under Your Command ({recruited.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recruited.map((g) => {
              const isDeployed = activeGeneralIds.has(g._id);
              return (
                <motion.div key={g._id} whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
                  <Card className={`${rarityColors[g.rarity]} border-2 h-full`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-3">
                        <GeneralPortrait name={g.name} rarity={g.rarity as any} size="sm" />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base flex items-center justify-between font-display">
                            {g.name}
                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${rarityBadge[g.rarity]}`}>
                              {g.rarity}
                            </span>
                          </CardTitle>
                          <p className="text-xs text-muted-foreground italic">{g.title}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-5 gap-1 text-xs text-center">
                        {Object.entries(g.stats).map(([stat, val]) => (
                          <div key={stat}>
                            <p className="text-muted-foreground capitalize">{stat.slice(0, 3)}</p>
                            <p className="font-bold">{val}</p>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground text-center">
                        Battle power bonus: +{Math.round((g.battleBonus.powerMultiplier - 1) * 100)}%
                      </div>
                      {isDeployed ? (
                        <Button variant="outline" size="sm" className="w-full" onClick={() => withdraw.mutate(g._id)} disabled={withdraw.isPending}>Withdraw</Button>
                      ) : (
                        <Button size="sm" className="w-full" onClick={() => deploy.mutate(g._id)} disabled={deploy.isPending || currentSlots >= maxSlots}>
                          {currentSlots >= maxSlots ? 'Slots Full' : 'Deploy'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available generals */}
      <div>
        <h3 className="text-lg font-semibold font-display mb-3">All Generals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {available.map((g) => {
            const rankLocked = playerTier < g.requiredRankTier;
            const relProgress = Math.min(100, (g.relationship / g.requiredRelationship) * 100);

            return (
              <motion.div key={g._id} whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
                <Card className={`${rankLocked ? 'opacity-60' : ''} ${rarityColors[g.rarity]} border h-full`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <GeneralPortrait name={g.name} rarity={g.rarity as any} size="sm" />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base flex items-center justify-between font-display">
                          {g.name}
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${rarityBadge[g.rarity]}`}>
                            {g.rarity}
                          </span>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground italic">{g.title}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-5 gap-1 text-xs text-center">
                      {Object.entries(g.stats).map(([stat, val]) => (
                        <div key={stat}>
                          <p className="text-muted-foreground capitalize">{stat.slice(0, 3)}</p>
                          <p className="font-bold">{val}</p>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      Battle power bonus: +{Math.round((g.battleBonus.powerMultiplier - 1) * 100)}%
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Relationship</span>
                        <span className="font-mono">{g.relationship} / {g.requiredRelationship}</span>
                      </div>
                      <Progress value={relProgress} />
                    </div>
                    <div className="text-xs">
                      <p className={rankLocked ? 'text-destructive' : 'text-green-400'}>
                        {rankLocked ? `Requires tier ${g.requiredRankTier} (you: ${playerTier})` : '✓ Rank requirement met'}
                      </p>
                    </div>
                    <Button className="w-full" size="sm" disabled={!g.canRecruit || recruit.isPending} onClick={() => recruit.mutate(g._id)}>
                      {g.canRecruit ? `Recruit ${g.name}` : 'Cannot Recruit'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
