import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { logActivity } from '../../services/logger.service.js';

const prisma = new PrismaClient();

// Validation schemas
const createReviewSchema = z.object({
  product_id: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(255).optional(),
  content: z.string().max(2000).optional(),
  images: z.array(z.string().url()).optional()
});

export const getProductReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const productId = BigInt(req.params.id as string);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const currentUserId = req.user?.id;

    const reviewWhere: any = {
      product_id: productId,
      status: 'approved'
    };

    if (currentUserId) {
      reviewWhere.OR = [
        { status: 'approved' },
        { user_id: currentUserId, status: { in: ['pending', 'approved'] } }
      ];
      delete reviewWhere.status;
    }

    let reviews: any[] = [];
    let total = 0;

    try {
      [reviews, total] = await Promise.all([
        prisma.product_reviews.findMany({
          where: reviewWhere,
          include: {
            user: { select: { full_name: true, avatar_url: true } },
            review_images: { select: { image_url: true } }
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
        }),
        prisma.product_reviews.count({ where: reviewWhere })
      ]);
    } catch (queryError: any) {
      const msg = String(queryError?.message || '');
      const isMissingReviewImagesTable = queryError?.code === 'P2021' || msg.includes('review_images');
      if (!isMissingReviewImagesTable) {
        throw queryError;
      }

      [reviews, total] = await Promise.all([
        prisma.product_reviews.findMany({
          where: reviewWhere,
          include: {
            user: { select: { full_name: true, avatar_url: true } }
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
        }),
        prisma.product_reviews.count({ where: reviewWhere })
      ]);
    }

    // Calculate average rating and helpful statistics
    const stats = await prisma.product_reviews.aggregate({
      where: { product_id: productId, status: 'approved' },
      _avg: { rating: true },
      _count: { rating: true }
    });

    const formattedReviews = reviews.map(r => ({
      ...r,
      id: r.id.toString(),
      product_id: r.product_id.toString(),
      user_id: r.user_id?.toString() || null,
      user_name: r.user?.full_name || r.author_name || 'Khách',
      user_avatar: r.user?.avatar_url || null,
      images: (r.review_images || []).map((img: any) => img.image_url)
    }));

    res.json({
      success: true,
      data: {
        reviews: formattedReviews,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          average_rating: stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : 0,
          total_reviews: stats._count.rating
        }
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đánh giá:', error);
    const err = error as any;
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ',
      ...(process.env.NODE_ENV !== 'production' ? { error: err?.message || String(err) } : {})
    });
  }
};

export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = createReviewSchema.parse(req.body);
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    // Verify if the user bought this product
    const hasPurchased = await prisma.order_items.findFirst({
      where: {
        product_id: validatedData.product_id,
        order: {
          user_id: userId,
          status: 'completed'
        }
      }
    });

    // We can auto-approve reviews for verified buyers, and mark is_verified
    const isVerified = !!hasPurchased;
    const status = isVerified ? 'approved' : 'pending';

    // Check if user already reviewed
    const existingReview = await prisma.product_reviews.findFirst({
      where: { product_id: validatedData.product_id, user_id: userId }
    });

    if (existingReview) {
      res.status(400).json({ success: false, message: 'Bạn đã đánh giá sản phẩm này rồi' });
      return;
    }

    const hasImages = !!validatedData.images && validatedData.images.length > 0;

    // Create review through transaction to also award points
    let newReview: any;
    let pointsAwarded = hasImages ? 100 : 50;

    try {
      newReview = await prisma.$transaction(async (tx) => {
        const review = await tx.product_reviews.create({
          data: {
            product_id: validatedData.product_id,
            user_id: userId,
            rating: validatedData.rating,
            title: validatedData.title,
            content: validatedData.content,
            status: status,
            is_verified: isVerified,
            ...(hasImages ? {
              review_images: {
                create: validatedData.images!.map(url => ({ image_url: url }))
              }
            } : {})
          }
        });

        await tx.users.update({
          where: { id: userId },
          data: { reward_points: { increment: pointsAwarded } }
        });

        return review;
      });
    } catch (createError: any) {
      const msg = String(createError?.message || '');
      const isMissingReviewImagesTable = createError?.code === 'P2021' || msg.includes('review_images');
      if (!isMissingReviewImagesTable || !hasImages) {
        throw createError;
      }

      // Fallback: create review without images if review_images table is missing
      pointsAwarded = 50;
      newReview = await prisma.$transaction(async (tx) => {
        const review = await tx.product_reviews.create({
          data: {
            product_id: validatedData.product_id,
            user_id: userId,
            rating: validatedData.rating,
            title: validatedData.title,
            content: validatedData.content,
            status: status,
            is_verified: isVerified
          }
        });

        await tx.users.update({
          where: { id: userId },
          data: { reward_points: { increment: pointsAwarded } }
        });

        return review;
      });
    }

    await logActivity({
      user_id: BigInt(userId),
      action: 'Đánh giá sản phẩm',
      entity_type: 'review',
      entity_id: String(newReview.id),
      details: { product_id: validatedData.product_id, rating: validatedData.rating },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Gửi đánh giá thành công',
      data: {
        id: newReview.id.toString(),
        status: newReview.status,
        points_awarded: pointsAwarded
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors: error.errors });
      return;
    }
    console.error('Lỗi khi tạo đánh giá:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
  }
};

export const updateReviewStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const reviewId = BigInt(req.params.id as string);
    const { status } = req.body; // 'approved', 'rejected', 'hidden'

    if (!['approved', 'rejected', 'hidden'].includes(status)) {
      res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
      return;
    }

    const review = await prisma.product_reviews.update({
      where: { id: reviewId },
      data: { status }
    });

    res.json({
      success: true,
      message: 'Cập nhật trạng thái đánh giá thành công',
      data: { id: review.id.toString(), status: review.status }
    });

    await logActivity({
      user_id: BigInt((req as any).user?.id || 0),
      action: 'Duyệt/Ẩn đánh giá',
      entity_type: 'review',
      entity_id: String(reviewId),
      details: { status },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái đánh giá:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
  }
};

export const getAdminReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string | undefined)?.trim();
    const status = req.query.status as 'pending' | 'approved' | 'rejected' | 'hidden' | undefined;
    const rating = req.query.rating ? Number(req.query.rating) : undefined;

    const where: any = {};

    if (status && ['pending', 'approved', 'rejected', 'hidden'].includes(status)) {
      where.status = status;
    }

    if (rating && !Number.isNaN(rating)) {
      where.rating = rating;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { author_name: { contains: search } },
        { product: { name: { contains: search } } }
      ];
    }

    const [reviews, total, statusGroups] = await Promise.all([
      prisma.product_reviews.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              product_images: { select: { url: true }, take: 1 }
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.product_reviews.count({ where }),
      prisma.product_reviews.groupBy({ by: ['status'], _count: { _all: true } })
    ]);

    const stats = { pending: 0, approved: 0, rejected: 0, hidden: 0 };
    for (const group of statusGroups) {
      const key = group.status as keyof typeof stats;
      if (key in stats) stats[key] = group._count._all;
    }

    res.json({
      success: true,
      data: {
        reviews: reviews.map((r) => ({
          ...r,
          id: r.id.toString(),
          product_id: r.product_id.toString(),
          user_id: r.user_id?.toString() || null,
          product: r.product
            ? {
                ...r.product,
                id: r.product.id.toString()
              }
            : null
        })),
        stats,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đánh giá admin:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
  }
};

export const bulkUpdateReviewStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids, status } = req.body as { ids?: string[]; status?: string };

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: 'Danh sách id không hợp lệ' });
      return;
    }

    if (!status || !['approved', 'rejected', 'hidden'].includes(status)) {
      res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
      return;
    }

    const bigintIds = ids.map((id) => BigInt(id));
    const result = await prisma.product_reviews.updateMany({
      where: { id: { in: bigintIds } },
      data: { status: status as any }
    });

    await logActivity({
      user_id: BigInt((req as any).user?.id || 0),
      action: 'Duyệt/Ẩn hàng loạt đánh giá',
      entity_type: 'review',
      entity_id: 'bulk',
      details: { count: result.count, status },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ success: true, message: `Đã cập nhật ${result.count} đánh giá` });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái hàng loạt:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
  }
};

export const bulkDeleteReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body as { ids?: string[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: 'Danh sách id không hợp lệ' });
      return;
    }

    const bigintIds = ids.map((id) => BigInt(id));
    const result = await prisma.product_reviews.deleteMany({
      where: { id: { in: bigintIds } }
    });

    await logActivity({
      user_id: BigInt((req as any).user?.id || 0),
      action: 'Xóa hàng loạt đánh giá',
      entity_type: 'review',
      entity_id: 'bulk',
      details: { count: result.count },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ success: true, message: `Đã xóa ${result.count} đánh giá` });
  } catch (error) {
    console.error('Lỗi khi xóa đánh giá hàng loạt:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
  }
};

export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const reviewId = BigInt(req.params.id as string);
    await prisma.product_reviews.delete({ where: { id: reviewId } });

    await logActivity({
      user_id: BigInt((req as any).user?.id || 0),
      action: 'Xóa đánh giá',
      entity_type: 'review',
      entity_id: String(reviewId),
      details: { },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ success: true, message: 'Đã xóa đánh giá' });
  } catch (error) {
    console.error('Lỗi khi xóa đánh giá:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
  }
};
