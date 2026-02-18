import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCourtState, useCourtAction } from '@/hooks/usePolitics';
import { useGenerateNarrative } from '@/hooks/useAiContent';
import type { CourtActionType } from '@rotg/shared-types';

function CourtBar({
  label,
  value,
  color = 'bg-primary',
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{value}/100</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

const ACTIONS: Array<{
  action: CourtActionType;
  label: string;
  description: string;
}> = [
  {
    action: 'negotiate',
    label: 'Negotiate',
    description: '+Legitimacy +Stability. Build diplomatic ties.',
  },
  {
    action: 'reform',
    label: 'Reform',
    description: '+Stability +Legitimacy. Streamline administration.',
  },
  {
    action: 'propaganda',
    label: 'Propaganda',
    description: '+Morale — but feeds corruption.',
  },
  {
    action: 'purge',
    label: 'Purge',
    description: '−Corruption, but destabilizes morale and court.',
  },
];

export function PoliticsPage() {
  const playerId = useAuthStore((s) => s.playerId);
  const { data, isLoading, error } = useCourtState(playerId);
  const courtAction = useCourtAction();
  const generateEvent = useGenerateNarrative();
  const [courtEvent, setCourtEvent] = useState<string | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);

  function handleGenerateEvent() {
    if (!playerId) return;
    setCourtEvent(null);
    setEventError(null);
    generateEvent.mutate(
      {
        playerId,
        event: 'court_political_event',
        context: court
          ? `stability ${court.stability}, legitimacy ${court.legitimacy}, morale ${court.morale}, corruption ${court.corruption}`
          : undefined,
      },
      {
        onSuccess: (d) => setCourtEvent(d.text),
        onError: (err: any) => setEventError(err?.message ?? 'AI event generation failed.'),
      },
    );
  }

  if (isLoading) return <div className="text-muted-foreground">Loading court state...</div>;
  if (error) return <div className="text-destructive">Failed to load court data.</div>;

  const court = data?.court;
  const turnsLeft = data?.politicalTurnsRemaining ?? 0;

  // Derive live effects from current court values
  const moraleEffect =
    court && court.morale > 70
      ? { active: true, label: '+5% merit from battles' }
      : { active: false, label: 'Merit unaffected (raise Morale above 70 to activate)' };
  const stabilityEffect =
    court && court.stability < 40
      ? { active: true, label: '+5 exhaustion per battle loss (stability is low)' }
      : { active: false, label: 'Exhaustion unaffected (keep Stability ≥40 to prevent penalty)' };
  const corruptionEffect =
    court && court.corruption > 70
      ? { active: true, label: '−25% gold from battles (corruption is critical)' }
      : { active: false, label: 'Gold unaffected (keep Corruption ≤70 to prevent penalty)' };
  const legitimacyEffect = {
    active: false,
    label: 'Tracks officer loyalty threshold — future mechanics',
  };

  function handleAction(action: CourtActionType) {
    if (!playerId || turnsLeft <= 0) return;
    courtAction.mutate({ playerId, action });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Political Court</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the dynasty's internal politics. You have{' '}
            <span
              className={`font-semibold ${turnsLeft === 0 ? 'text-destructive' : 'text-primary'}`}
            >
              {turnsLeft}
            </span>{' '}
            political turn{turnsLeft !== 1 ? 's' : ''} remaining.
          </p>
        </div>
        <button
          onClick={handleGenerateEvent}
          disabled={generateEvent.isPending}
          className="sm:shrink-0 rounded-md border border-amber-500/40 px-3 py-2 text-sm text-amber-300 hover:bg-amber-500/10 transition-colors disabled:opacity-40"
        >
          {generateEvent.isPending ? 'Generating…' : '✨ AI Court Event'}
        </button>
      </div>

      {/* AI Court Event */}
      {courtEvent && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-xs font-medium text-amber-400 mb-1">📜 Court Dispatch</p>
          <p className="text-sm text-muted-foreground italic leading-relaxed">{courtEvent}</p>
        </div>
      )}
      {eventError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {eventError}
        </div>
      )}

      {/* Court bars */}
      {court && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-sm">Court Status</h2>
          <CourtBar label="Stability" value={court.stability} color="bg-blue-500" />
          <CourtBar label="Legitimacy" value={court.legitimacy} color="bg-amber-500" />
          <CourtBar label="Morale" value={court.morale} color="bg-green-500" />
          <CourtBar label="Corruption" value={court.corruption} color="bg-red-500" />

          {court.lastActionType && (
            <p className="text-xs text-muted-foreground pt-1">
              Last action: <span className="capitalize font-medium">{court.lastActionType}</span>
            </p>
          )}
        </div>
      )}

      {/* Live effects */}
      {court && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-sm">Current Battle Effects</h2>
          <div className="space-y-2 text-xs">
            {[
              { label: 'Morale', effect: moraleEffect },
              { label: 'Stability', effect: stabilityEffect },
              { label: 'Corruption', effect: corruptionEffect },
              { label: 'Legitimacy', effect: legitimacyEffect },
            ].map(({ label, effect }) => (
              <div key={label} className="flex items-start gap-2">
                <span
                  className={`mt-px shrink-0 w-2 h-2 rounded-full ${effect.active ? 'bg-yellow-400' : 'bg-muted'}`}
                />
                <span className="text-muted-foreground w-20 shrink-0">{label}</span>
                <span
                  className={
                    effect.active ? 'text-yellow-300 font-medium' : 'text-muted-foreground'
                  }
                >
                  {effect.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action result */}
      {courtAction.data && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
          <p className="font-medium">{courtAction.data.detail}</p>
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            {Object.entries(courtAction.data.deltas).map(([k, v]) => (
              <span key={k}>
                {k.charAt(0).toUpperCase() + k.slice(1)}:{' '}
                <span className={v > 0 ? 'text-green-500' : v < 0 ? 'text-destructive' : ''}>
                  {v > 0 ? `+${v}` : v}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <h2 className="font-semibold">Take Action</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACTIONS.map(({ action, label, description }) => (
            <button
              key={action}
              onClick={() => handleAction(action)}
              disabled={turnsLeft <= 0 || courtAction.isPending}
              className="rounded-xl border border-border bg-card p-4 text-left hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </button>
          ))}
        </div>

        {turnsLeft === 0 && (
          <p className="text-xs text-destructive text-center">
            No political turns remaining. Resets each dynasty cycle.
          </p>
        )}
      </div>
    </div>
  );
}
