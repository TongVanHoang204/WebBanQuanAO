import express from 'express';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { prisma } from './lib/prisma.js';
import { initializeSocket } from './socket.js';
import { initializeScheduler } from './services/scheduler.service.js';
import { createOriginValidator, getAllowedOrigins } from './config/cors.js';
import { validateSecurityConfig } from './utils/auth-session.js';

// Routes
import authRoutes from './routes/user/auth.routes.js';
import productRoutes from './routes/user/product.routes.js';
import categoryRoutes from './routes/user/category.routes.js';
import cartRoutes from './routes/user/cart.routes.js';
import orderRoutes from './routes/user/order.routes.js';
import uploadRoutes from './routes/user/upload.routes.js';
import personalizationRoutes from './routes/user/personalization.routes.js';
import adminRoutes from './routes/admin/admin.routes.js';
import settingsRoutes from './routes/admin/settings.routes.js';
import permissionRoutes from './routes/admin/permission.routes.js';
import notificationRoutes from './routes/user/notification.routes.js';
import couponRoutes from './routes/admin/coupon.routes.js';
import brandRoutes from './routes/admin/brand.routes.js';
import brandPublicRoutes from './routes/user/brand.public.routes.js';
import collectionPublicRoutes from './routes/user/collection.public.routes.js';
import reviewRoutes from './routes/user/review.routes.js';
import shippingRoutes from './routes/admin/shipping.routes.js';
import bannerRoutes from './routes/admin/banner.routes.js';
import { getPublicBanners } from './controllers/admin/banner.controller.js';
import exportRoutes from './routes/admin/export.routes.js';
import importRoutes from './routes/admin/import.routes.js';
import staffRoutes from './routes/admin/staff.routes.js';
import logRoutes from './routes/admin/log.routes.js';
import inventoryRoutes from './routes/admin/inventory.routes.js';
import collectionRoutes from './routes/admin/collection.routes.js';
import paymentRoutes from './routes/user/payment.routes.js';
import wishlistRoutes from './routes/user/wishlist.routes.js';
import placesRoutes from './routes/user/places.routes.js';

// Middleware
import { errorHandler } from './middlewares/error.middleware.js';
import morganMiddleware from './middlewares/morgan.middleware.js';
import { globalLimiter, authLimiter } from './middlewares/rateLimiter.js';
import { maintenanceMiddleware } from './middlewares/maintenance.middleware.js';
import { logger } from './config/logger.js';

dotenv.config();
validateSecurityConfig();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Re-export prisma singleton for backward compatibility
export { prisma };

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 4000;
import chatRoutesRouter from './routes/user/chat.routes.js';
import aiRoutesRouter from './routes/user/ai.routes.js';

const enableAIRoutes = true; // explicitly enable

const createUnavailableRouter = (featureName: string) => {
  const fallbackRouter = express.Router();
  fallbackRouter.use((_req, res) => {
    res.status(503).json({
      success: false,
      message: `${featureName} is temporarily unavailable in this deployment.`
    });
  });
  return fallbackRouter;
};

let chatRoutes, aiRoutes;
try {
  chatRoutes = enableAIRoutes ? chatRoutesRouter : createUnavailableRouter('Chat');
  aiRoutes = enableAIRoutes ? aiRoutesRouter : createUnavailableRouter('AI');
  logger.info('AI/Chat routes loaded successfully');
} catch (error) {
  logger.warn('AI/Chat routes disabled because optional dependencies failed to load', { error });
  chatRoutes = createUnavailableRouter('Chat');
  aiRoutes = createUnavailableRouter('AI');
}

// BigInt serialization setup
declare global {
  interface BigInt {
    toJSON(): string | number;
  }
}

BigInt.prototype.toJSON = function (): string | number {
  const int = Number.parseInt(this.toString());
  return int ?? this.toString();
};

// CORS Configuration
const allowedOrigins = getAllowedOrigins();
const websocketOrigins = allowedOrigins.flatMap((origin) => {
  if (origin.startsWith('https://')) {
    return [origin, origin.replace(/^https:\/\//, 'wss://')];
  }
  if (origin.startsWith('http://')) {
    return [origin, origin.replace(/^http:\/\//, 'ws://')];
  }
  return [origin];
});
const cspConnectSources = Array.from(new Set([
  "'self'",
  ...websocketOrigins,
  'https://accounts.google.com',
  'https://apis.google.com',
  'https://*.googleapis.com',
  'https://*.gstatic.com'
]));
const corsOptions: CorsOptions = {
  origin: createOriginValidator(allowedOrigins),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
  exposedHeaders: ['Content-Disposition']
};

logger.info(`[CORS] Allowed Origins: ${allowedOrigins.join(', ')}`);

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(helmet({
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      formAction: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      fontSrc: ["'self'", 'data:', 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://accounts.google.com', 'https://apis.google.com', 'https://*.gstatic.com'],
      connectSrc: cspConnectSources,
      frameSrc: ["'self'", 'https://accounts.google.com'],
      scriptSrcAttr: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// HTTP Logging
app.use(morganMiddleware);

// Global Rate Limiting & Maintenance Mode
app.use('/api', globalLimiter);
app.use('/api', maintenanceMiddleware);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files - Serve uploads (use process.cwd for correct path)
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// API Routes
app.use('/api/v1/auth', authLimiter, authRoutes); // Apply strict limiter to auth
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/personalization', personalizationRoutes);
app.use('/api/v1/places', placesRoutes);

// Specific Admin Routes (Must come before generic /api/admin to avoid middleware conflicts)
app.use('/api/v1/admin/settings', settingsRoutes);
app.use('/api/v1/admin/permissions', permissionRoutes);
app.use('/api/v1/admin/notifications', notificationRoutes);
app.use('/api/v1/admin/ai', aiRoutes);
app.use('/api/v1/admin/coupons', couponRoutes);
app.use('/api/v1/admin/brands', brandRoutes);
app.use('/api/v1/admin/reviews', reviewRoutes);
app.use('/api/v1/admin/shipping', shippingRoutes);
app.use('/api/v1/admin/banners', bannerRoutes);
app.use('/api/v1/admin/export', exportRoutes);
app.use('/api/v1/admin/import', importRoutes);
app.use('/api/v1/admin/staff', staffRoutes);
app.use('/api/v1/admin/logs', logRoutes);
app.use('/api/v1/admin/inventory', inventoryRoutes);
app.use('/api/v1/admin/collections', collectionRoutes);

// Generic Admin Routes (Dashboard, Users, etc.)
app.use('/api/v1/admin', adminRoutes);

// Swagger Documentation
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger.js';
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/reviews', reviewRoutes); // New public/mixed reviews route
app.use('/api/v1/brands', brandPublicRoutes);
app.use('/api/v1/collections', collectionPublicRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Public API Routes
app.get('/api/v1/banners', getPublicBanners);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error Handler
app.use(errorHandler);

// Start Server
async function main() {
  try {
    await prisma.$connect();
    logger.info('✅ Database kết nối thành công');
    
    // Initialize Socket.io
    initializeSocket(httpServer);
    logger.info('✅ Socket.io kết nối thành công');

    // Initialize Scheduler (Cron Jobs)
    initializeScheduler();
    
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }
}

// Graceful Shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

main();

