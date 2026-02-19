import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useSuccessionState, useConfirmSuccession } from '@/hooks/useSuccession';
import type { IPlayerCharacter } from '@rotg/shared-types';
import { GeneralPortrait } from '@/components/canvas/GeneralPortrait';
import { Button } from '@/components/ui/button';

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
          ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-[0_0_12px_rgba(212,160,23,0.15)]'
          : 'border-border bg-card hover:bg-muted/40'
      }`}
    >
      <div className="flex items-center gap-3">
        <GeneralPortrait name={character.name} size="sm" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm font-display">{character.name}</span>
            <span className="text-xs text-muted-foreground capitalize">{character.role}</span>
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
            <span>Loyalty {character.loyalty}</span>
            <span>Ambition {character.ambition}</span>
            <span>Leadership {character.stats.leadership}</span>
          </div>
        </div>
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

  if (isLoading) return <div className="text-muted-foreground animate-pulse font-display">The court gathers…</div>;

  if (!data?.pending) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-4 pt-16">
        <p className="text-muted-foreground">No pending succession.</p>
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
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
      <div className="rounded-xl border border-destructive/60 bg-destructive/10 p-6 text-center space-y-2 shadow-[0_0_20px_rgba(220,38,38,0.1)]">
        <h1 className="text-xl font-bold text-destructive font-display">A Commander has Fallen</h1>
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
        <h2 className="font-semibold font-display">Choose Your Successor</h2>
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
      <Button
        onClick={handleConfirm}
        disabled={confirmSuccession.isPending || (data.candidates.length > 0 && !selectedId)}
        className="w-full"
        variant="default"
      >
        {confirmSuccession.isPending
          ? 'Confirming…'
          : data.candidates.length === 0
            ? 'Accept the Consequences'
            : 'Confirm Succession'}
      </Button>

      {confirmSuccession.isError && (
        <p className="text-destructive text-sm text-center">
          {(confirmSuccession.error as any)?.message ?? 'Succession failed.'}
        </p>
      )}
    </div>
  );
}
