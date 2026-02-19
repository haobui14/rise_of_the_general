import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useArmy, useCreateArmy, useRecruitTroops, useChangeFormation, useChangeTroopType } from '@/hooks/useArmy';
import { usePlayer } from '@/hooks/usePlayer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TroopIcon } from '@/components/icons/TroopIcon';
import { motion } from 'framer-motion';

const formations = ['line', 'wedge', 'phalanx', 'skirmish'] as const;
const troopTypes = ['infantry', 'cavalry', 'archer'] as const;

const formationDescriptions: Record<string, string> = {
  line: 'Balanced (x1.0)',
  wedge: 'Offensive (x1.1)',
  phalanx: 'Defensive (x1.15)',
  skirmish: 'Fast but weak (x0.9)',
};

export function ArmyPage() {
  const playerId = useAuthStore((s) => s.playerId);
  const { data: playerData } = usePlayer(playerId);
  const { data, isLoading } = useArmy(playerId);
  const createArmy = useCreateArmy(playerId);
  const recruitTroops = useRecruitTroops(playerId);
  const changeFormation = useChangeFormation(playerId);
  const changeTroopType = useChangeTroopType(playerId);
  const [recruitCount, setRecruitCount] = useState(10);

  const playerTier = playerData?.rank?.tier ?? 1;

  if (isLoading) {
    return <div className="text-muted-foreground animate-pulse">Mustering the troops…</div>;
  }

  const army = data?.army;

  if (!army) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-display">Army</h2>
          <p className="text-muted-foreground">Command your own army</p>
        </div>
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            {playerTier < 3 ? (
              <>
                <p className="text-lg text-muted-foreground">Army unlocks at rank tier 3</p>
                <p className="text-sm text-muted-foreground">Current tier: {playerTier}</p>
              </>
            ) : (
              <>
                <p className="text-lg text-muted-foreground">You don't have an army yet.</p>
                <p className="text-sm text-muted-foreground">Choose your troop type to begin:</p>
                <div className="flex gap-3 justify-center">
                  {troopTypes.map((type) => (
                    <Button key={type} onClick={() => createArmy.mutate(type)} disabled={createArmy.isPending} variant="outline" className="capitalize flex gap-2">
                      <TroopIcon type={type} size={18} />{type}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display">Army</h2>
        <p className="text-muted-foreground">Manage your forces</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Army Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between font-display">
              <span className="flex items-center gap-2">
                <TroopIcon type={army.troopType as any} size={22} />
                Army Overview
              </span>
              <Badge variant="outline" className="capitalize">{army.troopType}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md bg-muted/40 px-3 py-2">
                <p className="text-xs text-muted-foreground">Troops</p>
                <p className="text-2xl font-bold">{army.troopCount.toLocaleString()}</p>
              </div>
              <div className="rounded-md bg-muted/40 px-3 py-2">
                <p className="text-xs text-muted-foreground">Formation</p>
                <p className="text-2xl font-bold capitalize">{army.formation}</p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Morale</span>
                <span className={army.morale >= 80 ? 'text-green-400' : army.morale >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                  {army.morale}/100
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                <motion.div className={`absolute inset-y-0 left-0 rounded-full ${
                  army.morale >= 80 ? 'bg-green-500' : army.morale >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`} initial={{ width: 0 }} animate={{ width: `${army.morale}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {army.morale >= 80 ? '+15% power' : army.morale >= 50 ? 'Normal morale' : army.morale >= 30 ? '-10% power' : '-25% power'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recruit Troops */}
        <Card>
          <CardHeader>
            <CardTitle>Recruit Troops</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cost: {recruitCount * 10} gold ({playerData?.player.gold ?? 0} available)
            </p>
            <div className="flex gap-2">
              {[10, 25, 50, 100].map((n) => (
                <Button
                  key={n}
                  variant={recruitCount === n ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRecruitCount(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
            <Button
              className="w-full"
              onClick={() => recruitTroops.mutate(recruitCount)}
              disabled={recruitTroops.isPending}
            >
              Recruit {recruitCount} Troops
            </Button>
            {recruitTroops.isError && (
              <p className="text-sm text-destructive">
                {recruitTroops.error instanceof Error ? recruitTroops.error.message : 'Failed'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Formation */}
        <Card>
          <CardHeader>
            <CardTitle>Formation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {formations.map((f) => (
              <Button
                key={f}
                variant={army.formation === f ? 'default' : 'outline'}
                className="w-full justify-between capitalize"
                onClick={() => changeFormation.mutate(f)}
                disabled={changeFormation.isPending}
              >
                <span>{f}</span>
                <span className="text-xs opacity-70">{formationDescriptions[f]}</span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Troop Type */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Troop Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {troopTypes.map((t) => (
              <Button key={t} variant={army.troopType === t ? 'default' : 'outline'}
                className="w-full capitalize flex gap-2 justify-start"
                onClick={() => changeTroopType.mutate(t)} disabled={changeTroopType.isPending}>
                <TroopIcon type={t} size={18} />{t}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
