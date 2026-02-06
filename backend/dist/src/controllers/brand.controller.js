import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// Helper to serialize BigInt
const serialize = (data) => {
    return JSON.parse(JSON.stringify(data, (key, value) => typeof value === 'bigint' ? value.toString() : value));
};
// Generate slug from name
const generateSlug = (name) => {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};
/**
 * Get all brands
 * GET /api/admin/brands
 */
export const getBrands = async (req, res, next) => {
    try {
        const { page = '1', limit = '20', search, status } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { slug: { contains: search } }
            ];
        }
        if (status === 'active')
            where.is_active = true;
        if (status === 'inactive')
            where.is_active = false;
        const [brands, total] = await Promise.all([
            prisma.brands.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                include: {
                    _count: { select: { products: true } }
                }
            }),
            prisma.brands.count({ where })
        ]);
        res.json({
            success: true,
            data: {
                brands: serialize(brands),
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Get brand by ID
 * GET /api/admin/brands/:id
 */
export const getBrandById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const brand = await prisma.brands.findUnique({
            where: { id: BigInt(id) },
            include: {
                _count: { select: { products: true } }
            }
        });
        if (!brand) {
            return res.status(404).json({
                success: false,
                error: { message: 'Không tìm thấy thương hiệu' }
            });
        }
        res.json({
            success: true,
            data: serialize(brand)
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Create brand
 * POST /api/admin/brands
 */
export const createBrand = async (req, res, next) => {
    try {
        const { name, slug, logo, description, is_active } = req.body;
        if (!name || name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: { message: 'Tên thương hiệu phải có ít nhất 2 ký tự' }
            });
        }
        const finalSlug = slug || generateSlug(name);
        // Check duplicate slug
        const existing = await prisma.brands.findUnique({
            where: { slug: finalSlug }
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                error: { message: 'Slug đã tồn tại, vui lòng chọn tên khác' }
            });
        }
        const brand = await prisma.brands.create({
            data: {
                name: name.trim(),
                slug: finalSlug,
                logo: logo || null,
                description: description || null,
                is_active: is_active !== false
            }
        });
        res.status(201).json({
            success: true,
            data: serialize(brand)
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Update brand
 * PUT /api/admin/brands/:id
 */
export const updateBrand = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, slug, logo, description, is_active } = req.body;
        const existing = await prisma.brands.findUnique({
            where: { id: BigInt(id) }
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                error: { message: 'Không tìm thấy thương hiệu' }
            });
        }
        // Check slug conflict if slug is being changed
        if (slug && slug !== existing.slug) {
            const slugConflict = await prisma.brands.findUnique({
                where: { slug }
            });
            if (slugConflict) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Slug đã được sử dụng' }
                });
            }
        }
        const brand = await prisma.brands.update({
            where: { id: BigInt(id) },
            data: {
                name: name?.trim() || existing.name,
                slug: slug || existing.slug,
                logo: logo !== undefined ? logo : existing.logo,
                description: description !== undefined ? description : existing.description,
                is_active: is_active !== undefined ? is_active : existing.is_active
            }
        });
        res.json({
            success: true,
            data: serialize(brand)
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Delete brand
 * DELETE /api/admin/brands/:id
 */
export const deleteBrand = async (req, res, next) => {
    try {
        const { id } = req.params;
        const brand = await prisma.brands.findUnique({
            where: { id: BigInt(id) },
            include: { _count: { select: { products: true } } }
        });
        if (!brand) {
            return res.status(404).json({
                success: false,
                error: { message: 'Không tìm thấy thương hiệu' }
            });
        }
        if (brand._count.products > 0) {
            return res.status(400).json({
                success: false,
                error: { message: `Không thể xóa. Thương hiệu này có ${brand._count.products} sản phẩm.` }
            });
        }
        await prisma.brands.delete({
            where: { id: BigInt(id) }
        });
        res.json({
            success: true,
            message: 'Đã xóa thương hiệu'
        });
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=brand.controller.js.map