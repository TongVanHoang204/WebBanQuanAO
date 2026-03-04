import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { prisma } from './lib/prisma.js';
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
import personalizationRoutes from './routes/personalization.routes.js';
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
// Middleware
import { errorHandler } from './middlewares/error.middleware.js';
import morganMiddleware from './middlewares/morgan.middleware.js';
import { globalLimiter, authLimiter } from './middlewares/rateLimiter.js';
import { logger } from './config/logger.js';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Re-export prisma singleton for backward compatibility
export { prisma };
const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 4000;
BigInt.prototype.toJSON = function () {
    const int = Number.parseInt(this.toString());
    return int ?? this.toString();
};
// CORS Configuration
const allowedOrigins = getAllowedOrigins();
const corsOptions = {
    origin: createOriginValidator(allowedOrigins),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
};
logger.info(`[CORS] Allowed Origins: ${allowedOrigins.join(', ')}`);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
// HTTP Logging
app.use(morganMiddleware);
// Global Rate Limiting
app.use('/api', globalLimiter);
// Security Headers for Cross-Origin
app.use((req, res, next) => {
    // Allow cross-origin window communication for OAuth and popups
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    // Note: COEP require-corp can break CORS, so we use credentialless or remove it
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});
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
    }
    catch (error) {
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
//# sourceMappingURL=server.js.map