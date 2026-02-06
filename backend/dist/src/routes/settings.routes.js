import { Router } from 'express';
import { verifyToken, requireAdmin } from '../middlewares/auth.middleware.js';
import { getSettings, updateSettings, uploadLogo, getPublicSettings } from '../controllers/settings.controller.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
const router = Router();
// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
// Multer setup for logo upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
// Public route
/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: System settings
 */
/**
 * @swagger
 * /admin/settings/public:
 *   get:
 *     summary: Get public settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Public settings
 */
router.get('/public', getPublicSettings);
// All other settings routes require admin
router.use(verifyToken, requireAdmin);
/**
 * @swagger
 * /admin/settings:
 *   get:
 *     summary: Get all settings (Admin)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Full settings
 */
router.get('/', getSettings);
router.put('/', updateSettings);
/**
 * @swagger
 * /admin/settings/logo:
 *   post:
 *     summary: Upload store logo
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo uploaded
 */
router.post('/logo', upload.single('logo'), uploadLogo);
export default router;
//# sourceMappingURL=settings.routes.js.map