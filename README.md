# 🏯 Rise of the General (MVP)

Single-player historical military progression game inspired by:

- Three Kingdoms period
- Structured ranking progression (inspired by Kingdom-style hierarchy)
- Simplified Dynasty Warriors-style character growth

Player starts as a peasant and rises through military ranks by earning merit in battle.

---

# 📌 MVP Objective

Build a playable backend + frontend where a player can:

- Create a character
- Select a faction
- Fight simulated battles
- Earn merit & experience
- Get promoted through ranks
- Manage inventory

No real-time combat in MVP.

All battles are server-calculated.

---

# 🧱 Tech Stack (Latest Stable 2026)

## Frontend

- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Zustand (state management)
- TanStack Query (server state)
- TailwindCSS
- shadcn/ui (component system)

## Backend

- Node.js 20+
- Fastify (recommended over Express)
- TypeScript
- MongoDB 7+
- Mongoose 8+
- Zod (validation)
- JWT (auth)
- Redis (optional caching, phase 2)

## DevOps

- Docker
- Docker Compose
- ESLint 9
- Prettier 3
- Husky 10
- GitHub Actions CI/CD

---

# 🏗 Architecture

```
apps/
  web/            (Next.js frontend)
  server/         (Fastify backend)

packages/
  shared-types/   (shared TypeScript types)

docker-compose.yml
```

Architecture pattern:

- Frontend calls backend REST API
- Backend handles all game logic
- Battle simulation runs server-side
- MongoDB stores persistent state
- Redis (optional) for caching battle sessions

---

# 🗄 Database Design

All collections must be versionable and expandable.

---

## dynasties

```ts
{
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  createdAt: Date;
}
```

---

## factions

```ts
{
  dynastyId: ObjectId;
  name: string;
  leaderName: string;
  baseBonus: {
    strength: number;
    defense: number;
    strategy: number;
    speed: number;
    leadership: number;
  }
}
```

---

## rank_definitions

```ts
{
  title: string
  tier: number
  requiredMerit: number
  requiredLeadership: number
  maxTroopCommand: number
  unlockSkills: ObjectId[]
  nextRankId: ObjectId | null
}
```

Ranks to seed:

1. Recruit
2. Footman
3. 5-Man Leader
4. 10-Man Leader
5. 100-Man Commander
6. 1000-Man Commander
7. General

---

## skills

```ts
{
  name: string
  type: "active" | "passive"
  effects: {
    strengthBonus?: number
    moraleBoost?: number
    defenseBonus?: number
  }
  unlockTier: number
}
```

---

## items

```ts
{
  name: string
  type: "weapon" | "armor"
  rarity: "common" | "rare" | "epic"
  statBonus: {
    strength?: number
    defense?: number
    strategy?: number
    leadership?: number
  }
}
```

---

## players

```ts
{
  username: string;
  dynastyId: ObjectId;
  factionId: ObjectId;
  currentRankId: ObjectId;
  level: number;
  experience: number;
  merit: number;
  gold: number;
  stats: {
    strength: number;
    defense: number;
    strategy: number;
    speed: number;
    leadership: number;
  }
  isAlive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## player_inventory

```ts
{
  playerId: ObjectId
  items: [
    {
      itemId: ObjectId
      equipped: boolean
    }
  ]
}
```

---

## battle_templates

```ts
{
  name: string;
  difficulty: number;
  enemyPower: number;
  meritReward: number;
  expReward: number;
}
```

---

## battles

```ts
{
  playerId: ObjectId;
  templateId: ObjectId;
  enemyPower: number;
  status: "ongoing" | "won" | "lost";
  result: {
    meritGained: number;
    expGained: number;
    casualties: number;
  }
  startedAt: Date;
  endedAt: Date;
}
```

---

# ⚔ Battle Engine Logic

All battle logic must be server-side.

## Player Power Formula

```
playerPower =
  (strength * 2) +
  defense +
  (strategy * 1.5) +
  (leadership * 2) +
  (level * 1.2)
```

If:

```
playerPower >= enemyPower
```

→ Win

Else:
→ Loss

Casualties calculated as percentage difference.

Battle must:

- Update merit
- Update experience
- Update player stats
- Persist battle record

Never trust client stats.

---

# 🏅 Promotion Logic

Promotion requires:

```
player.merit >= requiredMerit
AND
player.stats.leadership >= requiredLeadership
```

Promotion endpoint:

POST `/api/player/:id/promote`

Promotion must:

- Validate eligibility
- Update currentRankId
- Unlock new skill tier
- Return updated player

---

# 🌐 API Design

All endpoints RESTful.

---

## Player

POST `/api/player`
Create new player

GET `/api/player/:id`
Fetch player

POST `/api/player/:id/promote`
Attempt promotion

---

## Battle

GET `/api/battle/templates`
List available battles

POST `/api/battle/start`
Create battle instance

POST `/api/battle/:id/resolve`
Resolve battle and update player

---

# 📦 Seed Script

Create:

```
server/scripts/seedGameData.ts
```

Seed:

- 1 dynasty (Three Kingdoms)
- 3 factions (Wei, Shu, Wu)
- 7 ranks
- 5 battle templates
- 10 items
- 5 skills

Must be idempotent.

---

# 🧠 Backend Structure

```
server/
  src/
    modules/
      player/
      battle/
      rank/
      faction/
      dynasty/
      skill/
      item/
    plugins/
      db.ts
      redis.ts
    utils/
    app.ts
    server.ts
```

Use:

- Fastify plugin architecture
- Zod for request validation
- Centralized error handler

---

# 🎨 Frontend Pages (MVP)

```
/app
  /dashboard
  /battle
  /rank
  /inventory
```

Dashboard shows:

- Stats
- Current Rank
- Merit
- Available Battles

---

# 🔐 Security Rules

- All validation server-side
- JWT required for protected routes
- No stat changes from client
- No battle resolution on client

---

# 🧪 Testing

Backend:

- Vitest
- Supertest

Test:

- Battle resolution logic
- Promotion eligibility
- Player creation

---

# 🚀 Definition of Done (MVP)

MVP is complete when:

- User can create player
- Join faction
- Start battle
- Resolve battle
- Gain merit
- Get promoted
- View updated stats

No crashes.
No inconsistent state.
All logic validated server-side.

---

# 🔮 Phase 2 Roadmap

- Army morale system
- Injury system
- Named rival officers
- Dynasty progression
- Territory map
