/**
 * Input Validation Middleware
 * Request payload validation
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler';
import { isValidUUID, isValidProfileName, isValidKeywords } from '../../../../shared/utils/validators';

export const validateProfileCreate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, keywords, entities, region, mode } = req.body;

  if (!name || !isValidProfileName(name)) {
    throw new AppError('Invalid profile name (3-50 characters required)', 400);
  }

  if (!keywords || !isValidKeywords(keywords)) {
    throw new AppError('Invalid keywords (1-20 keywords required)', 400);
  }

  if (!Array.isArray(entities) || entities.length === 0) {
    throw new AppError('At least one entity is required', 400);
  }

  if (!region || typeof region !== 'string') {
    throw new AppError('Region is required', 400);
  }

  if (!['quantity', 'quality'].includes(mode)) {
    throw new AppError('Mode must be "quantity" or "quality"', 400);
  }

  next();
};

export const validateUUID = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];

    if (!id || !isValidUUID(id)) {
      throw new AppError(`Invalid ${paramName} format`, 400);
    }

    next();
  };
};

export const validateRunRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { profileId, requestTime } = req.body;

  if (!profileId || !isValidUUID(profileId)) {
    throw new AppError('Invalid profileId', 400);
  }

  if (requestTime) {
    const timestamp = new Date(requestTime);
    if (isNaN(timestamp.getTime())) {
      throw new AppError('Invalid requestTime format', 400);
    }
  }

  next();
};
