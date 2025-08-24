import { Request } from 'express';
import { Document, Types } from 'mongoose';

// User interfaces
export type PublicUser = Omit<IUserBase, 'password'>;

export interface IUserBase {
    email: string;
    password: string;
    profile?: {
        name?: string;
        avatar?: string;
        preferences?: Record<string, any>;
    };
}

export interface IUser extends IUserBase {
    _id?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

// Workflow interfaces
export interface IWorkflowBase {
    title: string;
    description?: string;
    ownerId: Types.ObjectId;
    collaborators: Types.ObjectId[];
    nodes: INode[];
    edges: IEdge[];
    isPublic: boolean;
    version: number;
}

export interface IWorkflow extends IWorkflowBase {
    _id?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUserBase {
    email: string;
    password: string;
    profile?: {
        name?: string;
        avatar?: string;
        preferences?: Record<string, any>;
    };
}

export interface IUser extends IUserBase {
    _id?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface INode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: any;
    result?: any;
}

export interface IEdge {
    id: string;
    source: string;
    target: string;
}



export interface AuthUser {
    userId: string;
    email: string;
    role?: string;
    // Optional fields that may be populated later
    _id?: Types.ObjectId;
    username?: string;
}

export interface AuthenticatedRequest extends Request {
    user?: AuthUser;
}

export const TYPES = {
    Logger: Symbol.for('Logger'),
    FileService: Symbol.for('FileService'),
    WorkflowService: Symbol.for('WorkflowService'),
    ProjectService: Symbol.for('ProjectService'),
    FileController: Symbol.for('FileController')
};
