import { useAuthStore } from '@/stores/authStore';
import { usePlayer } from '@/hooks/usePlayer';
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

  if (isLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (error || !data) {
    return <div className="text-destructive">Failed to load player data</div>;
  }

  const { player, rank, faction } = data;
  const maxStat = Math.max(...Object.values(player.stats));
  const levelProgress = (player.experience / (player.level * 100)) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back, {player.username}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <span>{player.experience} / {player.level * 100} XP</span>
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
              <span className={`h-3 w-3 rounded-full ${player.isAlive ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">{player.isAlive ? 'Alive' : 'Fallen'}</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Joined: {new Date(player.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(player.stats).map(([key, value]) => (
              <div key={key} className="flex items-center gap-4">
                <span className="text-sm w-24 text-muted-foreground">
                  {statLabels[key] || key}
                </span>
                <div className="flex-1">
                  <Progress value={value} max={Math.max(maxStat, 50)} />
                </div>
                <span className="text-sm font-mono w-8 text-right">{value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
