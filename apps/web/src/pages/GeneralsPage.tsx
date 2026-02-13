import { useAuthStore } from '@/stores/authStore';
import { useGenerals, useRecruitGeneral } from '@/hooks/useGenerals';
import { usePlayer } from '@/hooks/usePlayer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const rarityColors: Record<string, string> = {
  uncommon: 'border-green-500/50 bg-green-500/5',
  rare: 'border-blue-500/50 bg-blue-500/5',
  legendary: 'border-yellow-500/50 bg-yellow-500/5',
};

const rarityBadge: Record<string, string> = {
  uncommon: 'bg-green-500/20 text-green-300 border-green-500',
  rare: 'bg-blue-500/20 text-blue-300 border-blue-500',
  legendary: 'bg-yellow-500/20 text-yellow-300 border-yellow-500',
};

const factionNames: Record<string, string> = {};

export function GeneralsPage() {
  const playerId = useAuthStore((s) => s.playerId);
  const { data: playerData } = usePlayer(playerId);
  const { data, isLoading } = useGenerals(playerId);
  const recruit = useRecruitGeneral();

  if (isLoading) {
    return <div className="text-muted-foreground">Loading generals...</div>;
  }

  const generals = data?.generals ?? [];
  const playerTier = playerData?.rank?.tier ?? 1;

  // Group by faction
  const recruited = generals.filter((g) => g.recruited);
  const available = generals.filter((g) => !g.recruited);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Generals</h2>
        <p className="text-muted-foreground">
          Build relationships and recruit famous officers to your cause
        </p>
      </div>

      {/* Recruited generals */}
      {recruited.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Under Your Command ({recruited.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recruited.map((g) => (
              <Card key={g._id} className={`${rarityColors[g.rarity]} border-2`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {g.name}
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${rarityBadge[g.rarity]}`}>
                      {g.rarity}
                    </span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground italic">{g.title}</p>
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
                  <Badge variant="success" className="w-full justify-center">Recruited</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available generals */}
      <div>
        <h3 className="text-lg font-semibold mb-3">All Generals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {available.map((g) => {
            const rankLocked = playerTier < g.requiredRankTier;
            const relProgress = Math.min(100, (g.relationship / g.requiredRelationship) * 100);

            return (
              <Card key={g._id} className={`${rankLocked ? 'opacity-60' : ''} ${rarityColors[g.rarity]} border`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {g.name}
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${rarityBadge[g.rarity]}`}>
                      {g.rarity}
                    </span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground italic">{g.title}</p>
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

                  {/* Relationship bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Relationship</span>
                      <span>{g.relationship} / {g.requiredRelationship}</span>
                    </div>
                    <Progress value={relProgress} />
                  </div>

                  {/* Requirements */}
                  <div className="text-xs space-y-0.5">
                    <p className={rankLocked ? 'text-destructive' : 'text-green-400'}>
                      {rankLocked ? `Requires rank tier ${g.requiredRankTier} (you: ${playerTier})` : 'Rank requirement met'}
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    size="sm"
                    disabled={!g.canRecruit || recruit.isPending}
                    onClick={() => recruit.mutate(g._id)}
                  >
                    {g.canRecruit ? `Recruit ${g.name}` : 'Cannot Recruit'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
