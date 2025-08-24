import { Request } from 'express-serve-static-core';
import { ParamsDictionary } from 'express-serve-static-core';

export interface AuthenticatedRequest<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: {
    userId: string;
    email: string;
    role?: string;
  };
}

import { Types } from 'mongoose';

export interface IWorkflow {
  title: string;
  description?: string;
  nodes: Array<any>;
  edges: Array<any>;
  ownerId: Types.ObjectId;
  collaborators: Types.ObjectId[];
  isPublic: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface INode {
  id: string;
  type: string;
  data: any;
  position: {
    x: number;
    y: number;
  };
}

export interface IEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: any;
}

export interface IUser {
  email: string;
  password?: string;
  profile?: {
    name?: string;
    avatar?: string;
    preferences?: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;
}
