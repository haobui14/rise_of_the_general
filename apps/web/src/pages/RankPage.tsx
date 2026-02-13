import { useAuthStore } from '@/stores/authStore';
import { usePlayer, useRanks, usePromotePlayer } from '@/hooks/usePlayer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export function RankPage() {
  const playerId = useAuthStore((s) => s.playerId);
  const { data: playerData, isLoading: playerLoading } = usePlayer(playerId);
  const { data: rankData, isLoading: ranksLoading } = useRanks();
  const promote = usePromotePlayer();

  if (playerLoading || ranksLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (!playerData || !rankData) {
    return <div className="text-destructive">Failed to load data</div>;
  }

  const { player, rank: currentRank } = playerData;
  const ranks = rankData.ranks;
  const currentTier = currentRank?.tier ?? 1;

  // Find next rank
  const nextRank = ranks.find((r) => r.tier === currentTier + 1);

  const meritProgress = nextRank ? Math.min(100, (player.merit / nextRank.requiredMerit) * 100) : 100;
  const leadershipProgress = nextRank
    ? Math.min(100, (player.stats.leadership / nextRank.requiredLeadership) * 100)
    : 100;

  const canPromote = nextRank
    && player.merit >= nextRank.requiredMerit
    && player.stats.leadership >= nextRank.requiredLeadership;

  const handlePromote = async () => {
    if (!playerId) return;
    try {
      await promote.mutateAsync(playerId);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Rank Progression</h2>
        <p className="text-muted-foreground">Rise through the military ranks</p>
      </div>

      {/* Current rank + promotion */}
      {nextRank && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Next Promotion: {nextRank.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Merit</span>
                <span>{player.merit} / {nextRank.requiredMerit}</span>
              </div>
              <Progress value={meritProgress} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Leadership</span>
                <span>{player.stats.leadership} / {nextRank.requiredLeadership}</span>
              </div>
              <Progress value={leadershipProgress} />
            </div>
            <Button
              className="w-full"
              disabled={!canPromote || promote.isPending}
              onClick={handlePromote}
            >
              {promote.isPending
                ? 'Promoting...'
                : canPromote
                  ? `Promote to ${nextRank.title}`
                  : 'Requirements not met'}
            </Button>
            {promote.isSuccess && (
              <p className="text-sm text-green-400 text-center">Promotion successful!</p>
            )}
            {promote.isError && (
              <p className="text-sm text-destructive text-center">
                {promote.error instanceof Error ? promote.error.message : 'Promotion failed'}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rank Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>All Ranks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ranks.map((rank) => {
              const isCurrent = rank.tier === currentTier;
              const isPast = rank.tier < currentTier;
              const isFuture = rank.tier > currentTier;

              return (
                <div
                  key={rank._id}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                    isCurrent
                      ? 'border-primary bg-primary/10'
                      : isPast
                        ? 'border-border bg-secondary/50 opacity-75'
                        : 'border-border opacity-50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : isPast
                          ? 'bg-green-600 text-white'
                          : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {isPast ? '✓' : rank.tier}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {rank.title}
                      {isCurrent && (
                        <Badge variant="default" className="ml-2">
                          Current
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rank.requiredMerit > 0
                        ? `${rank.requiredMerit} merit, ${rank.requiredLeadership} leadership`
                        : 'Starting rank'}
                      {' · '}Max troops: {rank.maxTroopCommand.toLocaleString()}
                    </p>
                  </div>
                  {isFuture && (
                    <Badge variant="outline" className="text-xs">
                      Locked
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
