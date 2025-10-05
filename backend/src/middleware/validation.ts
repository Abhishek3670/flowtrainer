import { Request, Response, NextFunction, RequestHandler } from 'express';
import { validationResult, body } from 'express-validator';
import { logger } from '../utils/logger';

type ValidationChainType = ReturnType<typeof body>;

/**
 * Middleware to handle validation errors
 */
export const validate = (validations: ValidationChainType[]): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Run all validations
      await Promise.all(validations.map(validation => validation.run(req)));

      const errors = validationResult(req);
      
      if (errors.isEmpty()) {
        next();
        return;
      }

      res.status(400).json({
        error: {
          code: 'validation_error',
          message: 'Validation failed',
          details: errors.array().map((err: any) => {
            // Type assertion to any to access the properties
            const error = err as any;
            return {
              param: error.param,
              message: typeof error.msg === 'string' ? error.msg : 'Invalid value',
              location: error.location,
              value: error.value,
            };
          }),
        },
      });
    } catch (error) {
      logger.error('Validation middleware error:', error);
      next(error);
    }
  };
};

/**
 * Middleware to validate object IDs in URL parameters
 */
export const validateObjectId = (paramNames: string | string[]): RequestHandler => {
  const params = Array.isArray(paramNames) ? paramNames : [paramNames];
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const invalidParams = params.filter(
      param => !req.params[param]?.match(/^[0-9a-fA-F]{24}$/)
    );

    if (invalidParams.length > 0) {
      res.status(400).json({
        error: {
          code: 'invalid_parameter',
          message: 'Invalid parameter format',
          details: invalidParams.map(param => ({
            param,
            message: 'Must be a valid MongoDB ObjectId',
          })),
        },
      });
      return;
    }
    
    next();
  };
};
