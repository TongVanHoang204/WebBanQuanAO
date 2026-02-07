export const normalizeOrigin = (value: string): string => value.trim().replace(/\/+$/, '');

const parseOriginList = (value?: string): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);
};

export const getAllowedOrigins = (): string[] => {
  const configuredOrigins = parseOriginList(process.env.CORS_ALLOWED_ORIGINS);
  if (configuredOrigins.length > 0) {
    return [...new Set(configuredOrigins)];
  }

  if (process.env.FRONTEND_URL) {
    return [normalizeOrigin(process.env.FRONTEND_URL)];
  }

  return ['http://localhost:5173'];
};

type OriginCallback = (error: Error | null, allow?: boolean) => void;

export const createOriginValidator = (allowedOrigins: string[]) => {
  const normalizedAllowedOrigins = allowedOrigins.map((origin) => normalizeOrigin(origin));

  return (origin: string | undefined, callback: OriginCallback): void => {
    // Allow requests with no origin (mobile clients, server-to-server, curl)
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = normalizeOrigin(origin);
    if (normalizedAllowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    console.log('[CORS] Blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  };
};
