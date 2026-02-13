import fp from 'fastify-plugin';
import { ZodError } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      const message = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return reply.code(400).send({
        statusCode: 400,
        error: 'Validation Error',
        message,
      });
    }

    if (error instanceof NotFoundError) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: error.message,
      });
    }

    if (error instanceof ValidationError) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }

    // Mongoose CastError (invalid ObjectId)
    if (error instanceof Error && error.name === 'CastError') {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid ID format',
      });
    }

    fastify.log.error(error);
    return reply.code(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Something went wrong',
    });
  });
};

export default fp(errorHandlerPlugin, { name: 'errorHandler' });
