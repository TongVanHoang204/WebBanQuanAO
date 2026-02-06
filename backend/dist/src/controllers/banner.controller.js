import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// Helper to serialize BigInt
const serialize = (data) => {
    return JSON.parse(JSON.stringify(data, (key, value) => typeof value === 'bigint' ? value.toString() : value));
};
/**
 * Get all banners (admin)
 * GET /api/admin/banners
 */
export const getBanners = async (req, res, next) => {
    try {
        const { position, include_inactive } = req.query;
        const where = {};
        if (position) {
            where.position = position;
        }
        if (include_inactive !== 'true') {
            where.is_active = true;
        }
        const banners = await prisma.banners.findMany({
            where,
            orderBy: [{ position: 'asc' }, { sort_order: 'asc' }],
            include: { banner_images: { orderBy: { sort_order: 'asc' } } }
        });
        res.json({
            success: true,
            data: serialize(banners)
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Get active banners for public display
 * GET /api/banners
 */
export const getPublicBanners = async (req, res, next) => {
    try {
        const { position = 'home_hero' } = req.query;
        const now = new Date();
        const banners = await prisma.banners.findMany({
            where: {
                position: position,
                is_active: true,
                OR: [
                    { start_date: null, end_date: null },
                    { start_date: { lte: now }, end_date: null },
                    { start_date: null, end_date: { gte: now } },
                    { start_date: { lte: now }, end_date: { gte: now } }
                ]
            },
            orderBy: { sort_order: 'asc' },
            include: {
                banner_images: {
                    orderBy: { sort_order: 'asc' },
                    select: { image_url: true, sort_order: true }
                }
            }
        });
        res.json({
            success: true,
            data: serialize(banners)
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Get banner by ID
 * GET /api/admin/banners/:id
 */
export const getBannerById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const banner = await prisma.banners.findUnique({
            where: { id: BigInt(id) },
            include: { banner_images: { orderBy: { sort_order: 'asc' } } }
        });
        if (!banner) {
            return res.status(404).json({
                success: false,
                error: { message: 'Không tìm thấy banner' }
            });
        }
        res.json({
            success: true,
            data: serialize(banner)
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Create banner
 * POST /api/admin/banners
 */
export const createBanner = async (req, res, next) => {
    try {
        const { title, subtitle, image_url, images, link_url, button_text, position, sort_order, is_active, start_date, end_date } = req.body;
        if (!title || (!image_url && (!images || images.length === 0))) {
            return res.status(400).json({
                success: false,
                error: { message: 'Tiêu đề và ít nhất 1 ảnh là bắt buộc' }
            });
        }
        // Use first image from array if image_url is missing
        const primaryImage = image_url || (images && images.length > 0 ? images[0] : '');
        const banner = await prisma.banners.create({
            data: {
                title: title.trim(),
                subtitle: subtitle || null,
                image_url: primaryImage,
                link_url: link_url || null,
                button_text: button_text || null,
                position: position || 'home_hero',
                sort_order: sort_order || 0,
                is_active: is_active !== false,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null,
                banner_images: {
                    create: images && Array.isArray(images) ? images.map((url, index) => ({
                        image_url: url,
                        sort_order: index
                    })) : undefined
                }
            },
            include: { banner_images: true }
        });
        res.status(201).json({
            success: true,
            data: serialize(banner)
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Update banner
 * PUT /api/admin/banners/:id
 */
export const updateBanner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, subtitle, image_url, images, link_url, button_text, position, sort_order, is_active, start_date, end_date } = req.body;
        const existing = await prisma.banners.findUnique({
            where: { id: BigInt(id) }
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                error: { message: 'Không tìm thấy banner' }
            });
        }
        // Determine primary image
        let newPrimaryImage = image_url;
        if (!newPrimaryImage && images && images.length > 0) {
            newPrimaryImage = images[0];
        }
        if (!newPrimaryImage) {
            newPrimaryImage = existing.image_url;
        }
        // Prepare transaction for updating images if provided
        const updateData = {
            title: title?.trim() || existing.title,
            subtitle: subtitle !== undefined ? subtitle : existing.subtitle,
            image_url: newPrimaryImage,
            link_url: link_url !== undefined ? link_url : existing.link_url,
            button_text: button_text !== undefined ? button_text : existing.button_text,
            position: position || existing.position,
            sort_order: sort_order !== undefined ? sort_order : existing.sort_order,
            is_active: is_active !== undefined ? is_active : existing.is_active,
            start_date: start_date !== undefined ? (start_date ? new Date(start_date) : null) : existing.start_date,
            end_date: end_date !== undefined ? (end_date ? new Date(end_date) : null) : existing.end_date
        };
        if (images && Array.isArray(images)) {
            // Delete existing images and create new ones
            await prisma.banner_images.deleteMany({ where: { banner_id: BigInt(id) } });
            updateData.banner_images = {
                create: images.map((url, index) => ({
                    image_url: url,
                    sort_order: index
                }))
            };
        }
        const banner = await prisma.banners.update({
            where: { id: BigInt(id) },
            data: updateData,
            include: { banner_images: { orderBy: { sort_order: 'asc' } } }
        });
        res.json({
            success: true,
            data: serialize(banner)
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Update banner order (bulk)
 * PATCH /api/admin/banners/reorder
 */
export const reorderBanners = async (req, res, next) => {
    try {
        const { orders } = req.body; // [{ id: "1", sort_order: 0 }, { id: "2", sort_order: 1 }]
        if (!Array.isArray(orders)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Dữ liệu không hợp lệ' }
            });
        }
        await Promise.all(orders.map((item) => prisma.banners.update({
            where: { id: BigInt(item.id) },
            data: { sort_order: item.sort_order }
        })));
        res.json({
            success: true,
            message: 'Đã cập nhật thứ tự'
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Delete banner
 * DELETE /api/admin/banners/:id
 */
export const deleteBanner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const banner = await prisma.banners.findUnique({
            where: { id: BigInt(id) }
        });
        if (!banner) {
            return res.status(404).json({
                success: false,
                error: { message: 'Không tìm thấy banner' }
            });
        }
        await prisma.banners.delete({
            where: { id: BigInt(id) }
        });
        res.json({
            success: true,
            message: 'Đã xóa banner'
        });
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=banner.controller.js.map