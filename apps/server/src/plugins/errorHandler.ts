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

    // Type guard to ensure error is an Error object
    const err = error instanceof Error ? error : new Error(String(error));

    if (err.name === 'NotFoundError') {
      return reply.code(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: err.message,
      });
    }

    if (err.name === 'ConflictError') {
      return reply.code(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: err.message,
      });
    }

    if (err.name === 'ForbiddenError') {
      return reply.code(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: err.message,
      });
    }

    if (err.name === 'ValidationError' && !(err as any).errors) {
      // Our custom ValidationError (not Mongoose's)
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: err.message,
      });
    }

    // Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid ID format',
      });
    }

    // Mongoose ValidationError (has .errors property)
    if (err.name === 'ValidationError' && (err as any).errors) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: err.message,
      });
    }

    fastify.log.error({ err, name: err.name, message: err.message }, 'Unhandled error');
    return reply.code(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
  });
};

export default fp(errorHandlerPlugin, { name: 'errorHandler' });
