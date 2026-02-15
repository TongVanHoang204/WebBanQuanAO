import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware.js';

const prisma = new PrismaClient();

// Helper to serialize BigInt
const serialize = (data: any) => {
  return JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

/**
 * Get all reviews with filters
 * GET /api/admin/reviews
 */
export const getReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', status, product_id, rating, search } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));

    const where: any = {};

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
      stats[s.status as keyof typeof stats] = s._count.id;
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
  } catch (error) {
    next(error);
  }
};

/**
 * Get review by ID
 * GET /api/admin/reviews/:id
 */
export const getReviewById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const review = await prisma.product_reviews.findUnique({
      where: { id: BigInt(id as string) },
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
  } catch (error) {
    next(error);
  }
};

/**
 * Update review status (approve/reject/hide)
 * PATCH /api/admin/reviews/:id/status
 */
export const updateReviewStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
      where: { id: BigInt(id as string) },
      data: { status }
    });

    res.json({
      success: true,
      data: serialize(review),
      message: `Đã cập nhật trạng thái thành "${status}"`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update review status
 * PATCH /api/admin/reviews/bulk-status
 */
export const bulkUpdateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
      where: { id: { in: ids.map((id: string) => BigInt(id)) } },
      data: { status }
    });

    res.json({
      success: true,
      message: `Đã cập nhật ${result.count} đánh giá`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete review
 * DELETE /api/admin/reviews/:id
 */
export const deleteReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.product_reviews.delete({
      where: { id: BigInt(id as string) }
    });

    res.json({
      success: true,
      message: 'Đã xóa đánh giá'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete reviews
 * DELETE /api/admin/reviews/bulk
 */
export const bulkDeleteReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Vui lòng chọn ít nhất 1 đánh giá' }
      });
    }

    const result = await prisma.product_reviews.deleteMany({
      where: { id: { in: ids.map((id: string) => BigInt(id)) } }
    });

    res.json({
      success: true,
      message: `Đã xóa ${result.count} đánh giá`
    });
  } catch (error) {
    next(error);
  }
};
// ... (previous functions)

/**
 * Get public reviews for a product
 * GET /api/reviews/product/:id
 */
export const getPublicReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '10', sort = 'newest' } = req.query;

    if (!req.user) {
      return res.json({
        success: true,
        data: {
          reviews: [],
          requiresLogin: true,
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          stats: { average: 0, total: 0, distribution: {} }
        },
        message: 'Vui lòng đăng nhập để xem đánh giá sản phẩm'
      });
    }
    
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));

    const orderBy: any = {};
    if (sort === 'highest') orderBy.rating = 'desc';
    else if (sort === 'lowest') orderBy.rating = 'asc';
    else orderBy.created_at = 'desc';

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
          distribution: ratingDistribution.reduce((acc: any, curr) => {
            acc[curr.rating] = curr._count.id;
            return acc;
          }, {})
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a review
 * POST /api/reviews
 */
export const createReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { product_id, rating, title, content } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Vui lòng đăng nhập để đánh giá' }
      });
    }

    if (!product_id || !rating || !content) {
      return res.status(400).json({
        success: false,
        error: { message: 'Vui lòng điền đầy đủ thông tin (sản phẩm, số sao, nội dung)' }
      });
    }

    // Strictly check if user purchased the product
    const purchase = await prisma.order_items.findFirst({
      where: {
        product_id: BigInt(product_id),
        order: {
          user_id: userId,
          status: 'completed'
        }
      }
    });

    if (!purchase) {
      return res.status(403).json({
        success: false,
        error: { message: 'Bạn chỉ có thể đánh giá sản phẩm đã mua và đơn hàng đã hoàn tất' }
      });
    }

    const review = await prisma.product_reviews.create({
      data: {
        product_id: BigInt(product_id),
        user_id: userId,
        rating: Number(rating),
        title,
        content,
        author_name: req.user?.full_name || 'Khách hàng',
        status: 'pending', // Default pending moderation
        is_verified: true
      }
    });

    res.status(201).json({
      success: true,
      data: serialize(review),
      message: 'Cảm ơn đánh giá của bạn! Đánh giá sẽ hiển thị sau khi được duyệt.'
    });
  } catch (error) {
    next(error);
  }
};
/**
 * Mark review as helpful
 * POST /api/reviews/:id/helpful
 */
export const markHelpful = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // TODO: Ideally we should track who liked to allow toggling.
    // For now, just increment.
    const review = await prisma.product_reviews.update({
      where: { id: BigInt(id as string) },
      data: {
        helpful_count: { increment: 1 }
      }
    });

    res.json({
      success: true,
      data: { helpful_count: review.helpful_count },
      message: 'Đã thích đánh giá'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unmark review as helpful (Unlike)
 * DELETE /api/reviews/:id/helpful
 */
export const unmarkHelpful = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const review = await prisma.product_reviews.update({
      where: { id: BigInt(id as string) },
      data: {
        helpful_count: { decrement: 1 }
      }
    });

    res.json({
      success: true,
      data: { helpful_count: review.helpful_count },
      message: 'Đã bỏ thích đánh giá'
    });
  } catch (error) {
    next(error);
  }
};
