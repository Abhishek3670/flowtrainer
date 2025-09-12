// backend/src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';

export type Validator = (req: Request) => void | string | Promise<void | string>;

export function validateRequest(
  validator: Validator | Validator[]
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const validators = Array.isArray(validator) ? validator : [validator];
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      for (const v of validators) {
        const result = await v(req);
        if (typeof result === 'string') {
          res.status(400).json({ error: result });
          return;
        }
      }
      next();
      return;
    } catch (err) {
      next(err);
      return;
    }
  };
}