# Rise of the General — Technical Documentation

A single-player Three Kingdoms military progression game where you create a character, join a faction, fight simulated battles, earn merit and XP, recruit legendary officers, conquer territories, run campaigns, and climb the military ranks from Recruit to General.

---

## Tech Stack

### Monorepo

| Tool           | Version | Purpose                                |
| -------------- | ------- | -------------------------------------- |
| **pnpm**       | 10.6    | Package manager with workspace support |
| **TypeScript** | 5.7     | Type safety across all packages        |

Three packages connected via `pnpm-workspace.yaml`:

```
rise_of_the_general/
├── apps/server/         @rotg/server   (Fastify API)
├── apps/web/            @rotg/web      (React SPA)
└── packages/shared-types/ @rotg/shared-types (shared interfaces & enums)
```

### Frontend (`apps/web`)

| Library                      | Version | Role                         |
| ---------------------------- | ------- | ---------------------------- |
| **React**                    | 19      | UI framework                 |
| **Vite**                     | 6       | Dev server & bundler         |
| **TailwindCSS**              | 4       | Utility-first CSS            |
| **React Router**             | 7       | Client-side routing          |
| **Zustand**                  | 5       | Client state management      |
| **TanStack Query**           | 5       | Server state / data fetching |
| **Lucide React**             | 0.469   | Icon library                 |
| **Class Variance Authority** | 0.7     | Component variant styling    |
| **clsx + tailwind-merge**    | -       | Conditional class merging    |

UI components built from scratch following shadcn/ui patterns: Button, Card, Badge, Progress, Dialog, Input.

### Backend (`apps/server`)

| Library           | Version | Role                       |
| ----------------- | ------- | -------------------------- |
| **Fastify**       | 5       | HTTP framework             |
| **Mongoose**      | 8       | MongoDB ODM                |
| **Zod**           | 3       | Request validation         |
| **@fastify/jwt**  | 9       | JWT authentication         |
| **@fastify/cors** | 11      | Cross-origin requests      |
| **tsx**           | 4       | TypeScript execution (dev) |
| **Vitest**        | 3       | Unit testing framework     |

Architecture: modular design with `plugins/` (db, auth, errorHandler) and `modules/` (auth, player, battle, faction, rank, item, skill, dynasty, general, army, injury, world, campaign, ai, enemy-general, strategy, dynasty-state). Each module contains its model, service, routes, and schemas.

The battle module has been split into focused sub-engines: `battle.engine.ts` (core power formula), `power.engine.ts` (focused re-export), `enemy.engine.ts` (enemy power stacking), `territory.engine.ts` (capture mechanics), `exhaustion.engine.ts` (war exhaustion penalties).

### Database

| Technology  | Version | Config                                            |
| ----------- | ------- | ------------------------------------------------- |
| **MongoDB** | 7.0     | Via Docker Compose, port 27018, persistent volume |

### Shared Types (`packages/shared-types`)

Zero-dependency package exporting TypeScript interfaces and type aliases consumed by both server and web. Contains:

- **`models.ts`** — 29 interfaces: `IBaseStats`, `IPlayer`, `IFaction`, `IRankDefinition`, `ISkill`, `IItem`, `IBattle`, `IBattleTemplate`, `IPlayerInventory`, `IDynasty`, `IGeneral`, `IPlayerGeneral`, `ISkillEffects`, `IBattleResult`, `IPlayerArmy`, `IPlayerGeneralSlots`, `ISynergyPair`, `IPlayerInjury`, `IPlayerLegacy`, `IPowerBreakdown`, `ITerritory`, `IAiFaction`, `IEnemyGeneral`, `ICampaign`, `IPlayerCampaign`, `IDynastyState`
- **`api.ts`** — Request/response DTOs for all endpoints including full Phase 3 coverage
- **`enums.ts`** — `BattleStatus`, `ItemType`, `ItemRarity`, `SkillType`, `Formation`, `TroopType`, `InjuryType`, `Region`, `CampaignStatus`, `AiAction`, `StrategicActionType`

---

## Features

### 1. Character Creation

Players create an account by choosing a username and selecting one of three factions. Each faction provides different base stat bonuses:

| Faction | Leader   | STR | DEF | STR | SPD | LED |
| ------- | -------- | --- | --- | --- | --- | --- |
| **Wei** | Cao Cao  | +3  | +1  | +2  | +1  | +1  |
| **Shu** | Liu Bei  | +1  | +2  | +1  | +2  | +3  |
| **Wu**  | Sun Quan | +2  | +2  | +3  | +1  | +0  |

- Registration creates a player document, initializes an empty inventory, assigns the starting rank (Recruit), and returns a JWT
- Login is simplified — JWT wraps `{ playerId }` for session persistence
- Frontend uses Zustand with `persist` middleware to store the token in localStorage

### 2. Player Stats & Progression

Every player has 5 core stats, a level, experience, merit, and gold:

- **Strength** — Primary attack power (2x weight in power calculation)
- **Defense** — Damage reduction (1x weight)
- **Strategy** — Tactical bonus (1.5x weight)
- **Speed** — Action priority
- **Leadership** — Command ability (2x weight), required for rank promotion

**Leveling:** XP threshold = `level × 100`. When exceeded, the player levels up and excess XP rolls over.

**Stat growth from battle:** Winning grants +1 to all 5 stats. Losing grants +1 to defense only.

**Stat growth from territory attacks:**

- Winning a territory capture: **+1 Leadership**
- Defeating an enemy general during capture: **+1 additional Leadership** (total +2 on general kill)

**Gold:** Earned by winning battles (equal to the battle's merit reward). Spent recruiting troops.

### 3. Battle System

Battles are server-calculated and resolved instantly. The player picks a battle template, the server assembles a full `BattleContext`, computes the outcome, and returns the result with a detailed power breakdown.

**5 Battle Templates (seeded):**

| Battle           | Difficulty | Enemy Power | Merit | XP  |
| ---------------- | ---------- | ----------- | ----- | --- |
| Village Skirmish | 1          | 30          | 15    | 30  |
| Bandit Raid      | 2          | 55          | 30    | 60  |
| Border Conflict  | 3          | 90          | 60    | 100 |
| Fortress Siege   | 4          | 150         | 100   | 180 |
| Grand Campaign   | 5          | 250         | 200   | 350 |

**Battle flow:**

1. Player selects a template and clicks "Fight"
2. Server gathers all combat data: base stats, equipped item bonuses, active injury penalties, deployed generals, army, synergy bonuses, and legacy multiplier
3. `calculateFinalPower` resolves the full power breakdown
4. If `finalPower >= enemyPower` → victory; otherwise → defeat
5. Rewards applied: full merit + XP + gold on win; 0 merit + 25% XP on loss
6. Stat growth applied (+1 all on win, +1 defense on loss)
7. Level-up check performed
8. Army morale updated (+5 on win, -10 on loss)
9. Active injury `battlesRemaining` decremented; new injury rolled on loss
10. On win: item drop rolled, relationship with generals increased
11. Result returned with `powerBreakdown`, `newInjury`, `moraleChange`, `activeSynergies`, `droppedItem`

**Stuck battle protection:** Any leftover "ongoing" battles are auto-cancelled before a new battle starts.

**Power formula:**

```
effectiveStats  = baseStats + equippedItemBonuses + injuryPenalties   (floored at 0)
basePower       = (STR × 2) + DEF + (STRAT × 1.5) + (LED × 2) + (level × 1.2)
armyBonus       = troopCount × moraleMultiplier
generalBonus    = 1 + Σ(multiplier − 1)  for each deployed general   (additive stacking)
finalPower      = (basePower + armyBonus) × formationMultiplier × generalBonus × synergyMultiplier × legacyBonusMultiplier
```

### 4. Item Drop & Equipment System

Items drop after winning a battle. Drop rates and rarity weights scale with battle difficulty:

**Drop Chances:**

| Difficulty | Drop Rate |
| ---------- | --------- |
| 1          | 30%       |
| 2          | 40%       |
| 3          | 50%       |
| 4          | 60%       |
| 5          | 75%       |

**Rarity Weights:**

| Difficulty | Common | Rare | Epic |
| ---------- | ------ | ---- | ---- |
| 1–2        | 80%    | 18%  | 2%   |
| 3          | 50%    | 40%  | 10%  |
| 4–5        | 20%    | 50%  | 30%  |

**10 Items (seeded):**

| Item               | Type   | Rarity | Bonuses                             |
| ------------------ | ------ | ------ | ----------------------------------- |
| Iron Sword         | Weapon | Common | +3 STR                              |
| Bronze Spear       | Weapon | Common | +4 STR                              |
| Wooden Shield      | Armor  | Common | +3 DEF                              |
| Leather Armor      | Armor  | Common | +4 DEF                              |
| Steel Blade        | Weapon | Rare   | +7 STR, +2 Strategy                 |
| Chain Mail         | Armor  | Rare   | +7 DEF, +2 Strategy                 |
| War Halberd        | Weapon | Rare   | +8 STR, +3 Leadership               |
| Dragon Scale Armor | Armor  | Epic   | +12 DEF, +5 Strategy                |
| Sky Piercer        | Weapon | Epic   | +15 STR, +5 Leadership              |
| Heavenly Robes     | Armor  | Epic   | +10 DEF, +8 Strategy, +5 Leadership |

**Equipment rules:**

- Players can equip 1 weapon and 1 armor simultaneously
- Equipping a new item of the same type auto-unequips the existing one
- Equipped item stat bonuses are applied to the effective stats used in power calculation

Items appear in the Inventory page with color-coded rarity badges and an equip/unequip toggle. When an item drops after battle, it shows an "Item Looted!" notification in the battle result dialog.

### 5. Rank Progression

7 military ranks form a linear promotion chain. Players advance by accumulating merit and leadership:

| Rank               | Tier | Merit Required | Leadership Required | Troop Capacity |
| ------------------ | ---- | -------------- | ------------------- | -------------- |
| Recruit            | 1    | 0              | 0                   | 5              |
| Footman            | 2    | 50             | 5                   | 10             |
| 5-Man Leader       | 3    | 150            | 12                  | 50             |
| 10-Man Leader      | 4    | 400            | 20                  | 100            |
| 100-Man Commander  | 5    | 1,000          | 35                  | 500            |
| 1000-Man Commander | 6    | 2,500          | 55                  | 1,000          |
| General            | 7    | 5,000          | 80                  | 10,000         |

The Rank page shows a visual timeline of all 7 ranks with current progress. When both merit and leadership requirements are met, a "Promote" button becomes available. On promotion, the player's `currentRankId` advances to the next rank in the chain.

### 6. Generals System

15 famous Three Kingdoms officers can be recruited and deployed to contribute power bonuses. Each general belongs to a faction, has unique stats, a rarity tier, and provides a battle power multiplier bonus.

**Relationship Mechanics:**

- Winning battles increases relationship with generals from your faction
- Relationship gain = `2 + (difficulty × 2)` per battle (ranges from +4 to +12)
- 25% chance per battle to gain 1/3 of that amount with a random other-faction general

**Recruitment Requirements:**

- Player must reach the general's required rank tier
- Player must build enough relationship with the general
- Both conditions must be met to recruit

**Deployment:**

- Recruited generals must be explicitly **deployed** to the active slots before they contribute to battle power
- Only deployed generals apply their power multiplier
- Generals can be withdrawn from active slots at any time

**15 Generals (seeded):**

#### Wei Faction

| General    | Title                  | Rarity    | Rank Tier | Relationship | Power Bonus |
| ---------- | ---------------------- | --------- | --------- | ------------ | ----------- |
| Xiahou Dun | The One-Eyed Warrior   | Uncommon  | 2         | 20           | +8%         |
| Xu Chu     | The Tiger Fool         | Uncommon  | 2         | 25           | +10%        |
| Cao Ren    | Defender of Fan Castle | Rare      | 4         | 50           | +15%        |
| Zhang Liao | Terror of Hefei        | Rare      | 4         | 60           | +18%        |
| Sima Yi    | The Hidden Dragon      | Legendary | 6         | 100          | +30%        |

#### Shu Faction

| General     | Title                  | Rarity    | Rank Tier | Relationship | Power Bonus |
| ----------- | ---------------------- | --------- | --------- | ------------ | ----------- |
| Zhao Yun    | The Dragon of Changban | Uncommon  | 2         | 15           | +10%        |
| Huang Zhong | The Veteran Archer     | Uncommon  | 3         | 30           | +8%         |
| Ma Chao     | The Splendid Stallion  | Rare      | 4         | 55           | +15%        |
| Zhang Fei   | The Unbreakable        | Rare      | 5         | 70           | +20%        |
| Guan Yu     | God of War             | Legendary | 6         | 100          | +30%        |

#### Wu Faction

| General   | Title                    | Rarity    | Rank Tier | Relationship | Power Bonus |
| --------- | ------------------------ | --------- | --------- | ------------ | ----------- |
| Taishi Ci | The Duellist             | Uncommon  | 2         | 20           | +8%         |
| Gan Ning  | The Pirate King          | Uncommon  | 3         | 30           | +10%        |
| Lu Meng   | The Scholar General      | Rare      | 4         | 55           | +15%        |
| Lu Xun    | The Young Strategist     | Rare      | 5         | 65           | +18%        |
| Zhou Yu   | The Red Cliffs Commander | Legendary | 6         | 100          | +30%        |

The Generals page displays recruited officers at the top ("Under Your Command") and all available generals below with relationship progress bars, stat breakdowns, rarity badges (color-coded green/blue/yellow), and recruitment buttons.

### 7. General Synergy System

Deploying specific pairs of generals together triggers a synergy bonus that multiplies battle power. Synergies stack multiplicatively.

**6 Synergy Pairs:**

| Synergy Name    | Generals             | Bonus |
| --------------- | -------------------- | ----- |
| Oath Brothers   | Guan Yu + Zhang Fei  | +10%  |
| Wei Strategists | Sima Yi + Zhang Liao | +8%   |
| Wu Fire Masters | Zhou Yu + Lu Xun     | +8%   |
| Shu Vanguard    | Zhao Yun + Ma Chao   | +7%   |
| Wei Vanguard    | Xiahou Dun + Xu Chu  | +7%   |
| Wu Marines      | Lu Meng + Gan Ning   | +6%   |

### 8. Army System

Players can build and manage an army that contributes bonus power in battle. Army creation requires **rank tier 3** or higher.

**Army properties:**

- **Troop Count** — number of soldiers; each costs 10 gold to recruit
- **Morale** — ranges 0–100; increases +5 after a win, decreases -10 after a loss
- **Formation** — affects the formation multiplier applied to total power
- **Troop Type** — infantry, cavalry, or archer (cosmetic for now)

**Formation Multipliers:**

| Formation | Multiplier |
| --------- | ---------- |
| line      | 1.0×       |
| wedge     | 1.1×       |
| phalanx   | 1.15×      |
| skirmish  | 0.9×       |

**Morale Multipliers (applied to army bonus):**

| Morale Range | Multiplier |
| ------------ | ---------- |
| 80–100       | 1.15×      |
| 50–79        | 1.0×       |
| 30–49        | 0.9×       |
| 0–29         | 0.75×      |

**Army bonus formula:** `armyBonus = troopCount × moraleMultiplier`

This bonus is added to `basePower` before applying the formation and general multipliers.

### 9. Injury System

Players can be injured when losing a battle. Active injuries apply negative stat penalties to all subsequent battles until they expire.

**Injury chance:** `5% + (difficulty − 1) × 5%` (5% at difficulty 1, 25% at difficulty 5)

**3 Injury Types:**

| Type       | Stat Penalties           | Duration  |
| ---------- | ------------------------ | --------- |
| wound      | −2 STR, −1 DEF           | 3 battles |
| broken_arm | −3 STR, −2 SPD           | 5 battles |
| fatigue    | −2 SPD, −1 STRAT, −1 LED | 2 battles |

- Multiple injuries stack; all active penalties are summed before power calculation
- `battlesRemaining` decrements by 1 after every battle regardless of outcome
- Injuries with `battlesRemaining = 0` are considered expired and excluded

### 10. War Exhaustion System

Fighting battles accumulates `warExhaustion` (0–100) on the player, representing fatigue from prolonged campaigning.

**Exhaustion changes per battle:**

| Outcome | Base Delta | Casualty Burden |
| ------- | ---------- | --------------- |
| Win     | −5         | +casualties/20  |
| Loss    | +15        | +casualties/10  |

Result is clamped to keep `warExhaustion` within [0, 100].

**Active penalties by exhaustion level:**

| Exhaustion | Injury Chance Bonus | XP Multiplier | Morale Gain Multiplier |
| ---------- | ------------------- | ------------- | ---------------------- |
| 0–69       | +0%                 | ×1.0          | ×1.0                   |
| 70–89      | +10%                | ×0.8          | ×1.0                   |
| 90–100     | +25%                | ×0.6          | ×0.5                   |

Exhaustion is stored on the `Player` document and returned as `exhaustionChange` in every battle response.

---

### 11. World Map & Territory System

18 territories form a connected graph across three regions. Every territory has an owner faction, a strategic value (affects merit bonuses on capture), and a defense rating (scales enemy difficulty).

**Territory regions:**

| Region  | Starting controller | Notable territories           |
| ------- | ------------------- | ----------------------------- |
| North   | Wei                 | Luoyang, Ye, Chang'an         |
| Central | Contested           | Jing Province, Xuzhou, Jianye |
| South   | Shu / Wu            | Yizhou, Hanzhong, Jiangxia    |

**Attacking a territory:**

1. Server builds player power using the full existing pipeline (stats + items + generals + army + synergy + legacy)
2. Exhaustion XP penalty (`xpMultiplier`) is applied to effective power
3. Base enemy power = `defenseRating × 1.5 + strategicValue`, scaled by territory defense multiplier and living enemy general multipliers (additive stacking)
4. Outcome resolved; on **victory**:
   - Territory changes ownership to player's faction
   - Player earns `strategicValue × 5` bonus merit
   - Player earns **+1 Leadership** for commanding a successful capture
   - Defense rating reduced by 40% (floor: 1)
   - A living non-retreating enemy general is permanently defeated
   - If a general was defeated: **+1 additional Leadership** (total +2)
   - Active campaign progress updated automatically
5. Exhaustion delta applied to the player

**World Map UI:**

- Territories grouped by region with defense bar and strategic value badge
- Territories with living enemy generals show an orange border, ⚔️ indicator, and a general details panel
- Attack result shown inline: outcome, merit, **leadership gained**, exhaustion, general defeated
- Active campaign banner shows remaining objectives; yellow warning if no active campaign

**Seeding:** `pnpm seed` restores territory values and revives all enemy generals (`alive: true`).

---

### 12. Enemy Generals System

9 enemy generals are seeded (3 per faction), each assigned to a starting territory. Enemy generals apply direct power multipliers to territory defense using the same additive stacking formula as player generals.

**Multiplier stacking:** `1 + Σ(multiplier − 1)` for all living generals in the territory.

**Seeded enemy generals:**

| General            | Faction | Territory     | Level | Power Mult | Can Retreat |
| ------------------ | ------- | ------------- | ----- | ---------- | ----------- |
| Xu Zhu (enemy)     | Wei     | Luoyang       | 5     | ×1.4       | No          |
| Zhang Liao (enemy) | Wei     | Ye            | 4     | ×1.3       | Yes         |
| Xiahou Dun (enemy) | Wei     | Chang'an      | 3     | ×1.2       | No          |
| Wei Yan (enemy)    | Shu     | Yizhou        | 4     | ×1.3       | No          |
| Ma Chao (enemy)    | Shu     | Hanzhong      | 3     | ×1.2       | Yes         |
| Pang Tong (enemy)  | Shu     | Jing Province | 5     | ×1.5       | Yes         |
| Lu Meng (enemy)    | Wu      | Jianye        | 5     | ×1.4       | No          |
| Gan Ning (enemy)   | Wu      | Jiangxia      | 3     | ×1.2       | No          |
| Taishi Ci (enemy)  | Wu      | Yangzhou      | 4     | ×1.3       | Yes         |

All generals are permanently removed when their territory is captured. Run `pnpm seed` to revive all enemy generals.

---

### 13. AI Faction System

Each of the three factions has an AI configuration that determines behavior when `POST /api/ai/advance` is triggered.

**AI decision rules (evaluated top-down, first match wins):**

1. Player controls >60% of the AI's preferred-region territories → **counterattack** (occupy a neutral territory)
2. `battlesSinceLastTurn >= expansionRate` → **expand** (occupy highest-value neutral territory)
3. Any owned territory has `defenseRating < 5` → **defend** (reinforce weakest territory)
4. `aggression > 70` → **expand**
5. Fallback → **defend**

**Seeded AI configs:**

| Faction | Aggression | Expansion Rate | Preferred Regions |
| ------- | ---------- | -------------- | ----------------- |
| Wei     | 70         | 3              | North, Central    |
| Shu     | 55         | 4              | Central, South    |
| Wu      | 50         | 5              | South, Central    |

All decisions are deterministic (no unbounded randomness). AI turns are explicitly triggered via API — no background timers.

---

### 14. Campaign System

3 campaigns define structured objectives across the territory map. Each campaign has victory conditions for territories captured and enemy generals defeated.

**Seeded campaigns:**

| Campaign                       | Starting Territory | Territories Required | Generals Required |
| ------------------------------ | ------------------ | -------------------- | ----------------- |
| The Northern March             | Runan              | 3                    | 1                 |
| Conquest of the Central Plains | Jing Province      | 5                    | 2                 |
| The Final Unification          | Luoyang            | 10                   | 5                 |

**Campaign flow:**

1. Player starts a campaign via `POST /api/campaigns/start`
2. Only one active campaign at a time is permitted
3. Every territory capture and enemy general defeat during a `world/attack` call automatically updates the active `PlayerCampaign` — no separate step needed
4. Progress readable via `GET /api/campaigns/:playerId/active` — returns `capturedTerritoryNames[]` and `generalsDefeatedLog[]`
5. Victory conditions checked on each attack; campaign transitions `active → won` automatically
6. Campaign banner on World Map page auto-refreshes after each attack

**Campaign UI (Campaigns page):**

- Lists all available campaigns with objectives
- Active campaign card shows progress bars for territories and generals
- 🏴 **Territories Captured** pill badges — one per captured territory name
- ⚔️ **Generals Defeated** pill badges — one per defeated general name

---

### 15. Strategic Actions

Out-of-battle actions let players manage exhaustion, morale, territory defense, and intelligence gathering without fighting.

| Action  | Endpoint                     | Effect                                                             |
| ------- | ---------------------------- | ------------------------------------------------------------------ |
| Rest    | `POST /api/strategy/rest`    | −20 exhaustion; all active injuries tick down by 1                 |
| Drill   | `POST /api/strategy/drill`   | +10 army morale (capped at 100); requires an existing army         |
| Fortify | `POST /api/strategy/fortify` | +5 territory `defenseRating`; player must own the territory        |
| Spy     | `POST /api/strategy/spy`     | Returns all living enemy generals in target + adjacent territories |

---

### 16. Dynasty State

A per-dynasty stability/corruption record reflects the health of the game world.

**Stability events:**

| Event               | Stability Delta |
| ------------------- | --------------- |
| General killed      | −10             |
| Territory lost      | −5              |
| Player dominates    | −15             |
| Territory recovered | +8              |

- When `stability < 50`, corruption increases by 2 per event
- At `stability < 20`, the dynasty enters collapse phase

**Endpoints:**

- `GET /api/dynasty-state/:dynastyId` — get state by dynasty ID
- `GET /api/dynasty-state` — get the most recent dynasty state (no param needed)

---

### 17. Dynasty / Legacy System

Completing the game (reaching rank tier 7) allows the player to "complete a dynasty" and start a new run with a permanent power bonus.

**Dynasty Completion:**

- Requires rank tier 7 (General)
- Awards +5% permanent `powerMultiplier` to the player's legacy record (stacks per dynasty)
- Resets: rank → tier 1, level → 1, experience → 0, merit → 0, stats → starting values, army deleted, all injuries cleared
- **Preserved across resets:** recruited generals, inventory items
- Each completed dynasty is timestamped in `completedAt[]`

**Legacy bonus** is applied as a final multiplier to `finalPower` during battle calculation.

### 18. Authentication & Session

- **Register:** `POST /api/auth/register` — creates player + inventory, returns JWT
- **Login:** `POST /api/auth/login` — finds player by username, returns JWT
- JWT payload: `{ playerId: string }`
- Frontend stores token in Zustand with `persist` middleware (localStorage)
- `AuthGuard` component redirects unauthenticated users to `/create`
- API client (`fetchApi`) attaches `Authorization: Bearer <token>` to all requests; HTTP errors include a `.status` property for typed error handling

### 19. Frontend Pages

| Page      | Route        | Description                                                                           |
| --------- | ------------ | ------------------------------------------------------------------------------------- |
| Create    | `/create`    | Username input + faction selection (3 radio cards)                                    |
| Dashboard | `/dashboard` | Player stats, rank, merit, gold, level progress bars                                  |
| Battle    | `/battle`    | Battle template grid, fight button, result modal with power breakdown                 |
| Rank      | `/rank`      | 7-rank timeline with promotion button                                                 |
| Generals  | `/generals`  | Recruited + available generals with relationship progress, deploy/withdraw            |
| Inventory | `/inventory` | Item grid with rarity-colored badges, equip/unequip toggle                            |
| Army      | `/army`      | Troop recruitment, formation selection, morale display                                |
| World Map | `/world`     | Territory map grouped by region; attack button; general indicators; campaign banner   |
| Campaigns | `/campaigns` | Campaign list; active campaign progress bars; captured territory + general log badges |
| Dynasty   | `/dynasty`   | War exhaustion card; stability/corruption bars; strategic action buttons              |

Layout includes a persistent sidebar with navigation links (Dashboard, Battle, World Map, Campaigns, Dynasty, Rank, Generals, Inventory, Army) and a logout button.

---

## API Endpoints

| Method | Path                                | Auth | Description                        |
| ------ | ----------------------------------- | ---- | ---------------------------------- |
| POST   | `/api/auth/register`                | No   | Create account + player            |
| POST   | `/api/auth/login`                   | No   | Login by username                  |
| GET    | `/api/factions`                     | No   | List all factions                  |
| GET    | `/api/synergies`                    | No   | List all synergy pairs             |
| GET    | `/api/player/:id`                   | Yes  | Get player with rank info          |
| POST   | `/api/player/:id/promote`           | Yes  | Promote player to next rank        |
| GET    | `/api/player/:id/inventory`         | Yes  | Get player inventory               |
| POST   | `/api/player/:id/inventory/equip`   | Yes  | Equip an item                      |
| POST   | `/api/player/:id/inventory/unequip` | Yes  | Unequip an item                    |
| GET    | `/api/player/:id/army`              | Yes  | Get player's army                  |
| POST   | `/api/player/:id/army`              | Yes  | Create army (requires tier 3+)     |
| PATCH  | `/api/player/:id/army/recruit`      | Yes  | Recruit troops (costs gold)        |
| PATCH  | `/api/player/:id/army/formation`    | Yes  | Change formation                   |
| PATCH  | `/api/player/:id/army/troop-type`   | Yes  | Change troop type                  |
| GET    | `/api/player/:id/injuries`          | Yes  | Get active injuries                |
| GET    | `/api/player/:id/generals/active`   | Yes  | Get deployed generals              |
| POST   | `/api/player/:id/generals/deploy`   | Yes  | Deploy a recruited general         |
| POST   | `/api/player/:id/generals/withdraw` | Yes  | Withdraw a deployed general        |
| GET    | `/api/player/:id/synergies/active`  | Yes  | Get active synergy bonuses         |
| GET    | `/api/player/:id/legacy`            | Yes  | Get dynasty legacy record          |
| POST   | `/api/player/:id/dynasty/complete`  | Yes  | Complete dynasty (requires tier 7) |
| GET    | `/api/battle/templates`             | Yes  | List battle templates              |
| POST   | `/api/battle/fight`                 | Yes  | Start and resolve a battle         |
| GET    | `/api/ranks`                        | Yes  | List all rank definitions          |
| GET    | `/api/generals/:id`                 | Yes  | List generals with relations       |
| POST   | `/api/generals/:id/recruit`         | Yes  | Recruit a general                  |
| GET    | `/api/world/map`                    | Yes  | Get full territory map + generals  |
| GET    | `/api/world/territory/:id`          | Yes  | Get territory + enemy generals     |
| POST   | `/api/world/attack`                 | Yes  | Attack a territory                 |
| GET    | `/api/campaigns`                    | Yes  | List all campaigns                 |
| GET    | `/api/campaigns/:playerId/active`   | Yes  | Get active campaign with progress  |
| POST   | `/api/campaigns/start`              | Yes  | Start a campaign                   |
| GET    | `/api/ai/factions`                  | Yes  | List AI faction configs            |
| POST   | `/api/ai/advance`                   | Yes  | Trigger an AI faction turn         |
| GET    | `/api/enemy-generals/territory/:id` | Yes  | Get living enemy generals          |
| POST   | `/api/strategy/rest`                | Yes  | Rest — reduce exhaustion           |
| POST   | `/api/strategy/drill`               | Yes  | Drill troops — boost morale        |
| POST   | `/api/strategy/fortify`             | Yes  | Fortify a territory                |
| POST   | `/api/strategy/spy`                 | Yes  | Spy — reveal enemy generals        |
| GET    | `/api/dynasty-state/:dynastyId`     | Yes  | Get dynasty state by ID            |
| GET    | `/api/dynasty-state`                | Yes  | Get most recent dynasty state      |

---

## Testing

64 unit tests across 6 test files using Vitest. All tests use pure engine functions with factory helpers — no DB, no mocks, fully deterministic.

**`battle.engine.test.ts`** (16 tests):

- `calculateFinalPower` — correct formula with known stats, zero stats, level scaling, general multipliers (additive stacking), injury penalties (negative stats), army bonus and formation multiplier
- `resolveBattleOutcome` — win, tie, loss scenarios
- `calculateCasualties` — equal powers, both zero, proportional
- `calculateRewards` — full win rewards, partial loss rewards
- `calculateStatGrowth` — all stats on win, defense-only on loss

**`rank.engine.test.ts`** (5 tests):

- `checkPromotionEligibility` — eligible, exceeded requirements, insufficient merit, insufficient leadership, merit-first check order

**`enemy.engine.test.ts`** (11 tests):

- `applyEnemyGeneralMultipliers` — empty list, additive stacking, dead generals excluded, all-dead returns 1.0
- `calculateEnemyPower` — defense scaling, no generals baseline, known value, general boost
- `pickPrimaryGeneral` — empty list, all dead, highest multiplier selected

**`territory.engine.test.ts`** (9 tests):

- `calculateCaptureRewardBonus` — scales with strategic value, zero value
- `resolveTerritoryCapture` — new owner assigned, defense rating reduced, minimum floor of 1
- `isCapturable` — same faction returns false, different faction returns true

**`exhaustion.engine.test.ts`** (12 tests):

- `calculateExhaustionDelta` — decreases on win, increases on loss, floor clamp at 0, ceiling clamp at 100, heavy casualties offset recovery, loss delta > win delta
- `applyExhaustionPenalties` — no penalties below 70, moderate at 70–89, severe at 90+, exact boundary values

**`ai.engine.test.ts`** (11 tests):

- `decideAiAction` — counterattack when player dominates, expand on battle threshold, defend on weak territory, expand for high-aggression, defend fallback
- `resolveAiExpansion` — null when no neutrals, preferred region over non-preferred, highest strategic value selected
- `resolveAiReinforcement` — null when no owned, targets lowest defense, positive power boost

---

## Running the Project

```bash
# Install dependencies
pnpm install

# Start MongoDB (Docker)
pnpm db:up

# Seed game data (factions, ranks, items, generals, territories, enemy generals, campaigns, etc.)
# Also revives all enemy generals and restores territory defense/ownership values
pnpm seed

# Start both server (port 3001) and web (port 5173)
pnpm dev

# Run tests
pnpm test

# Build all packages
pnpm build
```

---

## Project Stats

- **Total files:** ~120
- **Mongoose models:** 21 (Dynasty, Faction, Rank, Skill, Item, Player, PlayerInventory, BattleTemplate, Battle, General, PlayerGeneral, PlayerGeneralSlots, PlayerArmy, PlayerInjury, PlayerLegacy, Territory, AiFaction, EnemyGeneral, Campaign, PlayerCampaign, DynastyState)
- **API endpoints:** 43
- **Frontend pages:** 10 (Create, Dashboard, Battle, Rank, Generals, Inventory, Army, World Map, Campaigns, Dynasty)
- **UI components:** 8 (6 base + Layout + AuthGuard)
- **Seeded data:** 1 dynasty, 3 factions, 7 ranks, 5 skills, 5 battle templates, 10 items, 15 player generals, 18 territories, 3 AI configs, 9 enemy generals, 3 campaigns, 1 dynasty state
- **Unit tests:** 118
- **Frontend pages:** 13 (+ Characters, Politics, Dynasty updated)
- **Battle sub-engines:** 5 (`battle`, `power`, `enemy`, `territory`, `exhaustion`)
- **Phase 3 modules:** 6 (`world`, `campaign`, `ai`, `enemy-general`, `strategy`, `dynasty-state`)
- **Phase 4 modules:** 7 (`character`, `loyalty`, `succession`, `politics`, `timeline`, `ai-content`, `endgame`)

---

## Phase 4 — Characters, AI & Political Depth

### 20. Character Module

A rich character layer sits on top of the player-general system. Every significant figure (player, officers, heirs) is modelled as a `Character` with personality traits, loyalty, and an opinion network.

**Character properties:**

- `traits[]` — up to 5 personality tags (e.g. `brave`, `cunning`, `loyal`, `ambitious`, `cautious`)
- `loyaltyScore` — 0–100; drives defection risk and succession eligibility
- `opinionOf{}` — per-character opinion map (−100 to +100)

**Loyalty Engine (`loyalty.engine.ts`):**

- `calculateLoyaltyDelta` — applies event modifiers (battle outcome, gift, betrayal, promotion) to a character's loyalty
- `checkDefectionRisk` — returns `true` when `loyaltyScore < 20 && aggression > 60`
- Loyalty checked after every battle and court action; low-loyalty characters flagged in UI

### 21. Succession System

When a dynasty is completed or a player retires, succession logic selects the next ruler from available heirs.

**Flow:**

1. `resolveSuccession(dynastyId)` — ranks all characters with `role === 'heir'` by loyalty × capability score
2. Highest-scoring heir becomes the new `main` character; others retain `heir` / `officer` roles
3. If no heirs exist, a fallback officer is elevated; if no officers, a random character is generated
4. Succession event emitted → frontend `AuthGuard` intercepts and prompts the player to acknowledge the transition
5. Previous main character archived with a `retiredAt` timestamp

**Succession UI:** Full-page interstitial modal on `/dynasty` when a succession event is pending, showing the incoming heir's name, traits, and loyalty score.

### 22. Court Politics

The `PoliticsCourt` document tracks four dynasty-wide metrics that affect all gameplay:

| Metric     | Effect on gameplay                                           |
| ---------- | ------------------------------------------------------------ |
| Stability  | Low stability increases enemy aggression and event frequency |
| Legitimacy | Affects diplomatic options and officer recruitment speed     |
| Morale     | Multiplier on army morale gain after battles                 |
| Corruption | Reduces gold income; triggers purge events                   |

**Four court actions (3 turns per dynasty cycle):**

| Action     | Effect                           |
| ---------- | -------------------------------- |
| Negotiate  | +Legitimacy, +Stability          |
| Reform     | +Stability, +Legitimacy          |
| Propaganda | +Morale, +Corruption             |
| Purge      | −Corruption, −Morale, −Stability |

**Politics Page (`/politics`):** Court metric bars (Stability, Legitimacy, Morale, Corruption), action buttons with turn counter, action result detail panel, and an **✨ AI Court Event** button that calls `POST /api/ai-content/generate-narrative` with live court context to produce flavour text dispatches.

### 23. Timeline Divergence

The game world exists on a timeline that can shift from its historical course if certain thresholds are crossed. This is a **one-way door** — once the timeline diverges it cannot return to historical.

**Divergence triggers (first match wins):**

| Trigger          | Condition                                  | Effect                            |
| ---------------- | ------------------------------------------ | --------------------------------- |
| Map Dominance    | Player controls >80% of all 18 territories | AI faction aggression jumps to 90 |
| Legendary Kill   | A legendary enemy general is killed        | AI faction aggression jumps to 80 |
| Dynasty Collapse | Dynasty stability falls below 20           | AI faction aggression jumps to 95 |

**What changes on divergence:**

- A new shadow AI faction is created with extreme aggression (80–95) and expansion rate 1
- The dynasty's `timeline` field flips from `historical` to `divergent`
- The Dynasty page header badge changes from "Historical" to "Divergent Era" (amber)

**API:** `GET /api/timeline/:dynastyId` — returns `{ diverged, trigger, newTimelineType, detail }`

Divergence is checked at each relevant game event (territory attack, general kill, dynasty state update). All divergence logic in `timeline.engine.ts` is pure and deterministic.

### 24. AI Infrastructure

A multi-provider AI layer generates dynamic content across four feature areas. All features are individually toggled via environment flags.

**Providers (tried in order):** OpenAI → Anthropic → `null` (graceful fallback)

**Feature flags:**

| Flag           | Default | Used on         | What it generates                                            |
| -------------- | ------- | --------------- | ------------------------------------------------------------ |
| `AI_CAMPAIGNS` | true    | Campaigns page  | Campaign name, description, objectives, estimated difficulty |
| `AI_NARRATIVE` | true    | Battle page     | Post-battle flavour narrative (2–3 sentences)                |
| `AI_EVENTS`    | true    | Politics page   | Court dispatch / political event flavour text                |
| `AI_OFFICERS`  | true    | Characters page | Officer name, backstory, suggested stats and role            |
| `AI_GENERALS`  | true    | World Map page  | Enemy general name (romanized), title, and lore              |

**Endpoints:**

| Method | Path                                  | Description                                 |
| ------ | ------------------------------------- | ------------------------------------------- |
| POST   | `/api/ai-content/generate-campaign`   | Generate a campaign idea for the player     |
| POST   | `/api/ai-content/generate-narrative`  | Generate a battle or event narrative        |
| POST   | `/api/ai-content/generate-officer`    | Suggest a new officer character             |
| POST   | `/api/ai-content/spawn-enemy-general` | AI-spawn one enemy general for a territory  |
| POST   | `/api/ai-content/spawn-all-generals`  | AI-spawn generals for all empty territories |

**`spawn-all-generals` flow:**

1. Queries all territories; skips those already having a living general
2. For each empty territory: computes `level = max(1, round(defenseRating / 15))`
3. Calls `spawnAiEnemyGeneral` sequentially (avoids API rate limits)
4. Returns `{ spawned, skipped, results[] }`
5. Frontend invalidates `['worldMap']` query on success → territory cards refresh immediately

**Name safety:** The enemy general prompt explicitly requests romanized ASCII names. A CJK character strip (`/[\u3000-\u9fff\uac00-\ud7af]/g`) is applied to parsed names as a safety net.

### 25. Frontend Pages (Phase 4)

| Page       | Route         | AI Feature wired                                          |
| ---------- | ------------- | --------------------------------------------------------- |
| Characters | `/characters` | ✨ AI Suggest Officer — generates name, backstory, stats  |
| Politics   | `/politics`   | ✨ AI Court Event — narrative dispatch from court state   |
| Campaigns  | `/campaigns`  | ✨ AI Campaign Idea — name, description, objectives       |
| Battle     | `/battle`     | Auto AI narrative after every fight (victory/defeat)      |
| World Map  | `/world`      | ✨ AI Spawn All Generals — single button, all territories |

### 26. Test Suite — Phase 4 Additions

54 new unit tests added across 5 test files (total: 118):

**`succession.test.ts`** — heir ranking, fallback elevation, no-heir case\
**`loyalty.test.ts`** — delta calculation, defection threshold, gift/betrayal events\
**`politics.test.ts`** — court action deltas, turn depletion, corruption overflow\
**`timeline.test.ts`** — era lookup by merit, difficulty modifier application, boundary conditions\
**`ai.validators.test.ts`** — Zod schema validation for all five AI draft schemas
