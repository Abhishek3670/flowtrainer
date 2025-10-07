// Type definitions for external modules

declare module 'cookie-parser' {
  import { RequestHandler } from 'express';
  const cookieParser: (secret?: string | string[] | undefined, options?: any) => RequestHandler;
  export = cookieParser;
}

declare module 'bcrypt' {
  export function hash(data: string | Buffer, saltOrRounds: string | number): Promise<string>;
  export function compare(data: string | Buffer, encrypted: string): Promise<boolean>;
  export function genSalt(rounds: number): Promise<string>;
}

declare module 'express-validator' {
  import { RequestHandler } from 'express';
  
  export function body(fields?: string | string[]): any;
  export function checkSchema(schema: any): RequestHandler[];
  export function validationResult(req: any): {
    isEmpty(): boolean;
    array(): any[];
    mapped(): { [key: string]: any };
    throw(): void;
  };
  
  export const validationResult: any;
  export const check: any;
  export const param: any;
  export const query: any;
  export const header: any;
  export const cookie: any;
  export const buildCheckFunction: (locations: string[]) => any;
  export const matchedData: (req: any, options?: any) => any;
  export const oneOf: (validationChains: any[], message?: any) => any;
  export const sanitize: any;
  export const sanitizeBody: any;
  export const sanitizeCookie: any;
  export const sanitizeParam: any;
  export const sanitizeQuery: any;
  export const checkSchema: (schema: any) => any;
}
