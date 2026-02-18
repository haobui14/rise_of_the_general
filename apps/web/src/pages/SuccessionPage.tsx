import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useSuccessionState, useConfirmSuccession } from '@/hooks/useSuccession';
import type { IPlayerCharacter } from '@rotg/shared-types';

function CandidateCard({
  character,
  selected,
  onSelect,
}: {
  character: IPlayerCharacter;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border p-4 space-y-2 transition-all ${
        selected
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'border-border bg-card hover:bg-muted/40'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">{character.name}</span>
        <span className="text-xs text-muted-foreground capitalize">{character.role}</span>
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>Loyalty {character.loyalty}</span>
        <span>Ambition {character.ambition}</span>
        <span>LED {character.stats.leadership}</span>
      </div>
    </button>
  );
}

export function SuccessionPage() {
  const playerId = useAuthStore((s) => s.playerId);
  const navigate = useNavigate();
  const { data, isLoading } = useSuccessionState(playerId);
  const confirmSuccession = useConfirmSuccession();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) return <div className="text-muted-foreground">Loading succession state...</div>;

  if (!data?.pending) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-4 pt-16">
        <p className="text-muted-foreground">No pending succession.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  async function handleConfirm() {
    if (!playerId || !selectedId) return;
    await confirmSuccession.mutateAsync({ playerId, successorId: selectedId });
    navigate('/dashboard');
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center space-y-2">
        <h1 className="text-xl font-bold text-destructive">A Commander has Fallen</h1>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{data.deceasedName}</span> has perished in
          battle. The dynasty must choose a successor.
        </p>
      </div>

      {/* Effect preview */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Stability', delta: data.stabilityDelta },
          { label: 'Morale', delta: data.moraleDelta },
          { label: 'Legitimacy', delta: data.legitimacyDelta },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p
              className={`text-lg font-bold ${
                item.delta < 0 ? 'text-destructive' : 'text-green-500'
              }`}
            >
              {item.delta > 0 ? '+' : ''}
              {item.delta}
            </p>
          </div>
        ))}
      </div>

      {/* Candidate list */}
      <div className="space-y-3">
        <h2 className="font-semibold">Choose Your Successor</h2>
        {data.candidates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No candidates available. The dynasty faces a crisis — severe penalties apply.
          </div>
        ) : (
          <div className="space-y-2">
            {data.candidates.map((c) => (
              <CandidateCard
                key={c._id}
                character={c}
                selected={selectedId === c._id}
                onSelect={() => setSelectedId(c._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={confirmSuccession.isPending || (data.candidates.length > 0 && !selectedId)}
        className="w-full py-3 rounded-md bg-primary text-primary-foreground font-medium disabled:opacity-50 transition-opacity"
      >
        {confirmSuccession.isPending
          ? 'Confirming...'
          : data.candidates.length === 0
            ? 'Accept the Consequences'
            : 'Confirm Succession'}
      </button>

      {confirmSuccession.isError && (
        <p className="text-destructive text-sm text-center">
          {(confirmSuccession.error as any)?.message ?? 'Succession failed.'}
        </p>
      )}
    </div>
  );
}
