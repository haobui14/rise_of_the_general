import fp from 'fastify-plugin';
import mongoose from 'mongoose';
import type { FastifyPluginAsync } from 'fastify';

const dbPlugin: FastifyPluginAsync = async (fastify) => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27018/rise_of_the_general';

  try {
    await mongoose.connect(uri);
    fastify.log.info('Connected to MongoDB');
  } catch (err) {
    fastify.log.error(err, 'Failed to connect to MongoDB');
    throw err;
  }

  fastify.addHook('onClose', async () => {
    await mongoose.disconnect();
    fastify.log.info('Disconnected from MongoDB');
  });
};

export default fp(dbPlugin, { name: 'db' });
