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

export async function buildApp(opts: { logger?: boolean } = {}) {
  const app = Fastify({ logger: opts.logger ?? true });

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  await app.register(cors, { origin: corsOrigin });
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

  return app;
}
