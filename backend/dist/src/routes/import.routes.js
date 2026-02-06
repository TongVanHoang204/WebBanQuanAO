import express from 'express';
import multer from 'multer';
import { verifyToken, authorize } from '../middlewares/auth.middleware.js';
import { importProducts, downloadProductTemplate } from '../controllers/import.controller.js';
const router = express.Router();
// Multer config for Excel files
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
            'application/vnd.ms-excel' // xls
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls)'));
        }
    }
});
// Download import template
router.get('/products/template', verifyToken, authorize(['admin', 'staff']), downloadProductTemplate);
// Import products from Excel
router.post('/products', verifyToken, authorize(['admin', 'staff']), upload.single('file'), importProducts);
export default router;
//# sourceMappingURL=import.routes.js.map