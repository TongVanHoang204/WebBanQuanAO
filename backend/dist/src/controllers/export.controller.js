import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import { logActivity } from '../services/logger.service.js';
const prisma = new PrismaClient();
/**
 * Export orders to Excel
 * GET /api/admin/export/orders
 */
export const exportOrders = async (req, res, next) => {
    try {
        const { start_date, end_date, status } = req.query;
        const where = {};
        if (start_date || end_date) {
            where.created_at = {};
            if (start_date)
                where.created_at.gte = new Date(start_date);
            if (end_date) {
                const endDate = new Date(end_date);
                endDate.setHours(23, 59, 59, 999);
                where.created_at.lte = endDate;
            }
        }
        if (status && status !== 'all') {
            where.status = status;
        }
        const orders = await prisma.orders.findMany({
            where,
            orderBy: { created_at: 'desc' },
            include: {
                user: { select: { full_name: true, email: true, phone: true } },
                order_items: { select: { name: true, qty: true, unit_price: true } }
            }
        });
        await logActivity({
            user_id: BigInt(req.user?.id || 0),
            action: 'export_orders',
            entity_type: 'report',
            details: `Exported orders. Filters: ${JSON.stringify(req.query)}`,
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });
        // Create workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'ShopFeshen';
        workbook.created = new Date();
        const sheet = workbook.addWorksheet('Đơn hàng');
        // Define columns
        sheet.columns = [
            { header: 'Mã đơn', key: 'order_code', width: 15 },
            { header: 'Ngày đặt', key: 'created_at', width: 15 },
            { header: 'Khách hàng', key: 'customer', width: 25 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Điện thoại', key: 'phone', width: 15 },
            { header: 'Tổng tiền', key: 'grand_total', width: 15 },
            { header: 'Phí ship', key: 'shipping_fee', width: 12 },
            { header: 'Giảm giá', key: 'discount', width: 12 },
            { header: 'Trạng thái', key: 'status', width: 12 },
            { header: 'Địa chỉ', key: 'address', width: 40 },
            { header: 'Sản phẩm', key: 'items', width: 50 }
        ];
        // Style header
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' }
        };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        // Add data
        orders.forEach(order => {
            const items = order.order_items.map(i => `${i.name} x${i.qty}`).join(', ');
            const address = `${order.ship_address_line1}, ${order.ship_city}, ${order.ship_province}`;
            sheet.addRow({
                order_code: order.order_code,
                created_at: new Date(order.created_at).toLocaleDateString('vi-VN'),
                customer: order.customer_name || order.user?.full_name || 'N/A',
                email: order.user?.email || 'N/A',
                phone: order.customer_phone || order.user?.phone || 'N/A',
                grand_total: Number(order.grand_total),
                shipping_fee: Number(order.shipping_fee),
                discount: Number(order.discount_total),
                status: order.status,
                address,
                items
            });
        });
        // Format currency columns
        sheet.getColumn('grand_total').numFmt = '#,##0 "₫"';
        sheet.getColumn('shipping_fee').numFmt = '#,##0 "₫"';
        sheet.getColumn('discount').numFmt = '#,##0 "₫"';
        // Generate filename
        const filename = `don-hang-${new Date().toISOString().split('T')[0]}.xlsx`;
        // Send file
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
 * Export products to Excel
 * GET /api/admin/export/products
 */
export const exportProducts = async (req, res, next) => {
    try {
        const { category_id, status } = req.query;
        const where = {};
        if (category_id) {
            where.category_id = BigInt(category_id);
        }
        if (status === 'active')
            where.is_active = true;
        if (status === 'inactive')
            where.is_active = false;
        const products = await prisma.products.findMany({
            where,
            orderBy: { created_at: 'desc' },
            include: {
                category: { select: { name: true } },
                brand: { select: { name: true } },
                product_images: {
                    select: { url: true, is_primary: true },
                    orderBy: { sort_order: 'asc' }
                }
            }
        });
        await logActivity({
            user_id: BigInt(req.user?.id || 0),
            action: 'export_products',
            entity_type: 'report',
            details: `Exported products. Filters: ${JSON.stringify(req.query)}`,
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'ShopFeshen';
        workbook.created = new Date();
        const sheet = workbook.addWorksheet('Sản phẩm');
        // Columns matching Import Template
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
        // Style header
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF10B981' }
        };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        products.forEach(product => {
            // Format images
            const images = product.product_images.map(img => img.url).join(', ');
            sheet.addRow({
                sku: product.sku,
                name: product.name,
                slug: product.slug,
                category: product.category?.name || '',
                brand: product.brand?.name || '',
                base_price: Number(product.base_price),
                compare_price: product.compare_at_price ? Number(product.compare_at_price) : 0,
                short_description: product.meta_description || '',
                description: product.description || '',
                status: product.is_active ? 'active' : 'inactive',
                images: images
            });
        });
        // Instructions Sheet (same as import template for reference)
        const noteSheet = workbook.addWorksheet('Hướng dẫn');
        noteSheet.columns = [
            { header: 'Cột', key: 'column', width: 30 },
            { header: 'Mô tả', key: 'description', width: 60 },
            { header: 'Bắt buộc', key: 'required', width: 15 }
        ];
        noteSheet.getRow(1).font = { bold: true };
        const instructions = [
            { column: 'SKU', description: 'Mã sản phẩm duy nhất (Để nguyên để cập nhật)', required: 'Có' },
            { column: 'Tên sản phẩm', description: 'Tên đầy đủ của sản phẩm', required: 'Có' },
            { column: 'Slug', description: 'URL-friendly name', required: 'Không' },
            { column: 'Danh mục', description: 'ID hoặc tên danh mục', required: 'Không' },
            { column: 'Thương hiệu', description: 'ID hoặc tên thương hiệu', required: 'Không' },
            { column: 'Giá gốc', description: 'Giá bán chính', required: 'Có' },
            { column: 'Giá so sánh', description: 'Giá gạch', required: 'Không' },
            { column: 'Mô tả ngắn', description: 'Tóm tắt sản phẩm', required: 'Không' },
            { column: 'Mô tả chi tiết', description: 'Nội dung chi tiết', required: 'Không' },
            { column: 'Trạng thái', description: 'active/inactive', required: 'Không' },
            { column: 'Hình ảnh', description: 'Danh sách URL ảnh', required: 'Không' }
        ];
        instructions.forEach(i => noteSheet.addRow(i));
        const filename = `data-san-pham-${new Date().toISOString().split('T')[0]}.xlsx`;
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
 * Export customers to Excel
 * GET /api/admin/export/customers
 */
export const exportCustomers = async (req, res, next) => {
    try {
        const customers = await prisma.users.findMany({
            where: { role: 'customer' },
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                status: true,
                created_at: true,
                city: true,
                province: true,
                _count: { select: { orders: true } }
            }
        });
        await logActivity({
            user_id: BigInt(req.user?.id || 0),
            action: 'export_customers',
            entity_type: 'report',
            details: 'Exported customers list',
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });
        // Get total spent for each customer
        const customerIds = customers.map(c => c.id);
        const orderStats = await prisma.orders.groupBy({
            by: ['user_id'],
            where: {
                user_id: { in: customerIds },
                status: { in: ['paid', 'completed'] }
            },
            _sum: { grand_total: true }
        });
        const spentMap = new Map(orderStats.map(s => [String(s.user_id), Number(s._sum.grand_total || 0)]));
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'ShopFeshen';
        workbook.created = new Date();
        const sheet = workbook.addWorksheet('Khách hàng');
        sheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Họ tên', key: 'full_name', width: 25 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Điện thoại', key: 'phone', width: 15 },
            { header: 'Tỉnh/TP', key: 'province', width: 20 },
            { header: 'Số đơn hàng', key: 'order_count', width: 12 },
            { header: 'Tổng chi tiêu', key: 'total_spent', width: 15 },
            { header: 'Trạng thái', key: 'status', width: 12 },
            { header: 'Ngày đăng ký', key: 'created_at', width: 15 }
        ];
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF3B82F6' }
        };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        customers.forEach(customer => {
            sheet.addRow({
                id: String(customer.id),
                full_name: customer.full_name || 'Chưa cập nhật',
                email: customer.email,
                phone: customer.phone || 'N/A',
                province: customer.province || 'N/A',
                order_count: customer._count.orders,
                total_spent: spentMap.get(String(customer.id)) || 0,
                status: customer.status === 'active' ? 'Hoạt động' : 'Bị khóa',
                created_at: new Date(customer.created_at).toLocaleDateString('vi-VN')
            });
        });
        sheet.getColumn('total_spent').numFmt = '#,##0 "₫"';
        const filename = `khach-hang-${new Date().toISOString().split('T')[0]}.xlsx`;
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
 * Export revenue report to Excel
 * GET /api/admin/export/revenue
 */
export const exportRevenue = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;
        const startDate = start_date ? new Date(start_date) : new Date(new Date().setMonth(new Date().getMonth() - 1));
        const endDate = end_date ? new Date(end_date) : new Date();
        endDate.setHours(23, 59, 59, 999);
        const orders = await prisma.orders.findMany({
            where: {
                created_at: { gte: startDate, lte: endDate },
                status: { in: ['paid', 'completed'] }
            },
            select: {
                created_at: true,
                grand_total: true,
                discount_total: true,
                shipping_fee: true
            },
            orderBy: { created_at: 'asc' }
        });
        // Group by date
        const dailyStats = {};
        orders.forEach(order => {
            const dateKey = new Date(order.created_at).toLocaleDateString('vi-VN');
            if (!dailyStats[dateKey]) {
                dailyStats[dateKey] = { revenue: 0, orders: 0, discount: 0 };
            }
            dailyStats[dateKey].revenue += Number(order.grand_total);
            dailyStats[dateKey].orders += 1;
            dailyStats[dateKey].discount += Number(order.discount_total);
        });
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'ShopFeshen';
        workbook.created = new Date();
        const sheet = workbook.addWorksheet('Doanh thu');
        sheet.columns = [
            { header: 'Ngày', key: 'date', width: 15 },
            { header: 'Số đơn', key: 'orders', width: 12 },
            { header: 'Doanh thu', key: 'revenue', width: 18 },
            { header: 'Giảm giá', key: 'discount', width: 15 }
        ];
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF59E0B' }
        };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        let totalRevenue = 0;
        let totalOrders = 0;
        let totalDiscount = 0;
        Object.entries(dailyStats).forEach(([date, stats]) => {
            sheet.addRow({
                date,
                orders: stats.orders,
                revenue: stats.revenue,
                discount: stats.discount
            });
            totalRevenue += stats.revenue;
            totalOrders += stats.orders;
            totalDiscount += stats.discount;
        });
        // Add totals row
        const totalsRow = sheet.addRow({
            date: 'TỔNG CỘNG',
            orders: totalOrders,
            revenue: totalRevenue,
            discount: totalDiscount
        });
        totalsRow.font = { bold: true };
        sheet.getColumn('revenue').numFmt = '#,##0 "₫"';
        sheet.getColumn('discount').numFmt = '#,##0 "₫"';
        const filename = `doanh-thu-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=export.controller.js.map