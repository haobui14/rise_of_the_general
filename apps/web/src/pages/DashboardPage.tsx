import { useAuthStore } from '@/stores/authStore';
import { usePlayer } from '@/hooks/usePlayer';
import { useArmy } from '@/hooks/useArmy';
import { useInjuries } from '@/hooks/useInjuries';
import { useLegacy } from '@/hooks/useLegacy';
import { useCharacters } from '@/hooks/useCharacters';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

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
    return <div className="text-muted-foreground">Loading...</div>;
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
        <h2 className="text-2xl font-bold">Dashboard</h2>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Current Rank
              <Badge variant="default">Tier {rank?.tier}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{rank?.title ?? 'Unknown'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Faction: {faction?.name ?? 'Unknown'} ({faction?.leaderName})
            </p>
            <p className="text-sm text-muted-foreground">
              Max Troops: {rank?.maxTroopCommand?.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Level {player.level}</span>
                <span>
                  {player.experience} / {player.level * 100} XP
                </span>
              </div>
              <Progress value={levelProgress} />
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
                <span
                  className={
                    player.warExhaustion > 50
                      ? 'text-red-400'
                      : player.warExhaustion > 20
                        ? 'text-yellow-400'
                        : 'text-green-400'
                  }
                >
                  {player.warExhaustion}/100
                </span>
              </div>
              <Progress value={player.warExhaustion} max={100} />
            </div>
          </CardContent>
        </Card>

        {/* Army Card */}
        {army && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Army
                <Badge variant="outline" className="capitalize">
                  {army.formation}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Troops</p>
                  <p className="font-semibold">{army.troopCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Morale</p>
                  <p className="font-semibold">{army.morale}/100</p>
                </div>
              </div>
              <Progress value={army.morale} />
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
          <CardTitle>Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(Object.keys(player.stats) as (keyof typeof player.stats)[]).map((key) => {
              const base = player.stats[key];
              const effective = effectiveStats[key];
              const bonus = effective - base;
              return (
                <div key={key} className="flex items-center gap-4">
                  <span className="text-sm w-24 text-muted-foreground">
                    {statLabels[key] || key}
                  </span>
                  <div className="flex-1">
                    <Progress value={effective} max={Math.max(maxStat, 50)} />
                  </div>
                  <span className="text-sm font-mono w-16 text-right flex items-center justify-end gap-1">
                    <span>{effective}</span>
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
