import type { Request, Response, CookieOptions } from 'express';
import type { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface GuestConversationTokenPayload {
  type: 'guest_chat';
  conversationId: string;
  sessionId: string;
}

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'shopfeshen_auth';
const AUTH_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const GUEST_CHAT_TOKEN_EXPIRES_IN: jwt.SignOptions['expiresIn'] = '30d';
type SupportedSameSite = NonNullable<CookieOptions['sameSite']>;

const parseCookieHeader = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((cookies, part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex === -1) {
        return cookies;
      }

      const key = decodeURIComponent(part.slice(0, separatorIndex).trim());
      const value = decodeURIComponent(part.slice(separatorIndex + 1).trim());
      cookies[key] = value;
      return cookies;
    }, {});
};

const getCookieSameSite = (): SupportedSameSite => {
  const configuredValue = process.env.AUTH_COOKIE_SAME_SITE?.trim().toLowerCase();
  if (configuredValue === 'strict' || configuredValue === 'lax' || configuredValue === 'none') {
    return configuredValue;
  }

  // Cross-site frontend/backend deployments like Vercel + Render require SameSite=None.
  return process.env.NODE_ENV === 'production' ? 'none' : 'lax';
};

const getCookieOptions = (): CookieOptions => {
  const sameSite = getCookieSameSite();

  return {
    httpOnly: true,
    sameSite,
    secure: sameSite === 'none' || process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE_MS
  };
};

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }
  return secret;
};

export const validateSecurityConfig = (): void => {
  getJwtSecret();
};

export const signAuthToken = (payload: AuthTokenPayload): string =>
  jwt.sign(payload, getJwtSecret(), { expiresIn: AUTH_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'] });

export const signGuestConversationToken = (payload: GuestConversationTokenPayload): string =>
  jwt.sign(payload, getJwtSecret(), { expiresIn: GUEST_CHAT_TOKEN_EXPIRES_IN });

export const verifyGuestConversationToken = (token: string): GuestConversationTokenPayload => {
  const decoded = jwt.verify(token, getJwtSecret()) as Partial<GuestConversationTokenPayload>;

  if (
    decoded.type !== 'guest_chat' ||
    typeof decoded.conversationId !== 'string' ||
    typeof decoded.sessionId !== 'string'
  ) {
    throw new Error('Invalid guest conversation token');
  }

  return {
    type: 'guest_chat',
    conversationId: decoded.conversationId,
    sessionId: decoded.sessionId
  };
};

export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());
};

export const clearAuthCookie = (res: Response): void => {
  const { maxAge: _maxAge, ...cookieOptions } = getCookieOptions();
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions);
};

export const getTokenFromRequest = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  const cookies = parseCookieHeader(req.headers.cookie);
  return cookies[AUTH_COOKIE_NAME] || null;
};

export const getTokenFromSocketHandshake = (socket: Socket): string | null => {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.trim()) {
    return authToken.trim();
  }

  const authHeader = socket.handshake.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  const cookies = parseCookieHeader(socket.handshake.headers.cookie);
  return cookies[AUTH_COOKIE_NAME] || null;
};
