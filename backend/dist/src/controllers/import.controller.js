import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import { logActivity } from '../services/logger.service.js';
import { createNotification } from './notificationController.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(process.cwd(), 'public/uploads');
// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
const prisma = new PrismaClient();
/**
 * Download product import template
 * GET /api/admin/import/products/template
 */
export const downloadProductTemplate = async (req, res, next) => {
    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'ShopFeshen';
        workbook.created = new Date();
        const sheet = workbook.addWorksheet('Sản phẩm');
        // Define columns with validation hints in header
        sheet.columns = [
            { header: 'SKU (*)', key: 'sku', width: 15 },
            { header: 'Tên sản phẩm (*)', key: 'name', width: 40 },
            { header: 'Slug', key: 'slug', width: 30 },
            { header: 'Danh mục (ID hoặc tên)', key: 'category', width: 25 },
            { header: 'Thương hiệu (ID hoặc tên)', key: 'brand', width: 20 },
            { header: 'Giá gốc (*)', key: 'base_price', width: 15 },
            { header: 'Giá so sánh', key: 'compare_price', width: 15 },
            { header: 'Mô tả ngắn', key: 'short_description', width: 40 },
            { header: 'Mô tả chi tiết', key: 'description', width: 50 },
            { header: 'Trạng thái (active/inactive)', key: 'status', width: 20 },
            { header: 'Hình ảnh (URL cách nhau dấu phẩy)', key: 'images', width: 50 }
        ];
        // Style header row
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF10B981' }
        };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        // Add instruction row
        sheet.addRow({
            sku: 'SP001',
            name: 'Áo thun nam cổ tròn',
            slug: 'ao-thun-nam-co-tron',
            category: 'Áo',
            brand: 'Nike',
            base_price: 250000,
            compare_price: 350000,
            short_description: 'Áo thun cotton 100%',
            description: 'Mô tả chi tiết sản phẩm...',
            status: 'active',
            images: 'https://example.com/image1.jpg, https://example.com/image2.jpg'
        });
        // Add note sheet
        const noteSheet = workbook.addWorksheet('Hướng dẫn');
        noteSheet.columns = [
            { header: 'Cột', key: 'column', width: 30 },
            { header: 'Mô tả', key: 'description', width: 60 },
            { header: 'Bắt buộc', key: 'required', width: 15 }
        ];
        noteSheet.getRow(1).font = { bold: true };
        const instructions = [
            { column: 'SKU', description: 'Mã sản phẩm duy nhất', required: 'Có' },
            { column: 'Tên sản phẩm', description: 'Tên đầy đủ của sản phẩm', required: 'Có' },
            { column: 'Slug', description: 'URL-friendly name (tự tạo nếu để trống)', required: 'Không' },
            { column: 'Danh mục', description: 'ID hoặc tên danh mục. Để trống nếu không có', required: 'Không' },
            { column: 'Thương hiệu', description: 'ID hoặc tên thương hiệu. Để trống nếu không có', required: 'Không' },
            { column: 'Giá gốc', description: 'Giá bán chính (số nguyên, VD: 250000)', required: 'Có' },
            { column: 'Giá so sánh', description: 'Giá gạch (nếu có khuyến mãi)', required: 'Không' },
            { column: 'Mô tả ngắn', description: 'Tóm tắt sản phẩm', required: 'Không' },
            { column: 'Mô tả chi tiết', description: 'Nội dung chi tiết, có thể dùng HTML', required: 'Không' },
            { column: 'Trạng thái', description: 'active = đang bán, inactive = tạm ẩn', required: 'Không (mặc định: active)' },
            { column: 'Hình ảnh', description: 'Danh sách URL ảnh, cách nhau bởi dấu phẩy', required: 'Không' }
        ];
        instructions.forEach(i => noteSheet.addRow(i));
        const filename = 'mau-nhap-san-pham.xlsx';
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        next(error);
    }
};
/**
 * Import products from Excel
 * POST /api/admin/import/products
 */
export const importProducts = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { message: 'Vui lòng upload file Excel' }
            });
        }
        const workbook = new ExcelJS.Workbook();
        // @ts-ignore
        await workbook.xlsx.load(req.file.buffer);
        const sheet = workbook.getWorksheet(1);
        if (!sheet) {
            return res.status(400).json({
                success: false,
                error: { message: 'File Excel không hợp lệ' }
            });
        }
        const results = {
            total: 0,
            created: 0,
            updated: 0,
            errors: []
        };
        // Get all categories and brands for lookup
        const categories = await prisma.categories.findMany({ select: { id: true, name: true } });
        const brands = await prisma.brands.findMany({ select: { id: true, name: true } });
        const categoryMap = new Map();
        categories.forEach(c => {
            categoryMap.set(c.name.toLowerCase(), c.id);
            categoryMap.set(String(c.id), c.id);
        });
        const brandMap = new Map();
        brands.forEach(b => {
            brandMap.set(b.name.toLowerCase(), b.id);
            brandMap.set(String(b.id), b.id);
        });
        // Process embedded images
        const imageMap = new Map();
        const images = sheet.getImages();
        if (images && images.length > 0) {
            for (const image of images) {
                const imgId = parseInt(image.imageId, 10);
                const imgData = workbook.getImage(imgId);
                if (imgData && imgData.buffer) {
                    // Determine row number (nativeRow is 0-indexed, so +1 to match 1-based rowNumber)
                    // However, exceljs range might return slightly different structures depending on version.
                    // Usually range.tl.nativeRow is the way.
                    // @ts-ignore
                    const rowNumber = (image.range.tl?.nativeRow ?? -1) + 1;
                    if (rowNumber > 1) { // Skip header row images
                        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
                        const ext = imgData.extension || 'png';
                        const filename = `import-${uniqueSuffix}.${ext}`;
                        const filePath = path.join(uploadsDir, filename);
                        fs.writeFileSync(filePath, Buffer.from(imgData.buffer));
                        const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;
                        const fileUrl = `${baseUrl}/uploads/${filename}`;
                        if (!imageMap.has(rowNumber)) {
                            imageMap.set(rowNumber, []);
                        }
                        imageMap.get(rowNumber)?.push(fileUrl);
                    }
                }
            }
        }
        // Skip header row
        const rows = [];
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                rows.push({ rowNumber, values: row.values });
            }
        });
        results.total = rows.length;
        // Helper to safely get string from cell value
        const getCellValue = (value) => {
            if (value === null || value === undefined)
                return '';
            if (typeof value === 'object') {
                if (value.text)
                    return String(value.text); // Rich Text
                if (value.result)
                    return String(value.result); // Formula
                if (value.hyperlink && value.text)
                    return String(value.text);
                return JSON.stringify(value); // Fallback
            }
            return String(value);
        };
        for (const { rowNumber, values } of rows) {
            try {
                // values[0] is empty in exceljs (1-based index), actual data starts at index 1
                const sku = getCellValue(values[1]).trim();
                const name = getCellValue(values[2]).trim();
                const slug = getCellValue(values[3]).trim() || generateSlug(name);
                const categoryValue = getCellValue(values[4]).trim();
                const brandValue = getCellValue(values[5]).trim();
                // Remove non-numeric characters for price
                const basePriceStr = getCellValue(values[6]).trim();
                const basePrice = parseFloat(basePriceStr.replace(/[^0-9.]/g, '') || '0');
                const comparePriceStr = getCellValue(values[7]).trim();
                const comparePrice = comparePriceStr ? parseFloat(comparePriceStr.replace(/[^0-9.]/g, '')) : null;
                const shortDesc = getCellValue(values[8]).trim();
                const description = getCellValue(values[9]).trim();
                const status = getCellValue(values[10]).toLowerCase().trim() || 'active';
                const imagesStr = getCellValue(values[11]).trim();
                // Validation
                if (!sku) {
                    results.errors.push({ row: rowNumber, sku: 'N/A', error: 'SKU không được để trống' });
                    continue;
                }
                if (!name) {
                    results.errors.push({ row: rowNumber, sku, error: 'Tên sản phẩm không được để trống' });
                    continue;
                }
                if (basePrice <= 0) {
                    results.errors.push({ row: rowNumber, sku, error: 'Giá gốc phải lớn hơn 0' });
                    continue;
                }
                // Lookup category
                let categoryId = null;
                if (categoryValue) {
                    categoryId = categoryMap.get(categoryValue.toLowerCase()) || null;
                }
                // Lookup brand
                let brandId = null;
                if (brandValue) {
                    brandId = brandMap.get(brandValue.toLowerCase()) || null;
                }
                // Check if product exists
                const existingProduct = await prisma.products.findFirst({
                    where: { sku }
                });
                const productData = {
                    name,
                    slug,
                    sku,
                    category_id: categoryId,
                    brand_id: brandId,
                    base_price: basePrice,
                    compare_at_price: comparePrice,
                    meta_description: shortDesc || null,
                    description: description || null,
                    is_active: status === 'active'
                };
                let productId;
                if (existingProduct) {
                    productId = existingProduct.id;
                    await prisma.products.update({
                        where: { id: productId },
                        data: productData
                    });
                    results.updated++;
                }
                else {
                    const newProduct = await prisma.products.create({
                        data: productData
                    });
                    productId = newProduct.id;
                    results.created++;
                }
                // Handle Images (Both generic URLs and embedded images)
                const embeddedImages = imageMap.get(rowNumber) || [];
                const stringImages = imagesStr ? imagesStr.split(',').map(url => url.trim()).filter(url => url) : [];
                const allImageUrls = [...stringImages, ...embeddedImages];
                if (allImageUrls.length > 0) {
                    let startSortOrder = 0;
                    if (existingProduct) {
                        // 1. Get existing URLs to prevent duplicates
                        const existingImages = await prisma.product_images.findMany({
                            where: { product_id: productId },
                            select: { url: true }
                        });
                        const existingUrlSet = new Set(existingImages.map(img => img.url));
                        // 2. Filter out duplicates from input AND existing DB
                        const uniqueNewUrls = [...new Set(allImageUrls)].filter(url => !existingUrlSet.has(url));
                        if (uniqueNewUrls.length > 0) {
                            // Get current max sort order to append
                            const maxSortOrder = await prisma.product_images.aggregate({
                                where: { product_id: productId },
                                _max: { sort_order: true }
                            });
                            const startSortOrder = (maxSortOrder._max.sort_order ?? -1) + 1;
                            await prisma.product_images.createMany({
                                data: uniqueNewUrls.map((url, index) => ({
                                    product_id: productId,
                                    url: url,
                                    is_primary: false, // Appended images are never primary
                                    sort_order: startSortOrder + index
                                }))
                            });
                        }
                    }
                    else {
                        // For new products, just self-deduplicate
                        const uniqueUrls = [...new Set(allImageUrls)];
                        if (uniqueUrls.length > 0) {
                            await prisma.product_images.createMany({
                                data: uniqueUrls.map((url, index) => ({
                                    product_id: productId,
                                    url: url,
                                    is_primary: index === 0,
                                    sort_order: index
                                }))
                            });
                        }
                    }
                }
            }
            catch (rowError) {
                results.errors.push({
                    row: rowNumber,
                    sku: String(values[1] || 'N/A'),
                    error: rowError.message || 'Lỗi không xác định'
                });
            }
        }
        await logActivity({
            user_id: BigInt(req.user?.id || 0),
            action: 'import_products',
            entity_type: 'product',
            details: `Imported products: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`,
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });
        // Notify admins about the import
        await createNotification({
            user_id: null, // Broadcast to admins
            type: 'system',
            title: 'Nhập dữ liệu thành công',
            message: `Quá trình nhập dữ liệu hoàn tất: ${results.created} tạo mới, ${results.updated} cập nhật.`,
            link: '/admin/products'
        });
        res.json({
            success: true,
            data: results
        });
    }
    catch (error) {
        next(error);
    }
};
// Helper function to generate slug
function generateSlug(name) {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
//# sourceMappingURL=import.controller.js.map