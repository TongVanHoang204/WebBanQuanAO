import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// Helper to serialize BigInt
const serialize = (data) => {
    return JSON.parse(JSON.stringify(data, (key, value) => typeof value === 'bigint' ? value.toString() : value));
};
/**
 * Get all shipping methods
 * GET /api/admin/shipping
 */
export const getShippingMethods = async (req, res, next) => {
    try {
        const { include_inactive } = req.query;
        const where = {};
        if (include_inactive !== 'true') {
            where.is_active = true;
        }
        const methods = await prisma.shipping_methods.findMany({
            where,
            orderBy: [{ sort_order: 'asc' }, { name: 'asc' }]
        });
        res.json({
            success: true,
            data: serialize(methods)
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Get shipping method by ID
 * GET /api/admin/shipping/:id
 */
export const getShippingMethodById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const method = await prisma.shipping_methods.findUnique({
            where: { id: BigInt(id) }
        });
        if (!method) {
            return res.status(404).json({
                success: false,
                error: { message: 'Không tìm thấy phương thức vận chuyển' }
            });
        }
        res.json({
            success: true,
            data: serialize(method)
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Create shipping method
 * POST /api/admin/shipping
 */
export const createShippingMethod = async (req, res, next) => {
    try {
        const { name, code, description, base_fee, fee_per_kg, min_days, max_days, provinces, is_active, sort_order } = req.body;
        if (!name || !code) {
            return res.status(400).json({
                success: false,
                error: { message: 'Tên và mã phương thức là bắt buộc' }
            });
        }
        // Check duplicate code
        const existing = await prisma.shipping_methods.findUnique({
            where: { code }
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                error: { message: 'Mã phương thức đã tồn tại' }
            });
        }
        const method = await prisma.shipping_methods.create({
            data: {
                name: name.trim(),
                code: code.trim().toLowerCase(),
                description: description || null,
                base_fee: base_fee || 0,
                fee_per_kg: fee_per_kg || 0,
                min_days: min_days || 1,
                max_days: max_days || 3,
                provinces: provinces ? JSON.stringify(provinces) : null,
                is_active: is_active !== false,
                sort_order: sort_order || 0
            }
        });
        res.status(201).json({
            success: true,
            data: serialize(method)
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Update shipping method
 * PUT /api/admin/shipping/:id
 */
export const updateShippingMethod = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, code, description, base_fee, fee_per_kg, min_days, max_days, provinces, is_active, sort_order } = req.body;
        const existing = await prisma.shipping_methods.findUnique({
            where: { id: BigInt(id) }
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                error: { message: 'Không tìm thấy phương thức vận chuyển' }
            });
        }
        // Check code conflict
        if (code && code !== existing.code) {
            const codeConflict = await prisma.shipping_methods.findUnique({
                where: { code }
            });
            if (codeConflict) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Mã phương thức đã được sử dụng' }
                });
            }
        }
        const method = await prisma.shipping_methods.update({
            where: { id: BigInt(id) },
            data: {
                name: name?.trim() || existing.name,
                code: code?.trim().toLowerCase() || existing.code,
                description: description !== undefined ? description : existing.description,
                base_fee: base_fee !== undefined ? base_fee : existing.base_fee,
                fee_per_kg: fee_per_kg !== undefined ? fee_per_kg : existing.fee_per_kg,
                min_days: min_days !== undefined ? min_days : existing.min_days,
                max_days: max_days !== undefined ? max_days : existing.max_days,
                provinces: provinces !== undefined ? (provinces ? JSON.stringify(provinces) : null) : existing.provinces,
                is_active: is_active !== undefined ? is_active : existing.is_active,
                sort_order: sort_order !== undefined ? sort_order : existing.sort_order
            }
        });
        res.json({
            success: true,
            data: serialize(method)
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Delete shipping method
 * DELETE /api/admin/shipping/:id
 */
export const deleteShippingMethod = async (req, res, next) => {
    try {
        const { id } = req.params;
        const methodId = BigInt(id);
        const method = await prisma.shipping_methods.findUnique({
            where: { id: methodId }
        });
        if (!method) {
            return res.status(404).json({
                success: false,
                error: { message: 'Không tìm thấy phương thức vận chuyển' }
            });
        }
        // Check if shipping method is used in shipments (carrier field stores method code)
        const shipmentCount = await prisma.shipments.count({
            where: { carrier: method.code }
        });
        if (shipmentCount > 0) {
            return res.status(400).json({
                success: false,
                error: { message: `Không thể xóa. Phương thức này đã được sử dụng trong ${shipmentCount} đơn vận chuyển.` }
            });
        }
        await prisma.shipping_methods.delete({
            where: { id: methodId }
        });
        res.json({
            success: true,
            message: 'Đã xóa phương thức vận chuyển'
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Calculate shipping fee (public API)
 * POST /api/shipping/calculate
 */
export const calculateShippingFee = async (req, res, next) => {
    try {
        const { method_code, weight, province } = req.body;
        const method = await prisma.shipping_methods.findUnique({
            where: { code: method_code }
        });
        if (!method || !method.is_active) {
            return res.status(404).json({
                success: false,
                error: { message: 'Phương thức vận chuyển không hợp lệ' }
            });
        }
        // Check province support
        if (method.provinces) {
            const supportedProvinces = JSON.parse(method.provinces);
            if (!supportedProvinces.includes(province)) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Phương thức này không hỗ trợ tỉnh/thành của bạn' }
                });
            }
        }
        // Calculate fee: base + (weight_kg * fee_per_kg)
        const weightKg = (weight || 0) / 1000; // Convert grams to kg
        const fee = Number(method.base_fee) + (weightKg * Number(method.fee_per_kg));
        res.json({
            success: true,
            data: {
                method_code: method.code,
                method_name: method.name,
                fee: Math.round(fee),
                estimated_days: `${method.min_days}-${method.max_days} ngày`
            }
        });
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=shipping.controller.js.map