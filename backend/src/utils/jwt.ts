import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import type { UserDocument } from '../models/user.model';
import type { AccessTokenClaims } from '../types/auth';
import { ApiError } from './api-error';

const ISSUER = 'Lily-resume-api';
const AUDIENCE = 'Lily-resume-client';

function expirationInSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) throw new Error('Invalid JWT expiration configuration');
  const amount = Number(match[1]);
  const multiplier = { s: 1, m: 60, h: 3600, d: 86_400 }[match[2] as 's' | 'm' | 'h' | 'd'];
  return amount * multiplier;
}

export function createAccessToken(user: Pick<UserDocument, 'id' | 'tokenVersion'>): string {
  const claims: AccessTokenClaims = { tokenVersion: user.tokenVersion };
  return jwt.sign(claims, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: user.id,
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: expirationInSeconds(env.JWT_EXPIRES_IN),
  });
}

export function verifyAccessToken(token: string): JwtPayload & AccessTokenClaims {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    if (typeof payload === 'string' || !payload.sub || !Number.isInteger(payload.tokenVersion)) {
      throw new Error('Invalid token claims');
    }
    return payload as JwtPayload & AccessTokenClaims;
  } catch {
    throw new ApiError(401, 'Invalid or expired authentication token');
  }
}
