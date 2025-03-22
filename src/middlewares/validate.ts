import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ApiError(400, 'Validation failed', parsed.error.errors));
    }

    req.body = parsed.data;
    next();
  };
