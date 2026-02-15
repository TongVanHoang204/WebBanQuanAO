import 'dotenv/config';

import express from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import Logger from './config/logger.js';
import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { initializeSocket } from './socket.js';
import { initializeScheduler } from './services/scheduler.service.js';
import { createOriginValidator, getAllowedOrigins } from './config/cors.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import chatRoutes from './routes/chat.routes.js';
import adminRoutes from './routes/admin.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import permissionRoutes from './routes/permission.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import aiRoutes from './routes/ai.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import brandRoutes from './routes/brand.routes.js';
import brandPublicRoutes from './routes/brand.public.routes.js';
import reviewRoutes from './routes/review.routes.js';
import shippingRoutes from './routes/shipping.routes.js';
import bannerRoutes from './routes/banner.routes.js';
import { getPublicBanners } from './controllers/banner.controller.js';
import exportRoutes from './routes/export.routes.js';
import importRoutes from './routes/import.routes.js';
import staffRoutes from './routes/staff.routes.js';
import logRoutes from './routes/log.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import placesRoutes from './routes/places.routes.js';
import seoRoutes from './routes/seo.routes.js';

// Middleware
import { errorHandler } from './middlewares/error.middleware.js';
import { checkMaintenanceMode } from './middlewares/maintenance.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Prisma Client
export const prisma = new PrismaClient();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 4000;

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

// CORS Configuration - TEMPORARILY ALLOW ALL for debugging
const corsOptions: CorsOptions = {
  origin: true, // Allow all origins temporarily
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
};

console.log('[CORS] Mode: ALLOW ALL (debug mode)');

app.use(cors(corsOptions));

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }, // Required for Google OAuth
}));

// Logging Middleware
app.use(morgan('combined', { 
  stream: { write: (message) => Logger.http(message.trim()) },
  skip: (req, res) => res.statusCode < 400 
}));

// Rate Limiting
// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to 100 requests per windowMs (1000 in dev)
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// robots.txt (Must be before other routes and NOT under /api for crawlers)
app.use('/', seoRoutes);

// Maintenance Mode Check (Apply to all /api routes)
app.use('/api', checkMaintenanceMode);

app.options('*', cors(corsOptions));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files - Serve uploads (use process.cwd for correct path)
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/places', placesRoutes);

// Specific Admin Routes (Must come before generic /api/admin to avoid middleware conflicts)
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/permissions', permissionRoutes);
app.use('/api/admin/notifications', notificationRoutes);
app.use('/api/admin/ai', aiRoutes);
app.use('/api/admin/coupons', couponRoutes);
app.use('/api/admin/brands', brandRoutes);
app.use('/api/admin/reviews', reviewRoutes);
app.use('/api/admin/shipping', shippingRoutes);
app.use('/api/admin/banners', bannerRoutes);
app.use('/api/admin/export', exportRoutes);
app.use('/api/admin/import', importRoutes);
app.use('/api/admin/staff', staffRoutes);
app.use('/api/admin/logs', logRoutes);

// Generic Admin Routes (Dashboard, Users, etc.)
app.use('/api/admin', adminRoutes);

// Swagger Documentation
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger.js';
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use('/api/payment', paymentRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes); // New public/mixed reviews route
app.use('/api/brands', brandPublicRoutes);
app.use('/api/notifications', notificationRoutes);

// Public API Routes
app.get('/api/banners', getPublicBanners);

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
    console.log('✅ Database kết nối thành công');
    
    // Initialize Socket.io
    initializeSocket(httpServer);
    console.log('✅ Socket.io kết nối thành công');

    // Initialize Scheduler (Cron Jobs)
    initializeScheduler();
    
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
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

if (process.env.NODE_ENV !== 'test') {
  main();
}

export { app, httpServer };

