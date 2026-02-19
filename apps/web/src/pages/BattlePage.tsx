import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useBattleTemplates, useFight } from '@/hooks/useBattle';
import { useGenerateNarrative } from '@/hooks/useAiContent';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BattleScene } from '@/components/canvas/BattleScene';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  IBattle,
  IItem,
  IPowerBreakdown,
  IPlayerInjury,
  ISynergyPair,
} from '@rotg/shared-types';

const difficultyConfig: Record<number, { border: string; glow: string; bg: string; label: string; labelColor: string }> = {
  1: { border: 'border-slate-500/50', glow: '', bg: 'bg-slate-500/5', label: 'Skirmish', labelColor: 'text-slate-400' },
  2: { border: 'border-green-500/50', glow: '', bg: 'bg-green-500/5', label: 'Raid', labelColor: 'text-green-400' },
  3: { border: 'border-blue-500/50', glow: '', bg: 'bg-blue-500/5', label: 'Conflict', labelColor: 'text-blue-400' },
  4: { border: 'border-purple-500/50', glow: 'shadow-[0_0_12px_rgba(168,85,247,0.15)]', bg: 'bg-purple-500/5', label: 'Siege', labelColor: 'text-purple-400' },
  5: { border: 'border-amber-500/50', glow: 'shadow-[0_0_18px_rgba(245,158,11,0.2)]', bg: 'bg-amber-500/5', label: 'Grand', labelColor: 'text-amber-400' },
};

const rarityGlow: Record<string, string> = {
  common: '',
  rare: 'shadow-[0_0_8px_rgba(59,130,246,0.3)]',
  epic: 'shadow-[0_0_12px_rgba(168,85,247,0.4)]',
};

const rarityColors: Record<string, string> = {
  common: 'text-slate-300',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
};

function DifficultyStars({ level }: { level: number }) {
  return (
    <span className="text-primary tracking-widest">
      {'★'.repeat(level)}
      <span className="opacity-20">{'★'.repeat(5 - level)}</span>
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
  const generateNarrative = useGenerateNarrative();
  const [fighting, setFighting] = useState(false);
  const [fightingTemplateId, setFightingTemplateId] = useState<string | null>(null);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [showScene, setShowScene] = useState(false);
  const [sceneData, setSceneData] = useState<{ playerPower: number; enemyPower: number; outcome: 'won' | 'lost' } | null>(null);

  const handleFight = async (templateId: string, enemyPower: number) => {
    if (!playerId) return;
    setFighting(true);
    setFightingTemplateId(templateId);
    setError(null);
    try {
      const resolved = await fight.mutateAsync({ playerId, templateId });
      const pb = resolved.powerBreakdown;
      setSceneData({ playerPower: pb.finalPower, enemyPower, outcome: resolved.battle.status === 'won' ? 'won' : 'lost' });
      setShowScene(true);
      setNarrative(null);
      setResult({
        battle: resolved.battle,
        droppedItem: resolved.droppedItem ?? null,
        powerBreakdown: pb,
        newInjury: resolved.newInjury ?? null,
        moraleChange: resolved.moraleChange ?? null,
        activeSynergies: resolved.activeSynergies ?? [],
      });
      generateNarrative.mutate(
        {
          playerId,
          event: resolved.battle.status === 'won' ? 'battle_victory' : 'battle_defeat',
          context: `casualty rate ${resolved.battle.result.casualties}%, merit gained ${resolved.battle.result.meritGained}`,
        },
        { onSuccess: (d) => setNarrative(d.text) },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Battle failed');
    } finally {
      setFighting(false);
      setFightingTemplateId(null);
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground animate-pulse">Preparing the battlefield…</div>;
  }

  const battle = result?.battle;
  const droppedItem = result?.droppedItem;
  const pb = result?.powerBreakdown;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display">Battle Arena</h2>
        <p className="text-muted-foreground text-sm">Choose your battle and prove your worth</p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.templates.map((template) => {
          const cfg = difficultyConfig[template.difficulty] ?? difficultyConfig[1];
          const isThisOne = fightingTemplateId === template._id;
          return (
            <motion.div key={template._id} whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
              <Card className={`flex flex-col border-2 transition-all ${cfg.border} ${cfg.bg} ${cfg.glow}`}>
                <div className="p-4 pb-0 flex items-start justify-between">
                  <div>
                    <p className="font-display font-bold text-base">{template.name}</p>
                    <p className={`text-xs font-medium mt-0.5 ${cfg.labelColor}`}>{cfg.label}</p>
                  </div>
                  <DifficultyStars level={template.difficulty} />
                </div>
                <CardContent className="flex-1 pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md bg-muted/50 px-2 py-1.5">
                      <p className="text-muted-foreground text-xs">Enemy Power</p>
                      <p className="font-bold text-destructive">{template.enemyPower}</p>
                    </div>
                    <div className="rounded-md bg-muted/50 px-2 py-1.5">
                      <p className="text-muted-foreground text-xs">Difficulty</p>
                      <p className="font-bold">{template.difficulty}/5</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <Badge className="text-xs bg-amber-500/15 text-amber-300 border-amber-500/30">+{template.meritReward} merit</Badge>
                    <Badge className="text-xs bg-blue-500/15 text-blue-300 border-blue-500/30">+{template.expReward} XP</Badge>
                  </div>
                  <Button className="w-full" onClick={() => handleFight(template._id, template.enemyPower)} disabled={fighting}
                    variant={template.difficulty >= 4 ? 'default' : 'outline'}>
                    {isThisOne ? <span className="animate-pulse">Locked in Battle…</span> : fighting ? 'Occupied…' : 'Fight'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Battle Scene overlay */}
      <AnimatePresence>
        {showScene && sceneData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              <BattleScene playerPower={sceneData.playerPower} enemyPower={sceneData.enemyPower}
                outcome={sceneData.outcome} onComplete={() => setShowScene(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Battle Result Dialog */}
      <Dialog
        open={!!result && !showScene}
        onOpenChange={() => { setResult(null); setNarrative(null); }}
      >
        <DialogContent className="max-w-md border-border/60">
          <DialogHeader>
            <DialogTitle className={`font-display text-xl ${battle?.status === 'won' ? 'text-green-400' : 'text-red-400'}`}>
              {battle?.status === 'won' ? '⚔️ Victory!' : '💀 Defeat'}
            </DialogTitle>
          </DialogHeader>
          {battle && (
            <div className="space-y-4 pt-1">
              <div className={`rounded-lg border px-4 py-3 grid grid-cols-3 gap-4 text-center ${
                battle.status === 'won' ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
              }`}>
                <div>
                  <p className="text-xs text-muted-foreground">Merit</p>
                  <p className="text-2xl font-bold text-amber-400">+{battle.result.meritGained}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">XP</p>
                  <p className="text-2xl font-bold text-blue-400">+{battle.result.expGained}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Casualties</p>
                  <p className="text-2xl font-bold">{battle.result.casualties}%</p>
                </div>
              </div>

              {/* Power Breakdown */}
              {pb && (
                <div className="border border-border/50 rounded-lg p-3 text-xs space-y-1 bg-muted/20">
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
                  <div className="flex justify-between font-bold border-t border-border/50 pt-1 mt-1 text-sm">
                    <span>Final Power</span>
                    <span className="text-primary">{pb.finalPower}</span>
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
                <p
                  className={`text-sm ${result.moraleChange > 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  Morale {result.moraleChange > 0 ? '+' : ''}
                  {result.moraleChange}
                </p>
              )}

              {/* New Injury */}
              {result?.newInjury && (
                <div className="border border-destructive/50 rounded-lg p-3 bg-destructive/5 text-sm">
                  <p className="font-semibold text-destructive">Injury Sustained!</p>
                  <p className="capitalize">
                    {result.newInjury.type.replace('_', ' ')} - {result.newInjury.battlesRemaining}{' '}
                    battles remaining
                  </p>
                </div>
              )}

              {droppedItem && (
                <div className={`border rounded-lg p-3 text-center ${rarityGlow[droppedItem.rarity]} border-border/50 bg-secondary/20`}>
                  <p className="text-xs text-muted-foreground mb-1">⚡ Item Looted!</p>
                  <p className={`font-bold text-base ${rarityColors[droppedItem.rarity]}`}>{droppedItem.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{droppedItem.rarity} {droppedItem.type}</p>
                  <div className="flex justify-center gap-2 mt-1 flex-wrap">
                    {Object.entries(droppedItem.statBonus ?? {}).map(([stat, val]) =>
                      val !== undefined && (val as number) > 0 && (
                        <span key={stat} className="text-xs text-green-400">+{val as number} {stat}</span>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* AI Narrative */}
              {generateNarrative.isPending && (
                <p className="text-xs text-muted-foreground italic animate-pulse">
                  Composing battle chronicle…
                </p>
              )}
              {narrative && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-muted-foreground italic leading-relaxed">
                  {narrative}
                </div>
              )}

              <Button className="w-full" onClick={() => { setResult(null); setNarrative(null); }}>
                Return to Arena
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
