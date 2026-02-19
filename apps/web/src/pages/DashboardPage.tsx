import { useAuthStore } from '@/stores/authStore';
import { usePlayer } from '@/hooks/usePlayer';
import { useArmy } from '@/hooks/useArmy';
import { useInjuries } from '@/hooks/useInjuries';
import { useLegacy } from '@/hooks/useLegacy';
import { useCharacters } from '@/hooks/useCharacters';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FactionCrest } from '@/components/icons/FactionCrest';
import { RankInsignia } from '@/components/icons/RankInsignia';
import { motion } from 'framer-motion';

const statLabels: Record<string, string> = {
  strength: 'Strength',
  defense: 'Defense',
  strategy: 'Strategy',
  speed: 'Speed',
  leadership: 'Leadership',
};

export function DashboardPage() {
  const playerId = useAuthStore((s) => s.playerId);
  const { data, isLoading, error } = usePlayer(playerId);
  const { data: armyData } = useArmy(playerId);
  const { data: injuryData } = useInjuries(playerId);
  const { data: legacyData } = useLegacy(playerId);
  const { data: charData } = useCharacters(playerId);

  if (isLoading) {
    return <div className="text-muted-foreground animate-pulse font-display">Summoning your record…</div>;
  }

  if (error || !data) {
    return <div className="text-destructive">Failed to load player data</div>;
  }

  const { player, rank, faction } = data;
  const effectiveStats = data.effectiveStats ?? player.stats;
  const maxStat = Math.max(...Object.values(effectiveStats));
  const levelProgress = (player.experience / (player.level * 100)) * 100;
  const army = armyData?.army;
  const injuries = injuryData?.injuries ?? [];
  const legacy = legacyData?.legacy;
  const activeCharacter =
    charData?.characters.find((c) => c._id === charData.activeCharacterId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display">Command Tent</h2>
        <p className="text-muted-foreground">
          Welcome back, {player.username}
          {activeCharacter && (
            <>
              {' '}
              — commanding as{' '}
              <span className="text-foreground font-semibold">{activeCharacter.name}</span>{' '}
              <span className="text-xs capitalize text-muted-foreground">
                ({activeCharacter.role})
              </span>
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Rank Card */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between font-display">
              Current Rank
              <Badge variant="default" className="font-mono">Tier {rank?.tier}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <RankInsignia tier={rank?.tier ?? 1} size={48} />
              <div>
                <p className="text-2xl font-bold text-primary font-display">{rank?.title ?? 'Unknown'}</p>
                {faction && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <FactionCrest faction={faction.name} size={16} />
                    <p className="text-sm text-muted-foreground">{faction.name}</p>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Max Troops: {rank?.maxTroopCommand?.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold">Level {player.level}</span>
                <span className="text-muted-foreground text-xs">
                  {player.experience} / {player.level * 100} XP
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                <motion.div className="absolute inset-y-0 left-0 bg-primary rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${levelProgress}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Merit</p>
                <p className="text-lg font-semibold">{player.merit}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Gold</p>
                <p className="text-lg font-semibold">{player.gold}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`h-3 w-3 rounded-full ${player.isAlive ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className="text-sm">{player.isAlive ? 'Alive' : 'Fallen'}</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Joined: {new Date(player.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>War Exhaustion</span>
                <span className={player.warExhaustion > 50 ? 'text-red-400' : player.warExhaustion > 20 ? 'text-yellow-400' : 'text-green-400'}>
                  {player.warExhaustion}/100
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                <motion.div className={`absolute inset-y-0 left-0 rounded-full ${
                  player.warExhaustion > 50 ? 'bg-red-500' : player.warExhaustion > 20 ? 'bg-yellow-500' : 'bg-green-500'
                }`} initial={{ width: 0 }} animate={{ width: `${player.warExhaustion}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Army Card */}
        {army && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between font-display">
                Army
                <Badge variant="outline" className="capitalize">{army.formation}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-muted/40 px-2 py-1.5">
                  <p className="text-muted-foreground text-xs">Troops</p>
                  <p className="font-bold text-base">{army.troopCount.toLocaleString()}</p>
                </div>
                <div className="rounded-md bg-muted/40 px-2 py-1.5">
                  <p className="text-muted-foreground text-xs">Morale</p>
                  <p className={`font-bold text-base ${
                    army.morale > 70 ? 'text-green-400' : army.morale > 40 ? 'text-yellow-400' : 'text-red-400'
                  }`}>{army.morale}/100</p>
                </div>
              </div>
              <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                <motion.div className={`absolute inset-y-0 left-0 rounded-full ${
                  army.morale > 70 ? 'bg-green-500' : army.morale > 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`} initial={{ width: 0 }} animate={{ width: `${army.morale}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Injuries Card */}
        {injuries.length > 0 && (
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Active Injuries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {injuries.map((inj: any) => (
                <div key={inj._id} className="flex justify-between text-sm">
                  <span className="capitalize">{inj.type.replace('_', ' ')}</span>
                  <span className="text-muted-foreground">{inj.battlesRemaining} battles left</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Legacy Card */}
        {legacy && legacy.dynastiesCompleted > 0 && (
          <Card className="border-yellow-500/30">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Legacy
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500">
                  {legacy.dynastiesCompleted}{' '}
                  {legacy.dynastiesCompleted === 1 ? 'Dynasty' : 'Dynasties'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Permanent power bonus: +
                {Math.round((legacy.permanentBonuses.powerMultiplier - 1) * 100)}%
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(Object.keys(player.stats) as (keyof typeof player.stats)[]).map((key) => {
              const base = player.stats[key];
              const effective = effectiveStats[key];
              const bonus = effective - base;
              const pct = Math.min(100, (effective / Math.max(maxStat, 50)) * 100);
              const isHigh = pct > 70;
              return (
                <div key={key} className="flex items-center gap-4">
                  <span className="text-sm w-24 text-muted-foreground shrink-0">
                    {statLabels[key] || key}
                  </span>
                  <div className="flex-1 relative h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={`absolute inset-y-0 left-0 rounded-full ${
                        isHigh ? 'bg-primary shadow-[0_0_6px_rgba(var(--primary-rgb,212,160,23),0.6)]' : 'bg-primary/60'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: 0.05 }}
                    />
                  </div>
                  <span className="text-sm font-mono w-16 text-right flex items-center justify-end gap-1">
                    <span className={isHigh ? 'text-primary font-bold' : ''}>{effective}</span>
                    {bonus > 0 && <span className="text-green-400 text-xs">+{bonus}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
