import { useAuthStore } from '@/stores/authStore';
import { useInventory, useEquipItem, useUnequipItem } from '@/hooks/usePlayer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ItemIcon } from '@/components/icons/ItemIcon';
import { motion } from 'framer-motion';

const rarityColors: Record<string, string> = {
  common: 'bg-slate-500/20 text-slate-300 border-slate-500',
  rare: 'bg-blue-500/20 text-blue-300 border-blue-500',
  epic: 'bg-purple-500/20 text-purple-300 border-purple-500',
};

const rarityBorder: Record<string, string> = {
  common: 'border-slate-500/40',
  rare: 'border-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.15)]',
  epic: 'border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.2)]',
};

export function InventoryPage() {
  const playerId = useAuthStore((s) => s.playerId);
  const { data, isLoading } = useInventory(playerId);
  const equip = useEquipItem(playerId);
  const unequip = useUnequipItem(playerId);

  if (isLoading) {
    return <div className="text-muted-foreground animate-pulse">Inspecting your arsenal…</div>;
  }

  const items = data?.inventory?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display">Inventory</h2>
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
              <motion.div key={idx} whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
                <Card className={`border ${rarityBorder[item.rarity] ?? ''} ${entry.equipped ? 'border-primary/70 bg-primary/5' : ''} h-full`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <ItemIcon type={item.type} rarity={item.rarity} size={40} />
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-sm leading-tight">{item.name}</p>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs capitalize">{item.type}</Badge>
                          <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-semibold ${rarityColors[item.rarity] ?? ''}` }>
                            {item.rarity}
                          </span>
                          {entry.equipped && <Badge className="text-xs bg-primary/20 text-primary border-primary/50">Equipped</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm grid grid-cols-2 gap-1">
                      {item.statBonus &&
                        Object.entries(item.statBonus).map(
                          ([stat, val]) =>
                            val !== undefined && (val as number) > 0 && (
                              <p key={stat} className="text-green-400 text-xs">+{val as number} {stat}</p>
                            ),
                        )}
                    </div>
                    {entry.equipped ? (
                      <Button variant="outline" size="sm" className="w-full" disabled={unequip.isPending} onClick={() => unequip.mutate(item._id)}>Unequip</Button>
                    ) : (
                      <Button size="sm" className="w-full" disabled={equip.isPending} onClick={() => equip.mutate(item._id)}>Equip</Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
