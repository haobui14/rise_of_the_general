import fp from 'fastify-plugin';
import { ZodError } from 'zod';
import type { FastifyPluginAsync } from 'fastify';

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

    if (error.name === 'NotFoundError') {
      return reply.code(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: error.message,
      });
    }

    if (error.name === 'ValidationError' && !(error as any).errors) {
      // Our custom ValidationError (not Mongoose's)
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }

    // Mongoose CastError (invalid ObjectId)
    if (error.name === 'CastError') {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid ID format',
      });
    }

    // Mongoose ValidationError (has .errors property)
    if (error.name === 'ValidationError' && (error as any).errors) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }

    fastify.log.error({ err: error, name: error.name, message: error.message }, 'Unhandled error');
    return reply.code(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    });
  });
};

export default fp(errorHandlerPlugin, { name: 'errorHandler' });
