import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  useCharacters,
  useCreateCharacter,
  useSetActiveCharacter,
  usePromoteToHeir,
} from '@/hooks/useCharacters';
import { useGenerateOfficer } from '@/hooks/useAiContent';
import type { IPlayerCharacter } from '@rotg/shared-types';
import { GeneralPortrait } from '@/components/canvas/GeneralPortrait';
import { motion } from 'framer-motion';

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${(value / 15) * 100}%` }}
        />
      </div>
      <span className="w-5 text-right text-muted-foreground">{value}</span>
    </div>
  );
}

function LoyaltyBar({ value, label }: { value: number; label: string }) {
  const color = value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-5 text-right text-muted-foreground">{value}</span>
    </div>
  );
}

function CharacterCard({
  character,
  isActive,
  onSetActive,
  onPromoteHeir,
}: {
  character: IPlayerCharacter;
  isActive: boolean;
  onSetActive: () => void;
  onPromoteHeir: () => void;
}) {
  const roleBadgeColor: Record<string, string> = {
    main: 'bg-amber-500/20 text-amber-400',
    heir: 'bg-blue-500/20 text-blue-400',
    officer: 'bg-slate-500/20 text-slate-400',
    advisor: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}
      className={`rounded-xl border p-4 space-y-3 transition-colors ${
        isActive ? 'border-primary bg-primary/5 shadow-[0_0_12px_rgba(212,160,23,0.08)]' : 'border-border bg-card'
      }`}
    >
      <div className="flex items-start gap-3">
        <GeneralPortrait name={character.name} size="sm" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm font-display">{character.name}</h3>
            {isActive && (
              <span className="text-xs text-primary font-medium px-2 py-0.5 bg-primary/10 rounded-full">Commander</span>
            )}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 inline-block ${roleBadgeColor[character.role] ?? 'bg-slate-500/20 text-slate-400'}`}>
            {character.role}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <LoyaltyBar value={character.loyalty} label="Loyalty" />
        <LoyaltyBar value={character.ambition} label="Ambition" />
      </div>

      <div className="space-y-1">
        <StatBar label="STR" value={character.stats.strength} />
        <StatBar label="DEF" value={character.stats.defense} />
        <StatBar label="STR" value={character.stats.strategy} />
        <StatBar label="SPD" value={character.stats.speed} />
        <StatBar label="LED" value={character.stats.leadership} />
      </div>

      <div className="flex gap-2 pt-1">
        {!isActive && (
          <button
            onClick={onSetActive}
            className="flex-1 text-xs py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Set as Commander
          </button>
        )}
        {character.role !== 'heir' && character.role !== 'main' && (
          <button
            onClick={onPromoteHeir}
            className="flex-1 text-xs py-1.5 rounded-md border border-border hover:bg-accent transition-colors"
          >
            Promote to Heir
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function CharactersPage() {
  const playerId = useAuthStore((s) => s.playerId);
  const { data, isLoading, error } = useCharacters(playerId);
  const createCharacter = useCreateCharacter();
  const setActive = useSetActiveCharacter();
  const promoteHeir = usePromoteToHeir();
  const generateOfficer = useGenerateOfficer();

  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'main' | 'heir' | 'officer' | 'advisor'>('officer');
  const [aiDraft, setAiDraft] = useState<{ name: string; backstory: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  if (isLoading) return <div className="text-muted-foreground animate-pulse">Gathering your officers…</div>;
  if (error) return <div className="text-destructive">Failed to load characters.</div>;

  const characters = data?.characters ?? [];
  const activeId = data?.activeCharacterId ?? null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!playerId || !newName.trim()) return;
    await createCharacter.mutateAsync({ playerId, name: newName.trim(), role: newRole });
    setNewName('');
  }

  async function handleGenerateOfficer() {
    if (!playerId) return;
    setAiError(null);
    setAiDraft(null);
    try {
      const draft = await generateOfficer.mutateAsync({ playerId, role: 'officer' });
      setAiDraft({ name: draft.name, backstory: draft.backstory });
    } catch (err: any) {
      if (err?.status === 503) {
        setAiError(
          'AI is unavailable. Check that OPENAI_API_KEY and AI_OFFICERS=true are set in server .env.',
        );
      } else {
        setAiError(err?.message || 'AI suggestion failed. Please try again.');
      }
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-display">Officers & Characters</h1>
        <p className="text-muted-foreground text-sm mt-1">
          The <strong>active commander</strong>'s stats add a bonus in every battle (×0.2 weight on
          all stats). On dynasty completion they retire and the designated <strong>Heir</strong>{' '}
          takes command via succession.
        </p>
      </div>

      {/* Roster */}
      {characters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
          No characters yet. Create one below.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((c) => (
            <CharacterCard
              key={c._id}
              character={c}
              isActive={c._id === activeId}
              onSetActive={() => playerId && setActive.mutate({ playerId, characterId: c._id })}
              onPromoteHeir={() => playerId && promoteHeir.mutate({ playerId, characterId: c._id })}
            />
          ))}
        </div>
      )}

      {/* Create character form */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Recruit New Character</h2>

        {aiError && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
            {aiError}
          </div>
        )}

        {aiDraft && (
          <div className="rounded-lg bg-muted/40 border border-border p-4 text-sm space-y-1">
            <p className="font-medium text-sm">AI Suggested Officer: {aiDraft.name}</p>
            <p className="text-muted-foreground text-xs">{aiDraft.backstory}</p>
            <button
              type="button"
              onClick={() => setNewName(aiDraft.name)}
              className="mt-2 text-xs text-primary underline"
            >
              Use this name
            </button>
          </div>
        )}

        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Character name"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
              required
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as typeof newRole)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm sm:w-32"
            >
              <option value="officer">Officer</option>
              <option value="advisor">Advisor</option>
              <option value="heir">Heir</option>
              <option value="main">Main</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={createCharacter.isPending}
              className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {createCharacter.isPending ? 'Creating...' : 'Create Character'}
            </button>
            <button
              type="button"
              onClick={handleGenerateOfficer}
              disabled={generateOfficer.isPending}
              className="flex-1 py-2 rounded-md border border-border text-sm hover:bg-accent disabled:opacity-50"
            >
              {generateOfficer.isPending ? 'Generating...' : '✨ AI Suggest Officer'}
            </button>
          </div>

          {createCharacter.isError && (
            <p className="text-destructive text-xs">
              {(createCharacter.error as any)?.message ?? 'Failed to create character.'}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
