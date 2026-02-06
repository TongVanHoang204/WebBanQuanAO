import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// Helper to serialize BigInt
const serialize = (data) => {
    return JSON.parse(JSON.stringify(data, (key, value) => typeof value === 'bigint' ? value.toString() : value));
};
/**
 * Get all reviews with filters
 * GET /api/admin/reviews
 */
export const getReviews = async (req, res, next) => {
    try {
        const { page = '1', limit = '20', status, product_id, rating, search } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const where = {};
        if (status && status !== 'all') {
            where.status = String(status);
        }
        if (product_id) {
            where.product_id = BigInt(String(product_id));
        }
        if (rating) {
            where.rating = parseInt(String(rating));
        }
        if (search) {
            const searchStr = String(search);
            where.OR = [
                { title: { contains: searchStr } },
                { content: { contains: searchStr } },
                { author_name: { contains: searchStr } }
            ];
        }
        const [reviews, total] = await Promise.all([
            prisma.product_reviews.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            product_images: { take: 1, select: { url: true } }
                        }
                    }
                }
            }),
            prisma.product_reviews.count({ where })
        ]);
        // Get status counts
        const statusCounts = await prisma.product_reviews.groupBy({
            by: ['status'],
            _count: { id: true }
        });
        const stats = {
            pending: 0,
            approved: 0,
            rejected: 0,
            hidden: 0
        };
        statusCounts.forEach(s => {
            stats[s.status] = s._count.id;
        });
        res.json({
            success: true,
            data: {
                reviews: serialize(reviews),
                stats,
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
 * Get review by ID
 * GET /api/admin/reviews/:id
 */
export const getReviewById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const review = await prisma.product_reviews.findUnique({
            where: { id: BigInt(id) },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        product_images: { take: 1, select: { url: true } }
                    }
                }
            }
        });
        if (!review) {
            return res.status(404).json({
                success: false,
                error: { message: 'Không tìm thấy đánh giá' }
            });
        }
        res.json({
            success: true,
            data: serialize(review)
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Update review status (approve/reject/hide)
 * PATCH /api/admin/reviews/:id/status
 */
export const updateReviewStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ['pending', 'approved', 'rejected', 'hidden'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Trạng thái không hợp lệ' }
            });
        }
        const review = await prisma.product_reviews.update({
            where: { id: BigInt(id) },
            data: { status }
        });
        res.json({
            success: true,
            data: serialize(review),
            message: `Đã cập nhật trạng thái thành "${status}"`
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Bulk update review status
 * PATCH /api/admin/reviews/bulk-status
 */
export const bulkUpdateStatus = async (req, res, next) => {
    try {
        const { ids, status } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                error: { message: 'Vui lòng chọn ít nhất 1 đánh giá' }
            });
        }
        const validStatuses = ['pending', 'approved', 'rejected', 'hidden'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Trạng thái không hợp lệ' }
            });
        }
        const result = await prisma.product_reviews.updateMany({
            where: { id: { in: ids.map((id) => BigInt(id)) } },
            data: { status }
        });
        res.json({
            success: true,
            message: `Đã cập nhật ${result.count} đánh giá`
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Delete review
 * DELETE /api/admin/reviews/:id
 */
export const deleteReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.product_reviews.delete({
            where: { id: BigInt(id) }
        });
        res.json({
            success: true,
            message: 'Đã xóa đánh giá'
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Bulk delete reviews
 * DELETE /api/admin/reviews/bulk
 */
export const bulkDeleteReviews = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                error: { message: 'Vui lòng chọn ít nhất 1 đánh giá' }
            });
        }
        const result = await prisma.product_reviews.deleteMany({
            where: { id: { in: ids.map((id) => BigInt(id)) } }
        });
        res.json({
            success: true,
            message: `Đã xóa ${result.count} đánh giá`
        });
    }
    catch (error) {
        next(error);
    }
};
// ... (previous functions)
/**
 * Get public reviews for a product
 * GET /api/reviews/product/:id
 */
export const getPublicReviews = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { page = '1', limit = '10', sort = 'newest' } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
        const orderBy = {};
        if (sort === 'highest')
            orderBy.rating = 'desc';
        else if (sort === 'lowest')
            orderBy.rating = 'asc';
        else
            orderBy.created_at = 'desc';
        const [reviews, total] = await Promise.all([
            prisma.product_reviews.findMany({
                where: {
                    product_id: BigInt(String(id)),
                    status: 'approved'
                },
                orderBy,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                select: {
                    id: true,
                    rating: true,
                    title: true,
                    content: true,
                    author_name: true,
                    created_at: true,
                    is_verified: true,
                    helpful_count: true
                }
            }),
            prisma.product_reviews.count({
                where: {
                    product_id: BigInt(String(id)),
                    status: 'approved'
                }
            })
        ]);
        // Calculate average rating
        const aggregations = await prisma.product_reviews.aggregate({
            where: {
                product_id: BigInt(String(id)),
                status: 'approved'
            },
            _avg: {
                rating: true
            },
            _count: {
                id: true
            }
        });
        const ratingDistribution = await prisma.product_reviews.groupBy({
            by: ['rating'],
            where: {
                product_id: BigInt(String(id)),
                status: 'approved'
            },
            _count: {
                id: true
            }
        });
        res.json({
            success: true,
            data: {
                reviews: serialize(reviews),
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                },
                stats: {
                    average: aggregations._avg.rating || 0,
                    total: aggregations._count.id || 0,
                    distribution: ratingDistribution.reduce((acc, curr) => {
                        acc[curr.rating] = curr._count.id;
                        return acc;
                    }, {})
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Create a review
 * POST /api/reviews
 */
export const createReview = async (req, res, next) => {
    try {
        const { product_id, rating, title, content, author_name } = req.body;
        const userId = req.user?.id; // Optional if we allow guest reviews, but better to enforce auth or require author_name
        if (!product_id || !rating || !content) {
            return res.status(400).json({
                success: false,
                error: { message: 'Vui lòng điền đầy đủ thông tin (sản phẩm, số sao, nội dung)' }
            });
        }
        // If user is logged in, check if they purchased the product to mark verified
        let is_verified = false;
        if (userId) {
            const purchase = await prisma.order_items.findFirst({
                where: {
                    product_id: BigInt(product_id),
                    order: {
                        user_id: userId,
                        status: 'completed'
                    }
                }
            });
            if (purchase)
                is_verified = true;
        }
        const review = await prisma.product_reviews.create({
            data: {
                product_id: BigInt(product_id),
                user_id: userId,
                rating: Number(rating),
                title,
                content,
                author_name: author_name || req.user?.full_name || 'Khách hàng',
                status: 'pending', // Default pending moderation
                is_verified
            }
        });
        res.status(201).json({
            success: true,
            data: serialize(review),
            message: 'Cảm ơn đánh giá của bạn! Đánh giá sẽ hiển thị sau khi được duyệt.'
        });
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=review.controller.js.map