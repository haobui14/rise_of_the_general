# Rise of the General — Technical Documentation

A single-player Three Kingdoms military progression game where you create a character, join a faction, fight simulated battles, earn merit and XP, recruit legendary officers, and climb the military ranks from Recruit to General.

---

## Tech Stack

### Monorepo

| Tool          | Version | Purpose                                     |
|---------------|---------|---------------------------------------------|
| **pnpm**      | 10.6    | Package manager with workspace support      |
| **TypeScript** | 5.7    | Type safety across all packages             |

Three packages connected via `pnpm-workspace.yaml`:

```
rise_of_the_general/
├── apps/server/         @rotg/server   (Fastify API)
├── apps/web/            @rotg/web      (React SPA)
└── packages/shared-types/ @rotg/shared-types (shared interfaces & enums)
```

### Frontend (`apps/web`)

| Library               | Version | Role                          |
|-----------------------|---------|-------------------------------|
| **React**             | 19      | UI framework                  |
| **Vite**              | 6       | Dev server & bundler          |
| **TailwindCSS**       | 4       | Utility-first CSS             |
| **React Router**      | 7       | Client-side routing           |
| **Zustand**           | 5       | Client state management       |
| **TanStack Query**    | 5       | Server state / data fetching  |
| **Lucide React**      | 0.469   | Icon library                  |
| **Class Variance Authority** | 0.7 | Component variant styling  |
| **clsx + tailwind-merge** | -   | Conditional class merging     |

UI components built from scratch following shadcn/ui patterns: Button, Card, Badge, Progress, Dialog, Input.

### Backend (`apps/server`)

| Library           | Version | Role                          |
|-------------------|---------|-------------------------------|
| **Fastify**       | 5       | HTTP framework                |
| **Mongoose**      | 8       | MongoDB ODM                   |
| **Zod**           | 3       | Request validation            |
| **@fastify/jwt**  | 9       | JWT authentication            |
| **@fastify/cors** | 11      | Cross-origin requests         |
| **tsx**           | 4       | TypeScript execution (dev)    |
| **Vitest**        | 3       | Unit testing framework        |

Architecture: modular design with `plugins/` (db, auth, errorHandler) and `modules/` (auth, player, battle, faction, rank, item, skill, dynasty, general). Each module contains its model, service, routes, and schemas.

### Database

| Technology | Version | Config                                      |
|------------|---------|---------------------------------------------|
| **MongoDB**| 7.0     | Via Docker Compose, port 27018, persistent volume |

### Shared Types (`packages/shared-types`)

Zero-dependency package exporting TypeScript interfaces and type aliases consumed by both server and web. Contains:

- **`models.ts`** — 14 interfaces: `IBaseStats`, `IPlayer`, `IFaction`, `IRankDefinition`, `ISkill`, `IItem`, `IBattle`, `IBattleTemplate`, `IPlayerInventory`, `IDynasty`, `IGeneral`, `IPlayerGeneral`, `ISkillEffects`, `IBattleResult`
- **`api.ts`** — Request/response DTOs for all endpoints
- **`enums.ts`** — `BattleStatus`, `ItemType`, `ItemRarity`, `SkillType`

---

## Features

### 1. Character Creation

Players create an account by choosing a username and selecting one of three factions. Each faction provides different base stat bonuses:

| Faction | Leader    | STR | DEF | STR | SPD | LED |
|---------|-----------|-----|-----|-----|-----|-----|
| **Wei** | Cao Cao   | +3  | +1  | +2  | +1  | +1  |
| **Shu** | Liu Bei   | +1  | +2  | +1  | +2  | +3  |
| **Wu**  | Sun Quan  | +2  | +2  | +3  | +1  | +0  |

- Registration creates a player document, initializes an empty inventory, assigns the starting rank (Recruit), and returns a JWT
- Login is simplified — JWT wraps `{ playerId }` for session persistence
- Frontend uses Zustand with `persist` middleware to store the token in localStorage

### 2. Player Stats & Progression

Every player has 5 core stats, a level, experience, merit, and gold:

- **Strength** — Primary attack power (2x weight in power calculation)
- **Defense** — Damage reduction (1x weight)
- **Strategy** — Tactical bonus (1.5x weight)
- **Speed** — Action priority (not yet used in power calc)
- **Leadership** — Command ability (2x weight), required for rank promotion

**Power formula:**
```
power = (strength × 2) + defense + (strategy × 1.5) + (leadership × 2) + (level × 1.2)
```

**Leveling:** XP threshold = `level × 100`. When exceeded, the player levels up and excess XP rolls over.

**Stat growth:** Winning a battle grants +1 to all 5 stats. Losing grants +1 to defense only.

### 3. Battle System

Battles are server-calculated and resolved instantly. The player picks a battle template, the server computes the outcome deterministically, and returns the result.

**5 Battle Templates (seeded):**

| Battle            | Difficulty | Enemy Power | Merit | XP  |
|-------------------|------------|-------------|-------|-----|
| Village Skirmish  | 1          | 30          | 15    | 30  |
| Bandit Raid       | 2          | 55          | 30    | 60  |
| Border Conflict   | 3          | 90          | 60    | 100 |
| Fortress Siege    | 4          | 150         | 100   | 180 |
| Grand Campaign    | 5          | 250         | 200   | 350 |

**Battle flow:**
1. Player selects a template and clicks "Fight"
2. Server calculates player power using the formula above
3. If `playerPower >= enemyPower` → victory; otherwise → defeat
4. Rewards are applied: full merit + XP on win; 0 merit + 25% XP on loss
5. Stat growth applied (+1 all on win, +1 defense on loss)
6. Level-up check performed
7. On win: item drop rolled, relationship with generals increased
8. Result returned to frontend and displayed in a modal

**Stuck battle protection:** Any leftover "ongoing" battles are auto-cancelled before a new battle starts.

### 4. Item Drop System

Items can drop after winning a battle. Drop rates and rarity weights scale with battle difficulty:

**Drop Chances:**

| Difficulty | Drop Rate |
|------------|-----------|
| 1          | 30%       |
| 2          | 40%       |
| 3          | 50%       |
| 4          | 60%       |
| 5          | 75%       |

**Rarity Weights:**

| Difficulty | Common | Rare | Epic |
|------------|--------|------|------|
| 1–2        | 80%    | 18%  | 2%   |
| 3          | 50%    | 40%  | 10%  |
| 4–5        | 20%    | 50%  | 30%  |

**10 Items (seeded):**

| Item               | Type   | Rarity | Bonuses                              |
|--------------------|--------|--------|--------------------------------------|
| Iron Sword         | Weapon | Common | +3 STR                               |
| Bronze Spear       | Weapon | Common | +4 STR                               |
| Wooden Shield      | Armor  | Common | +3 DEF                               |
| Leather Armor      | Armor  | Common | +4 DEF                               |
| Steel Blade        | Weapon | Rare   | +7 STR, +2 Strategy                  |
| Chain Mail         | Armor  | Rare   | +7 DEF, +2 Strategy                  |
| War Halberd        | Weapon | Rare   | +8 STR, +3 Leadership                |
| Dragon Scale Armor | Armor  | Epic   | +12 DEF, +5 Strategy                 |
| Sky Piercer        | Weapon | Epic   | +15 STR, +5 Leadership               |
| Heavenly Robes     | Armor  | Epic   | +10 DEF, +8 Strategy, +5 Leadership  |

Items appear in the inventory page with color-coded rarity badges. When an item drops after battle, it shows an "Item Looted!" notification in the battle result dialog.

### 5. Rank Progression

7 military ranks form a linear promotion chain. Players advance by accumulating merit and leadership:

| Rank               | Tier | Merit Required | Leadership Required | Troop Capacity |
|--------------------|------|---------------|---------------------|----------------|
| Recruit            | 1    | 0             | 0                   | 5              |
| Footman            | 2    | 50            | 5                   | 10             |
| 5-Man Leader       | 3    | 150           | 12                  | 50             |
| 10-Man Leader      | 4    | 400           | 20                  | 100            |
| 100-Man Commander  | 5    | 1,000         | 35                  | 500            |
| 1000-Man Commander | 6    | 2,500         | 55                  | 1,000          |
| General            | 7    | 5,000         | 80                  | 10,000         |

The Rank page shows a visual timeline of all 7 ranks with current progress. When both merit and leadership requirements are met, a "Promote" button becomes available. On promotion, the player's `currentRankId` advances to the next rank in the chain.

### 6. Generals System

15 famous Three Kingdoms officers can be recruited to serve under your command. Each general belongs to a faction, has unique stats, a rarity tier, and provides a battle power multiplier bonus.

**Relationship Mechanics:**
- Winning battles increases relationship with generals from your faction
- Relationship gain = `2 + (difficulty × 2)` per battle (ranges from +4 to +12)
- 25% chance per battle to gain 1/3 of that amount with a random other-faction general

**Recruitment Requirements:**
- Player must reach the general's required rank tier
- Player must build enough relationship with the general
- Both conditions must be met to recruit

**15 Generals (seeded):**

#### Wei Faction
| General      | Title                    | Rarity    | Rank Tier | Relationship | Power Bonus |
|-------------|--------------------------|-----------|-----------|-------------|-------------|
| Xiahou Dun  | The One-Eyed Warrior     | Uncommon  | 2         | 20          | +8%         |
| Xu Chu      | The Tiger Fool           | Uncommon  | 2         | 25          | +10%        |
| Cao Ren     | Defender of Fan Castle   | Rare      | 4         | 50          | +15%        |
| Zhang Liao  | Terror of Hefei          | Rare      | 4         | 60          | +18%        |
| Sima Yi     | The Hidden Dragon        | Legendary | 6         | 100         | +30%        |

#### Shu Faction
| General      | Title                    | Rarity    | Rank Tier | Relationship | Power Bonus |
|-------------|--------------------------|-----------|-----------|-------------|-------------|
| Zhao Yun    | The Dragon of Changban   | Uncommon  | 2         | 15          | +10%        |
| Huang Zhong | The Veteran Archer       | Uncommon  | 3         | 30          | +8%         |
| Ma Chao     | The Splendid Stallion    | Rare      | 4         | 55          | +15%        |
| Zhang Fei   | The Unbreakable          | Rare      | 5         | 70          | +20%        |
| Guan Yu     | God of War               | Legendary | 6         | 100         | +30%        |

#### Wu Faction
| General      | Title                    | Rarity    | Rank Tier | Relationship | Power Bonus |
|-------------|--------------------------|-----------|-----------|-------------|-------------|
| Taishi Ci   | The Duellist             | Uncommon  | 2         | 20          | +8%         |
| Gan Ning    | The Pirate King          | Uncommon  | 3         | 30          | +10%        |
| Lu Meng     | The Scholar General      | Rare      | 4         | 55          | +15%        |
| Lu Xun      | The Young Strategist     | Rare      | 5         | 65          | +18%        |
| Zhou Yu     | The Red Cliffs Commander | Legendary | 6         | 100         | +30%        |

The Generals page displays recruited officers at the top ("Under Your Command") and all available generals below with relationship progress bars, stat breakdowns, rarity badges (color-coded green/blue/yellow), and recruitment buttons.

### 7. Authentication & Session

- **Register:** `POST /api/auth/register` — creates player + inventory, returns JWT
- **Login:** `POST /api/auth/login` — finds player by username, returns JWT
- JWT payload: `{ playerId: string }`
- Frontend stores token in Zustand with `persist` middleware (localStorage)
- `AuthGuard` component redirects unauthenticated users to `/create`
- API client (`fetchApi`) attaches `Authorization: Bearer <token>` to all requests

### 8. Frontend Pages

| Page        | Route         | Description                                              |
|-------------|---------------|----------------------------------------------------------|
| Create      | `/create`     | Username input + faction selection (3 radio cards)        |
| Dashboard   | `/dashboard`  | Player stats, rank, merit, gold, level progress bars      |
| Battle      | `/battle`     | Battle template grid, fight button, result modal          |
| Rank        | `/rank`       | 7-rank timeline with promotion button                     |
| Generals    | `/generals`   | Recruited + available generals with relationship progress  |
| Inventory   | `/inventory`  | Item grid with rarity-colored badges and equipped status   |

Layout includes a persistent sidebar with navigation links and a logout button.

---

## API Endpoints

| Method | Path                          | Auth | Description                    |
|--------|-------------------------------|------|--------------------------------|
| POST   | `/api/auth/register`          | No   | Create account + player        |
| POST   | `/api/auth/login`             | No   | Login by username              |
| GET    | `/api/factions`               | No   | List all factions              |
| GET    | `/api/player/:id`             | Yes  | Get player with rank info      |
| POST   | `/api/player/:id/promote`     | Yes  | Promote player to next rank    |
| GET    | `/api/player/:id/inventory`   | Yes  | Get player inventory           |
| GET    | `/api/battle/templates`       | Yes  | List battle templates          |
| POST   | `/api/battle/fight`           | Yes  | Start and resolve a battle     |
| GET    | `/api/ranks`                  | Yes  | List all rank definitions      |
| GET    | `/api/generals/:playerId`     | Yes  | List generals with relations   |
| POST   | `/api/generals/:id/recruit`   | Yes  | Recruit a general              |

---

## Testing

16 unit tests across 2 test files using Vitest:

**`battle.engine.test.ts`** (11 tests):
- `calculatePlayerPower` — correct formula, zero stats, level scaling
- `resolveBattleOutcome` — win, tie, loss scenarios
- `calculateCasualties` — equal powers, both zero, proportional
- `calculateRewards` — full win rewards, partial loss rewards
- `calculateStatGrowth` — all stats on win, defense-only on loss

**`rank.engine.test.ts`** (5 tests):
- `checkPromotionEligibility` — eligible, exceeded requirements, insufficient merit, insufficient leadership, merit-first check order

---

## Running the Project

```bash
# Install dependencies
pnpm install

# Start MongoDB (Docker)
pnpm db:up

# Seed game data (factions, ranks, items, generals, etc.)
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

- **Total files:** ~60
- **Mongoose models:** 9 (Dynasty, Faction, Rank, Skill, Item, Player, PlayerInventory, BattleTemplate, Battle, General, PlayerGeneral)
- **API endpoints:** 11
- **Frontend pages:** 6
- **UI components:** 8 (6 base + Layout + AuthGuard)
- **Seeded data:** 1 dynasty, 3 factions, 7 ranks, 5 skills, 5 battle templates, 10 items, 15 generals
- **Unit tests:** 16
