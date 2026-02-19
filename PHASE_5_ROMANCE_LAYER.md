# Rise of the General — Phase 5

## Romance of the Three Kingdoms (Legend, Fate & Myth Layer)

Phase 5 introduces **Romance-inspired legendary mechanics**: sworn brotherhoods, destiny events, heroic duels, divine omens, and moral alignment.

This phase intentionally blends **history + myth**, reflecting *Romance of the Three Kingdoms* without breaking deterministic gameplay.

---

## Phase 5 Goals

1. Sworn brotherhood & oath mechanics
2. Destiny & fate system
3. Legendary duels & hero moments
4. Moral alignment (Ren / Yi / Ambition)
5. Mythic items & omens
6. Romance-mode toggle (Historical vs Romance)

Still **single-player only**.

---

## Core Design Rules (Phase 5)

* Romance systems are **opt-in**
* All effects are **bounded and deterministic**
* No mechanic invalidates Phase 1–4 systems
* Myth amplifies characters, not numbers blindly
* All randomness is **seeded and replayable**

---

# 27. Sworn Brotherhood System (桃园结义)

### New Collection: `sworn_brotherhoods`

```ts
{
  _id: ObjectId
  name: string
  memberCharacterIds: ObjectId[]   // max 3
  oathType: "brotherhood" | "vassalage"
  bondLevel: number               // 1–5
  createdAt: Date
}
```

### Formation Rules

* Requires:
  * Loyalty >= 70 between all members
  * No conflicting ambitions
* Max 3 members (Romance canon)
* Brotherhood is **permanent unless betrayal or death**

### Brotherhood Bonuses

| Bond Level | Effect                       |
| ---------- | ---------------------------- |
| 1          | +5% power when together      |
| 3          | Share morale effects         |
| 5          | Unlock legendary joint skill |

### Example Legendary Skill

> **"Oath of the Peach Garden"**
> Once per campaign, prevents defeat when all brothers fight together.

---

# 28. Destiny & Fate System (天命)

### New Field on Character

```ts
destiny: "heaven-favored" | "doomed" | "unknown"
```

### Destiny Assignment

* Determined at character creation or major story events
* Destiny is **hidden initially**
* Revealed through:
  * Omens
  * AI narrative events
  * Legendary encounters

### Destiny Effects

| Destiny        | Effect                                    |
| -------------- | ----------------------------------------- |
| Heaven-favored | Reduced death chance, higher loyalty gain |
| Doomed         | Higher ambition, higher betrayal risk     |
| Unknown        | No modifier                               |

Destiny **nudges probabilities**, never guarantees outcomes.

---

# 29. Legendary Duel System (单挑)

Inspired by iconic ROTK duels (Guan Yu vs Hua Xiong, etc.)

### Duel Trigger Conditions

* Two legendary characters present
* Both have morale >= 70
* Romance Mode enabled

### Duel Resolution Engine

```ts
resolveLegendaryDuel(attackerId, defenderId): DuelResult
```

### Duel Outcomes

| Result  | Effect                           |
| ------- | -------------------------------- |
| Victory | Enemy general defeated instantly |
| Draw    | Both injured, morale shock       |
| Defeat  | Severe injury, possible retreat  |

Duels bypass army calculations but **respect stats, destiny, and traits**.

---

# 30. Moral Alignment System (仁义 vs 权谋)

### New Moral Axis on Character

```ts
morality: {
  benevolence: number   // Ren (仁)
  righteousness: number // Yi (义)
  ambition: number
}
```

### Effects

| High Value    | Gameplay Impact                    |
| ------------- | ---------------------------------- |
| Benevolence   | Loyalty stability, fewer betrayals |
| Righteousness | Brotherhood bonuses, morale        |
| Ambition      | Faster rise, higher betrayal risk  |

### Moral Conflicts

Certain actions cause **moral fractures**:

* Executing surrendered generals
* Breaking oaths
* Betraying allies

These trigger Romance events and long-term consequences.

---

# 31. Omens & Mythic Events

### New Collection: `omens`

```ts
{
  type: "comet" | "prophecy" | "dream" | "heavenly-sign"
  severity: number
  affectedCharacters: ObjectId[]
  revealed: boolean
}
```

### Examples

* Red comet over capital -> stability -10
* Prophetic dream -> destiny revealed
* Earthquake -> morale shock

Omens are **narrative-driven but engine-resolved**.

---

# 32. Mythic Weapons & Relics

Inspired by Romance artifacts (Green Dragon Crescent Blade, etc.)

### New Item Type

```ts
type: "mythic"
```

### Rules

* One mythic item per character
* Cannot be traded
* Bound on equip

### Example

| Item               | Effect               |
| ------------------ | -------------------- |
| Green Dragon Blade | +10% duel win chance |
| Serpent Spear      | +5 STR, +5 ambition  |

---

# 33. Romance Mode Toggle

### New Player Setting

```ts
romanceMode: boolean
```

### Mode Differences

| System       | Historical | Romance  |
| ------------ | ---------- | -------- |
| Duels        | Disabled   | Enabled  |
| Destiny      | Hidden     | Active   |
| Omens        | Minimal    | Frequent |
| Mythic Items | Disabled   | Enabled  |

Switching mode does **not invalidate saves**.

---

# 34. AI Romance Content Generator

AI expands Romance flavor **without touching mechanics**.

### AI Roles (Romance Only)

| Feature           | Output                 |
| ----------------- | ---------------------- |
| Oath narration    | Brotherhood ceremonies |
| Duel narration    | Dramatic duel text     |
| Omens             | Prophetic language     |
| Character legends | Hero biographies       |

### AI Safety Rules

* AI generates **text only**
* All numbers come from engine
* Zod validation enforced

---

# 35. Testing — Phase 5

Add tests for:

* Brotherhood bonus stacking
* Destiny modifier bounds
* Duel outcome determinism
* Moral drift over actions
* Romance toggle compatibility

Target:

* +60 tests
* No flaky tests
* Seeded RNG for all Romance events

---

# 36. Phase 5 Modules Added

```
brotherhood/
destiny/
duel/
morality/
omens/
mythic-items/
romance-mode/
```

---

# Explicit Non-Goals (Phase 5)

* Magic spells
* Supernatural units
* Immortal characters
* Non-historical factions

Romance flavor != fantasy RPG.

---

# Phase 5 Definition of Done

Phase 5 is complete when:

* Sworn brotherhoods alter gameplay
* Duels feel legendary but fair
* Destiny influences outcomes subtly
* Moral choices matter long-term
* Romance Mode enriches replayability
* Game remains deterministic and testable

---

# Copilot Readiness Verdict (Phase 5)

- Clear schemas
- Bounded mechanics
- Deterministic engines
- Romance flavor layered safely
- AI text-only generation

---

## Phase 6 Preview (Optional)

* Historical what-if timelines
* Playable antagonists (Cao Cao perspective)
* Chronicle mode (AI-written dynasty history)
* Player-authored legends
