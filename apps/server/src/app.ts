import Fastify from 'fastify';
import cors from '@fastify/cors';
import dbPlugin from './plugins/db.js';
import authPlugin from './plugins/auth.js';
import errorHandlerPlugin from './plugins/errorHandler.js';
import { playerRoutes } from './modules/player/player.routes.js';
import { battleRoutes } from './modules/battle/battle.routes.js';
import { factionRoutes } from './modules/faction/faction.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { rankRoutes } from './modules/rank/rank.routes.js';
import { inventoryRoutes } from './modules/player/inventory.routes.js';
import { generalRoutes } from './modules/general/general.routes.js';
import { armyRoutes } from './modules/army/army.routes.js';
import { injuryRoutes } from './modules/injury/injury.routes.js';
import { dynastyRoutes } from './modules/dynasty/dynasty.routes.js';
// Phase 3
import { worldRoutes } from './modules/world/world.routes.js';
import { campaignRoutes } from './modules/campaign/campaign.routes.js';
import { aiRoutes } from './modules/ai/ai.routes.js';
import { enemyGeneralRoutes } from './modules/enemy-general/enemy-general.routes.js';
import { strategyRoutes } from './modules/strategy/strategy.routes.js';
import { dynastyStateRoutes } from './modules/dynasty-state/dynasty-state.routes.js';
// Phase 4
import { characterRoutes } from './modules/character/character.routes.js';
import { loyaltyRoutes } from './modules/loyalty/loyalty.routes.js';
import { successionRoutes } from './modules/succession/succession.routes.js';
import { politicsRoutes } from './modules/politics/court.routes.js';
import { timelineRoutes } from './modules/timeline/timeline.routes.js';
import { aiContentRoutes } from './modules/ai-content/ai-content.routes.js';
import { duelRoutes } from './modules/duel/duel.routes.js';
import { brotherhoodRoutes } from './modules/brotherhood/brotherhood.routes.js';
import { omenRoutes } from './modules/omen/omen.routes.js';

export async function buildApp(opts: { logger?: boolean } = {}) {
  const app = Fastify({ logger: opts.logger ?? true });

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  await app.register(cors, {
    origin: corsOrigin,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  await app.register(dbPlugin);
  await app.register(authPlugin);
  await app.register(errorHandlerPlugin);

  // Health check endpoint
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Public routes (no auth required)
  await app.register(authRoutes);
  await app.register(factionRoutes);

  // Protected routes
  await app.register(playerRoutes);
  await app.register(battleRoutes);
  await app.register(rankRoutes);
  await app.register(inventoryRoutes);
  await app.register(generalRoutes);
  await app.register(armyRoutes);
  await app.register(injuryRoutes);
  await app.register(dynastyRoutes);

  // Phase 3 routes
  await app.register(worldRoutes);
  await app.register(campaignRoutes);
  await app.register(aiRoutes);
  await app.register(enemyGeneralRoutes);
  await app.register(strategyRoutes);
  await app.register(dynastyStateRoutes);

  // Phase 4 routes
  await app.register(characterRoutes);
  await app.register(loyaltyRoutes);
  await app.register(successionRoutes);
  await app.register(politicsRoutes);
  await app.register(timelineRoutes);
  await app.register(aiContentRoutes);

  // Phase 5 routes
  await app.register(omenRoutes);
  await app.register(brotherhoodRoutes);
  await app.register(duelRoutes);

  return app;
}
