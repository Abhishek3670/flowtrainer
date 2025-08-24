import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { IUser } from '../types';

/**
 * Type definition for authenticated requests in the application.
 * Extends the base Express Request with additional user and type information.
 */
export interface AuthenticatedRequest<
  P extends ParamsDictionary = ParamsDictionary,
  ResBody = any,
  ReqBody = any
> extends Request<P, ResBody, ReqBody> {
  user?: {
    userId: string;
    email: string;
    role?: string;
  };
  body: ReqBody;
}
