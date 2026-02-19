import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCharacters } from '@/hooks/useCharacters';
import { useChallengeDuel, useDuels } from '@/hooks/useRomance';

export function DuelPage() {
  const playerId = useAuthStore((s) => s.playerId);
  const { data: chars } = useCharacters(playerId);
  const { data } = useDuels(playerId);
  const duel = useChallengeDuel();
  const [challengerCharacterId, setChallengerCharacterId] = useState('');
  const [opponentName, setOpponentName] = useState('Lu Bu');

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold font-display">Legendary Duels</h2>
      <div className="rounded-lg border p-4 bg-card space-y-2">
        <select className="w-full rounded border px-3 py-2 bg-background" value={challengerCharacterId} onChange={(e) => setChallengerCharacterId(e.target.value)}>
          <option value="">Select challenger</option>
          {chars?.characters.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <input className="w-full rounded border px-3 py-2 bg-background" value={opponentName} onChange={(e) => setOpponentName(e.target.value)} />
        <button
          className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
          disabled={!playerId || !challengerCharacterId || duel.isPending}
          onClick={() => playerId && duel.mutate({
            playerId,
            challengerCharacterId,
            opponentName,
            trigger: 'challenge',
            opponentStats: { strength: 12, defense: 11, strategy: 10, speed: 12, leadership: 10 },
          })}
        >
          Challenge Duel
        </button>
      </div>

      <div className="space-y-3">
        {data?.duels.map((d) => (
          <div key={d._id} className="rounded-lg border p-4 bg-card">
            <div className="font-semibold">vs {d.opponentName}</div>
            <div className="text-sm text-muted-foreground">Outcome: {d.outcome} • Merit +{d.rewardMerit} • EXP +{d.rewardExp}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
