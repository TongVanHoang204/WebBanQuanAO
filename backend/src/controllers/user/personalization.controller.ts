import { Request, Response } from 'express';
import { trackProductView, getRecommendedProducts as getRecommendations } from '../../services/personalization.service.js';

export const trackView = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { product_id } = req.body;

    if (!userId || !product_id) {
      res.status(400).json({ success: false, message: 'Missing user or product id' });
      return;
    }

    await trackProductView(userId, BigInt(product_id));
    res.json({ success: true, message: 'View tracked' });
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getRecommendedProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const limit = parseInt(req.query.limit as string) || 8;

    if (!userId) {
      // If guest, fall back to general trending or new arrivals (mocked here by returning empty or calling generic product service)
      res.json({ success: true, data: [] });
      return;
    }

    const products = await getRecommendations(userId, limit);

    // Format products for frontend
    const formattedProducts = products.map((product: any) => ({
      ...product,
      id: product.id.toString(),
      category_id: product.category_id?.toString(),
      brand_id: product.brand_id?.toString(),
      base_price: Number(product.base_price),
      compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
      primary_image: product.product_images?.[0]?.image_url || null,
      product_variants: product.product_variants.map((v: any) => ({
        ...v,
        id: v.id.toString(),
        price: Number(v.price),
        compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null
      }))
    }));

    res.json({ success: true, data: formattedProducts });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
