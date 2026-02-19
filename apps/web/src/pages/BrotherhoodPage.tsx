import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useBrotherhoods, useCreateBrotherhood } from '@/hooks/useRomance';
import { useCharacters } from '@/hooks/useCharacters';

export function BrotherhoodPage() {
  const playerId = useAuthStore((s) => s.playerId);
  const { data } = useBrotherhoods(playerId);
  const { data: chars } = useCharacters(playerId);
  const create = useCreateBrotherhood();
  const [name, setName] = useState('Peach Garden Oath');
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold font-display">Brotherhood</h2>
      <div className="rounded-lg border p-4 space-y-3 bg-card">
        <input className="w-full rounded border px-3 py-2 bg-background" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid md:grid-cols-3 gap-2">
          {chars?.characters.map((c) => (
            <button key={c._id} className={`text-left rounded border px-3 py-2 ${selected.includes(c._id) ? 'border-primary bg-primary/10' : 'border-border'}`} onClick={() => toggle(c._id)}>
              {c.name}
            </button>
          ))}
        </div>
        <button
          className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
          disabled={!playerId || selected.length < 2 || create.isPending}
          onClick={() => playerId && create.mutate({ playerId, name, memberCharacterIds: selected })}
        >
          Forge Brotherhood
        </button>
      </div>

      <div className="grid gap-3">
        {data?.brotherhoods.map((b) => (
          <div key={b._id} className="rounded-lg border p-4 bg-card">
            <div className="font-semibold">{b.name}</div>
            <div className="text-sm text-muted-foreground">Bond Level {b.bondLevel} • Members {b.memberCharacterIds.length}/3</div>
          </div>
        ))}
      </div>
    </div>
  );
}
