import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useBattleTemplates, useFight } from '@/hooks/useBattle';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { IBattle, IItem, IPowerBreakdown, IPlayerInjury, ISynergyPair } from '@rotg/shared-types';

const rarityColors: Record<string, string> = {
  common: 'text-gray-300',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
};

function DifficultyStars({ level }: { level: number }) {
  return (
    <span className="text-primary">
      {'★'.repeat(level)}
      {'☆'.repeat(5 - level)}
    </span>
  );
}

interface BattleResult {
  battle: IBattle;
  droppedItem: IItem | null;
  powerBreakdown: IPowerBreakdown;
  newInjury: IPlayerInjury | null;
  moraleChange: number | null;
  activeSynergies: ISynergyPair[];
}

export function BattlePage() {
  const playerId = useAuthStore((s) => s.playerId);
  const { data, isLoading } = useBattleTemplates();
  const fight = useFight();
  const [fighting, setFighting] = useState(false);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFight = async (templateId: string) => {
    if (!playerId) return;

    setFighting(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 800));
      const resolved = await fight.mutateAsync({ playerId, templateId });
      setResult({
        battle: resolved.battle,
        droppedItem: resolved.droppedItem ?? null,
        powerBreakdown: resolved.powerBreakdown,
        newInjury: resolved.newInjury ?? null,
        moraleChange: resolved.moraleChange ?? null,
        activeSynergies: resolved.activeSynergies ?? [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Battle failed');
    } finally {
      setFighting(false);
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading battle templates...</div>;
  }

  const battle = result?.battle;
  const droppedItem = result?.droppedItem;
  const pb = result?.powerBreakdown;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Battle Arena</h2>
        <p className="text-muted-foreground">Choose your battle and prove your worth</p>
      </div>

      {fighting && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-6 text-center">
            <p className="text-lg font-semibold animate-pulse">Battle in progress...</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-center text-destructive text-sm">
            {error}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.templates.map((template) => (
          <Card key={template._id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>
                <DifficultyStars level={template.difficulty} />
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Enemy Power</p>
                  <p className="font-semibold">{template.enemyPower}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Difficulty</p>
                  <p className="font-semibold">{template.difficulty}/5</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Badge variant="secondary">+{template.meritReward} merit</Badge>
                <Badge variant="secondary">+{template.expReward} XP</Badge>
              </div>

              <Button
                className="w-full mt-2"
                onClick={() => handleFight(template._id)}
                disabled={fighting}
              >
                Fight
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Battle Result Dialog */}
      <Dialog open={!!result} onOpenChange={() => setResult(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle
              className={battle?.status === 'won' ? 'text-green-400' : 'text-red-400'}
            >
              {battle?.status === 'won' ? 'Victory!' : 'Defeat'}
            </DialogTitle>
          </DialogHeader>
          {battle && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Merit</p>
                  <p className="text-xl font-bold text-primary">+{battle.result.meritGained}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Experience</p>
                  <p className="text-xl font-bold text-primary">+{battle.result.expGained}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Casualties</p>
                  <p className="text-xl font-bold">{battle.result.casualties}%</p>
                </div>
              </div>

              {/* Power Breakdown */}
              {pb && (
                <div className="border border-border rounded-lg p-3 text-sm space-y-1">
                  <p className="font-semibold mb-2">Power Breakdown</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Power</span>
                    <span>{pb.basePower}</span>
                  </div>
                  {pb.armyBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Army Bonus</span>
                      <span>+{pb.armyBonus}</span>
                    </div>
                  )}
                  {pb.formationMultiplier !== 1 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Formation</span>
                      <span>x{pb.formationMultiplier}</span>
                    </div>
                  )}
                  {pb.generalBonus !== 1 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Generals</span>
                      <span>x{pb.generalBonus}</span>
                    </div>
                  )}
                  {pb.synergyMultiplier !== 1 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Synergy</span>
                      <span>x{pb.synergyMultiplier}</span>
                    </div>
                  )}
                  {pb.legacyBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Legacy</span>
                      <span>+{Math.round(pb.legacyBonus * 100)}%</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t border-border pt-1 mt-1">
                    <span>Final Power</span>
                    <span>{pb.finalPower}</span>
                  </div>
                </div>
              )}

              {/* Active Synergies */}
              {result?.activeSynergies && result.activeSynergies.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {result.activeSynergies.map((s) => (
                    <Badge key={s.name} variant="secondary">
                      {s.name} (+{Math.round((s.bonusMultiplier - 1) * 100)}%)
                    </Badge>
                  ))}
                </div>
              )}

              {/* Morale Change */}
              {result?.moraleChange != null && (
                <p className={`text-sm ${result.moraleChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Morale {result.moraleChange > 0 ? '+' : ''}{result.moraleChange}
                </p>
              )}

              {/* New Injury */}
              {result?.newInjury && (
                <div className="border border-destructive/50 rounded-lg p-3 bg-destructive/5 text-sm">
                  <p className="font-semibold text-destructive">Injury Sustained!</p>
                  <p className="capitalize">{result.newInjury.type.replace('_', ' ')} - {result.newInjury.battlesRemaining} battles remaining</p>
                </div>
              )}

              {droppedItem && (
                <div className="border border-border rounded-lg p-3 text-center bg-secondary/30">
                  <p className="text-xs text-muted-foreground mb-1">Item Looted!</p>
                  <p className={`font-bold ${rarityColors[droppedItem.rarity] || ''}`}>
                    {droppedItem.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {droppedItem.rarity} {droppedItem.type}
                  </p>
                </div>
              )}

              <Button className="w-full" onClick={() => setResult(null)}>
                Continue
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
