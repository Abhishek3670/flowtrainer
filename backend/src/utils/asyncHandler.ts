// backend/src/utils/asyncHandler.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Wraps async route handlers and forwards errors to Express error handler
export function asyncHandler<TReq extends Request = Request, TRes extends Response = Response>(
  fn: (req: TReq, res: TRes, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as TReq, res as TRes, next)).catch(next);
  };
}