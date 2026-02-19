# Phase 5: Romance Layer — Implementation Plan

## Context

Phase 5 adds a **Romance of the Three Kingdoms** layer on top of the existing Phases 1–4 simulation. It introduces sworn brotherhoods, destiny, legendary duels, moral alignment, omens, mythic items, and a romance-mode toggle — all opt-in, bounded, deterministic, and non-breaking to existing systems. The spec lives in `PHASE_5_ROMANCE_LAYER.md`.

---

## Implementation Order (dependency-driven)

1. **Romance Mode Toggle** — every other module checks this flag
2. **Morality** — extends PlayerCharacter, no Phase 5 deps
3. **Destiny** — extends PlayerCharacter, needed by Duel & Omens
4. **Omens** — depends on Destiny (reveals it)
5. **Mythic Items** — extends Item model, needed by Duel
6. **Brotherhood** — new collection, needs Morality for context
7. **Duel** — depends on Destiny, Mythic Items, Brotherhood
8. **AI Romance Content** — extends existing ai-content module
9. **Seed Data** — mythic items + sample omens
10. **Tests** — 60+ tests across 6 new test files
11. **Frontend Pages & Hooks** — Brotherhood page, Duel page, modified existing pages

---

## Step 1: Romance Mode Toggle

Add `romanceMode: boolean` to the Player model. Every Phase 5 route/logic checks this flag.

**Files to modify:**
- `packages/shared-types/src/models.ts` — add `romanceMode: boolean` to `IPlayer`
- `packages/shared-types/src/api.ts` — add `ToggleRomanceModeRequest/Response`
- `apps/server/src/modules/player/player.model.ts` — add field `romanceMode: { type: Boolean, default: false }`
- `apps/server/src/modules/player/player.routes.ts` — add `PATCH /api/player/:playerId/romance-mode`

---

## Step 2: Morality System

Extend `PlayerCharacter` with morality axes (not a new collection). The existing `ambition` field on PlayerCharacter is for betrayal; morality axes are separate.

**New file:** `apps/server/src/modules/morality/morality.engine.ts`
- `calculateMoralityDelta(action) → { benevolence, righteousness, moralAmbition }`
- `applyMoralityDelta(current, delta) → MoralitySnapshot` (clamped 0–100)
- `checkMoralFracture(morality, action) → MoralFractureType | null`
- `getMoralityTitle(morality) → string`

**Files to modify:**
- `packages/shared-types/src/enums.ts` — add `MoralFractureType`
- `packages/shared-types/src/models.ts` — add optional `morality?: { benevolence, righteousness, moralAmbition }` and `moralFractures?: string[]` to `IPlayerCharacter`
- `apps/server/src/modules/character/character.model.ts` — add morality subdoc + moralFractures array

---

## Step 3: Destiny System

Add `destiny` and `destinyRevealed` fields to PlayerCharacter.

**New file:** `apps/server/src/modules/destiny/destiny.engine.ts`
- `rollInitialDestiny() → DestinyType` (30% heaven-favored, 30% doomed, 40% unknown)
- `getDestinyProbabilityModifier(destiny) → number` (+0.1 / -0.1 / 0)
- `shouldRevealDestiny(omenType, character) → boolean`

**Files to modify:**
- `packages/shared-types/src/enums.ts` — add `DestinyType = 'heaven-favored' | 'doomed' | 'unknown'`
- `packages/shared-types/src/models.ts` — add `destiny?: DestinyType` and `destinyRevealed?: boolean` to `IPlayerCharacter`
- `apps/server/src/modules/character/character.model.ts` — add fields with defaults

---

## Step 4: Omens System

New collection — omens are world events, not character properties.

**New files:**
- `apps/server/src/modules/omen/omen.model.ts`
- `apps/server/src/modules/omen/omen.engine.ts`
- `apps/server/src/modules/omen/omen.service.ts`
- `apps/server/src/modules/omen/omen.routes.ts`

**Schema (`IOmen`):**
```ts
{ dynastyId, type: OmenType, title, description, effect: { stabilityDelta, moraleDelta, destinyRevealCharacterId? }, resolved, createdAt }
```

**Engine functions:**
- `shouldOmenOccur(ctx) → boolean` — probability scales with low stability / high corruption
- `rollOmenType(ctx) → OmenType`
- `generateOmenEffects(type) → { stabilityDelta, moraleDelta }`

**Routes:** `GET /api/omens/:dynastyId`, `POST /api/omens/:dynastyId/trigger`, `POST /api/omens/:omenId/resolve`

**Integration:** Resolving an omen applies deltas to `CourtState` and may set `destinyRevealed = true` on a character.

---

## Step 5: Mythic Items

Extend the existing Item model — mythic items share all regular item fields plus mythic-specific ones.

**Files to modify:**
- `packages/shared-types/src/enums.ts` — extend `ItemRarity` to include `'mythic'`
- `packages/shared-types/src/models.ts` — add to `IItem`: `isMythic?, boundToCharacterId?, duelBonus?: { strengthMultiplier, destinyInteraction? }, lore?`
- `apps/server/src/modules/item/item.model.ts` — extend schema with mythic fields
- Inventory service — enforce: max 1 mythic per character, once equipped `boundToCharacterId` is set permanently

---

## Step 6: Brotherhood System

New collection for sworn brotherhoods (max 3 members, bond levels 1–5).

**New files:**
- `apps/server/src/modules/brotherhood/brotherhood.model.ts`
- `apps/server/src/modules/brotherhood/brotherhood.engine.ts`
- `apps/server/src/modules/brotherhood/brotherhood.service.ts`
- `apps/server/src/modules/brotherhood/brotherhood.routes.ts`

**Schema (`IBrotherhood`):**
```ts
{ playerId, name, memberCharacterIds[], bondLevel (1-5), bondExperience, jointSkillUnlocked, createdAt }
```

**Engine functions:**
- `calculateBrotherhoodPowerBonus(bondLevel, membersInBattle) → number` (5%–25%)
- `checkBondLevelUp(snapshot) → { leveledUp, newLevel }`
- `calculateBondExpGain(outcome, membersInBattle) → number`
- `calculateJointSkillEffect(memberStats[]) → { powerBoost, description }`

**Routes:** `GET /api/brotherhood/:playerId`, `POST /api/brotherhood/:playerId`, `POST /api/brotherhood/:id/add`, `DELETE /api/brotherhood/:id/remove`

**Battle integration:** Add `brotherhoodBonus` to `BattleContext` and `calculateFinalPower`:
```
finalPower = (basePower + armyBonus) * formation * generals * synergy * legacy * brotherhoodBonus
```

**Critical files to modify:**
- `apps/server/src/modules/battle/battle.engine.ts` — add `brotherhoodBonus` to `BattleContext` and power formula
- `apps/server/src/modules/battle/battle.service.ts` — load brotherhood data when `romanceMode` is on, pass to context

---

## Step 7: Duel System

New module — completely separate resolution path from battles.

**New files:**
- `apps/server/src/modules/duel/duel.model.ts`
- `apps/server/src/modules/duel/duel.engine.ts`
- `apps/server/src/modules/duel/duel.service.ts`
- `apps/server/src/modules/duel/duel.routes.ts`
- `apps/server/src/modules/duel/duel.schema.ts`

**Schema (`IDuel`):**
```ts
{ playerId, challengerCharacterId, opponentName, opponentStats, trigger, outcome, rounds[], rewardMerit, rewardExp, narration?, createdAt }
```

**Duel power formula (bypasses army):**
```
duelPower = (STR*3 + DEF*1.5 + SPD*2 + STRAT*1 + LED*0.5) * destinyMod * mythicWeaponMult * brotherhoodBonus
```

**Engine functions:**
- `calculateDuelPower(stats, destiny, mythicBonus, brotherhoodLevel) → number`
- `resolveDuel(ctx) → { outcome, rounds[], merit, exp }`
- `canTriggerDuel(romanceMode, trigger) → boolean`

**Routes:** `POST /api/duel/challenge`, `GET /api/duel/:playerId`, `GET /api/duel/:duelId`

All duel routes return 403 if `romanceMode === false`.

---

## Step 8: AI Romance Content

Extend existing `ai-content/` module with 4 new generators.

**Files to modify:**
- `apps/server/src/modules/ai-content/ai-content.routes.ts` — add 4 routes
- `apps/server/src/modules/ai-content/ai-content.service.ts` — add 4 generation functions
- `apps/server/src/modules/ai-content/validators.ts` — add Zod schemas for oath/duel/omen/legend narration
- `apps/server/src/modules/ai-content/client.ts` — add feature flags `AI_OATHS`, `AI_DUELS`, `AI_OMENS`, `AI_LEGENDS`

**New routes:**
- `POST /api/ai-content/generate-oath-narration`
- `POST /api/ai-content/generate-duel-narration`
- `POST /api/ai-content/generate-omen`
- `POST /api/ai-content/generate-legend`

---

## Step 9: Seed Data

**Modify:** `apps/server/scripts/seedGameData.ts`

- **6 mythic items** (2 per faction): Green Dragon Crescent Blade, Serpent Spear, Sword of Heaven, Sky Scorcher Bow, Mandate of Heaven Armor, Burning Phoenix Robes
- **8 template omens**: comets, prophecies, dreams, heavenly signs with predefined stability/morale deltas

---

## Step 10: Tests (60+ new tests)

All in `apps/server/src/__tests__/`:

| File | Tests |
|------|-------|
| `brotherhood.engine.test.ts` | ~12 — power bonus by bond level, bond XP, level-up, joint skill |
| `destiny.engine.test.ts` | ~8 — roll distribution, probability modifiers, reveal conditions |
| `duel.engine.test.ts` | ~15 — duel power, resolution, rounds, destiny/mythic/brotherhood interaction |
| `morality.engine.test.ts` | ~10 — deltas, clamping, fracture checks, titles |
| `omen.engine.test.ts` | ~8 — occurrence probability, type rolling, effect generation |
| `romance-integration.engine.test.ts` | ~7 — brotherhood bonus in battle, destiny modifier, romance mode off = no bonuses |

---

## Step 11: Frontend

**New pages:**
- `apps/web/src/pages/BrotherhoodPage.tsx` — create/manage sworn brotherhoods, bond level display
- `apps/web/src/pages/DuelPage.tsx` — challenge interface, round-by-round replay, history

**New hooks:**
- `apps/web/src/hooks/useBrotherhood.ts`
- `apps/web/src/hooks/useDuel.ts`
- `apps/web/src/hooks/useOmens.ts`

**Modified pages:**
- `DashboardPage.tsx` — romance mode toggle switch
- `CharactersPage.tsx` — morality bars, destiny badge (if revealed)
- `InventoryPage.tsx` — mythic item styling, bound indicator
- `BattlePage.tsx` — brotherhood bonus in power breakdown, duel challenge button (romance mode only)

**Route registration:** Add Brotherhood, Duel, Omen to sidebar nav + `apps/web/src/App.tsx` routes.

---

## Step 12: Route Registration

**Modify:** `apps/server/src/app.ts` — register 3 new route plugins:
```ts
await app.register(brotherhoodRoutes);
await app.register(duelRoutes);
await app.register(omenRoutes);
```

---

## Verification

1. `pnpm test` — all 178+ tests pass (118 existing + 60 new)
2. `pnpm build` — no type errors across monorepo
3. `pnpm seed` — mythic items + omens seeded
4. Manual: toggle romance mode on Dashboard, verify duels/omens/brotherhood available
5. Manual: toggle romance mode off, verify Phase 5 features hidden/disabled
6. Manual: create brotherhood, fight battles, verify bond XP gain and power bonus in breakdown
7. Manual: trigger duel, verify round-by-round resolution
8. Manual: trigger omen, verify stability/morale delta applied to court state
