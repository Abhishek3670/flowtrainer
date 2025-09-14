import jwt from 'jsonwebtoken';
import { UserData } from '../types/express/index';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

type TokenPayload = {
  sub: string;
  role: string;
  permissions: string[];
};

export const generateTokens = (user: UserData) => {
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

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      audience: 'flowtrainer-web',
      issuer: 'flowtrainer-api',
    }) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
};

export const verifyRefreshToken = (token: string): { sub: string } => {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};
