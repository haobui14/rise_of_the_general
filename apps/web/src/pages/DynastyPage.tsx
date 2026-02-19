import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { usePlayer } from '@/hooks/usePlayer';
import { useDynastyState, useStrategicAction } from '@/hooks/useDynasty';
import { useTimeline } from '@/hooks/useTimeline';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

const strategyActions = [
  {
    key: 'rest',
    label: 'Rest',
    description: 'Recover from exhaustion. Reduces war exhaustion.',
  },
  {
    key: 'drill',
    label: 'Drill Troops',
    description: 'Train your army. Grants bonus XP and merit.',
  },
  {
    key: 'fortify',
    label: 'Fortify Territory',
    description: 'Strengthen a held territory. Requires a territory ID.',
    needsTerritory: true,
  },
  {
    key: 'spy',
    label: 'Send Spies',
    description: 'Reveal enemy generals in a territory.',
    needsTerritory: true,
  },
] as const;

export function DynastyPage() {
  const playerId = useAuthStore((s) => s.playerId);
  const { data: playerData } = usePlayer(playerId);
  const { data: dynastyData, isLoading } = useDynastyState();
  const dynastyId = ((playerData?.player as any)?.dynastyId as string | undefined) ?? null;
  const { data: timelineData } = useTimeline(dynastyId);
  const [actionResult, setActionResult] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [territoryId, setTerritoryId] = useState('');

  const restMutation = useStrategicAction('rest');
  const drillMutation = useStrategicAction('drill');
  const fortifyMutation = useStrategicAction('fortify');
  const spyMutation = useStrategicAction('spy');

  const mutationMap: Record<string, typeof restMutation> = {
    rest: restMutation,
    drill: drillMutation,
    fortify: fortifyMutation,
    spy: spyMutation,
  };

  function handleAction(actionKey: string, needsTerritory?: boolean) {
    if (!playerId) return;
    const mutation = mutationMap[actionKey];
    if (!mutation) return;
    setPendingAction(actionKey);
    setActionResult(null);
    mutation.mutate(
      {
        playerId,
        ...(needsTerritory && territoryId ? { territoryId } : {}),
      },
      {
        onSuccess: (res: any) => {
          setActionResult(res.detail ?? 'Action completed.');
          setPendingAction(null);
        },
        onError: (err: any) => {
          setActionResult(err.message ?? 'Action failed.');
          setPendingAction(null);
        },
      },
    );
  }

  if (isLoading) return <div className="text-muted-foreground animate-pulse">Consulting the war chronicles…</div>;

  const state = dynastyData?.dynastyState;
  const player = playerData?.player;
  const warExhaustion = player?.warExhaustion ?? 0;
  const timeline = timelineData?.newTimelineType ?? 'historical';
  const isDivergent = timeline === 'divergent';
  const successionPending = (player as any)?.successionPending ?? false;

  const stabilityColor = !state
    ? ''
    : state.stability >= 60
      ? 'text-green-400'
      : state.stability >= 30
        ? 'text-yellow-400'
        : 'text-red-400';

  const exhaustionColor =
    warExhaustion <= 20
      ? 'text-green-400'
      : warExhaustion <= 50
        ? 'text-yellow-400'
        : 'text-red-400';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display">Dynasty &amp; Strategy</h2>
          <p className="text-muted-foreground">
            Manage your war effort and the dynasty's stability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              isDivergent
                ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                : 'bg-slate-500/20 text-slate-300 border-slate-500'
            }
          >
            {isDivergent ? 'Divergent Era' : 'Historical'}
          </Badge>
        </div>
      </div>

      {successionPending && (
        <div className="rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm flex items-center justify-between">
          <span className="text-destructive font-medium">
            Succession is pending — your general has fallen.
          </span>
          <Link to="/succession" className="text-destructive underline font-semibold ml-4">
            Resolve now →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* War Exhaustion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between font-display">
              War Exhaustion
              <Badge
                variant="outline"
                className={
                  warExhaustion <= 20
                    ? 'bg-green-500/20 text-green-300 border-green-500'
                    : warExhaustion <= 50
                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500'
                      : 'bg-red-500/20 text-red-300 border-red-500'
                }
              >
                {warExhaustion <= 20 ? 'Fresh' : warExhaustion <= 50 ? 'Strained' : 'Exhausted'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-bold font-display ${exhaustionColor}`}>{warExhaustion}</span>
              <span className="text-muted-foreground text-sm mb-1">/ 100</span>
            </div>
            <Progress
              value={warExhaustion}
              max={100}
              className={warExhaustion > 50 ? '[&>div]:bg-red-500' : '[&>div]:bg-yellow-500'}
            />
            <p className="text-xs text-muted-foreground">
              High exhaustion penalises battle power. Use <strong>Rest</strong> to recover.
            </p>
          </CardContent>
        </Card>

        {/* Dynasty Stability */}
        {state ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Dynasty Stability
                <Badge
                  variant="outline"
                  className={
                    state.stability >= 60
                      ? 'bg-green-500/20 text-green-300 border-green-500'
                      : state.stability >= 30
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500'
                        : 'bg-red-500/20 text-red-300 border-red-500'
                  }
                >
                  {state.stability >= 60
                    ? 'Stable'
                    : state.stability >= 30
                      ? 'Wavering'
                      : 'Collapsing'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-xs">Stability</p>
                  <p className={`text-2xl font-bold ${stabilityColor}`}>{state.stability}</p>
                  <Progress value={state.stability} max={100} className="mt-1" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Corruption</p>
                  <p className="text-2xl font-bold text-red-400">{state.corruption}</p>
                  <Progress
                    value={state.corruption}
                    max={100}
                    className="mt-1 [&>div]:bg-red-500"
                  />
                </div>
              </div>
              {state.stability < 20 && (
                <p className="text-xs text-red-400 font-medium">
                  ⚠ Dynasty is in collapse phase — act now!
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 text-muted-foreground text-sm">
              Dynasty state unavailable
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action result */}
      {actionResult && (
        <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {actionResult}
        </div>
      )}

      {/* Territory ID for fortify/spy */}
      <Card>
        <CardHeader>
          <CardTitle>Strategic Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">
              Territory ID (required for Fortify &amp; Spy)
            </label>
            <input
              value={territoryId}
              onChange={(e) => setTerritoryId(e.target.value)}
              placeholder="Paste territory _id here"
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {strategyActions.map((action) => {
              const needsTerritory = 'needsTerritory' in action && action.needsTerritory;
              const mut = mutationMap[action.key];
              const busy = mut?.isPending && pendingAction === action.key;
              return (
                <button
                  key={action.key}
                  onClick={() => handleAction(action.key, needsTerritory)}
                  disabled={busy || !!(needsTerritory && !territoryId)}
                  className="text-left rounded-lg border border-border hover:border-primary/50 bg-card hover:bg-accent p-3 transition-colors disabled:opacity-50"
                >
                  <p className="font-medium text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                  {busy && <p className="text-xs text-primary mt-1">Processing…</p>}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
