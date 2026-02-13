import { useAuthStore } from '@/stores/authStore';
import { useInventory } from '@/hooks/usePlayer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const rarityColors: Record<string, string> = {
  common: 'bg-gray-500/20 text-gray-300 border-gray-500',
  rare: 'bg-blue-500/20 text-blue-300 border-blue-500',
  epic: 'bg-purple-500/20 text-purple-300 border-purple-500',
};

export function InventoryPage() {
  const playerId = useAuthStore((s) => s.playerId);
  const { data, isLoading } = useInventory(playerId);

  if (isLoading) {
    return <div className="text-muted-foreground">Loading inventory...</div>;
  }

  const items = data?.inventory?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Inventory</h2>
        <p className="text-muted-foreground">Your weapons and armor</p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-lg text-muted-foreground">No items yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Win battles to earn loot!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((entry: any, idx: number) => {
            const item = entry.itemId;
            if (!item || typeof item === 'string') return null;

            return (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    {item.name}
                    {entry.equipped && <Badge variant="success">Equipped</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-3">
                    <Badge variant="outline">{item.type}</Badge>
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${
                        rarityColors[item.rarity] || ''
                      }`}
                    >
                      {item.rarity}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    {item.statBonus &&
                      Object.entries(item.statBonus).map(
                        ([stat, val]) =>
                          val !== undefined &&
                          (val as number) > 0 && (
                            <p key={stat} className="text-muted-foreground">
                              +{val as number} {stat}
                            </p>
                          ),
                      )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
