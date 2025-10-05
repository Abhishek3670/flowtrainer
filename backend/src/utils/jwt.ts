import jwt from 'jsonwebtoken';
import { UserData } from '../types/express/index';
import logger from './logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Log JWT configuration (without revealing the secret)
logger.info('JWT Configuration', {
  secretConfigured: !!process.env.JWT_SECRET,
  accessTokenExpiry: ACCESS_TOKEN_EXPIRY,
  refreshTokenExpiry: REFRESH_TOKEN_EXPIRY
});

type TokenPayload = {
  sub: string;
  role: string;
  permissions: string[];
};

export const generateTokens = (user: UserData) => {
  try {
    logger.info('Generating tokens for user', { userId: user.id });
    
    const payload: TokenPayload = {
      sub: user.id,
      role: user.role,
      permissions: user.permissions,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'flowtrainer-api',
      audience: 'flowtrainer-web',
    });

    const refreshToken = jwt.sign(
      { sub: user.id },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    logger.info('Tokens generated successfully', { userId: user.id });
    
    return { accessToken, refreshToken };
  } catch (error) {
    logger.error('Token generation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: user.id
    });
    throw error;
  }
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    logger.info('Verifying access token');
    return jwt.verify(token, JWT_SECRET, {
      audience: 'flowtrainer-web',
      issuer: 'flowtrainer-api',
    }) as TokenPayload;
  } catch (error) {
    logger.error('Access token verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
};

export const verifyRefreshToken = (token: string): { sub: string } => {
  try {
    logger.info('Verifying refresh token');
    return jwt.verify(token, JWT_SECRET) as { sub: string };
  } catch (error) {
    logger.error('Refresh token verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error('Invalid refresh token');
  }
};