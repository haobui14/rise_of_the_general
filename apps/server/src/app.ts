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

  return app;
}
