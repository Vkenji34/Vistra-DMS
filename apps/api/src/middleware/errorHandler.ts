import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  if (err instanceof ZodError) {
    const details: Record<string, unknown> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      details[path] = e.message;
    });

    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.join(', ') || 'field';
      res.status(409).json({
        code: 'DUPLICATE_ENTRY',
        message: `A record with this ${field} already exists`,
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Record not found',
      });
      return;
    }
  }

  const statusCode = 500;
  res.status(statusCode).json({
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production'
      ? 'An internal error occurred'
      : String(err),
  });
}
