import { Request, Response } from 'express';
import { AIService } from '../services/ai.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export const chatWithAI = async (req: AuthRequest, res: Response) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request. "messages" array is required.' 
      });
    }

    // Basic permission check - ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const response = await AIService.generateChatResponse(messages, req.user);

    res.json({
      success: true,
      data: {
        message: response
      }
    });

  } catch (error: any) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
};

export const generateContent = async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, type } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        message: 'Prompt is required.' 
      });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Only Admin/Staff/Manager can use generation
    if (!['admin', 'manager', 'staff'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    const content = await AIService.generateContent(prompt, type);

    res.json({
      success: true,
      data: {
        content: content
      }
    });

  } catch (error: any) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
};

// ==================== NEW AI ANALYSIS ENDPOINTS ====================

export const analyzeDashboard = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const result = await AIService.analyzeDashboard();
    res.json({ success: true, data: { insight: result } });
  } catch (error: any) {
    console.error('AI Dashboard Analysis Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi phân tích dashboard' });
  }
};

export const analyzeReviews = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { reviewIds } = req.body;
    const result = await AIService.analyzeReviews(reviewIds);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('AI Review Analysis Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi phân tích đánh giá' });
  }
};

export const analyzeAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { startDate, endDate } = req.body;
    const result = await AIService.analyzeAnalytics(startDate, endDate);
    res.json({ success: true, data: { narrative: result } });
  } catch (error: any) {
    console.error('AI Analytics Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi phân tích analytics' });
  }
};

export const suggestCoupon = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const result = await AIService.suggestCouponStrategy();
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('AI Coupon Suggestion Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi gợi ý coupon' });
  }
};

export const analyzeCustomers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const result = await AIService.analyzeCustomers();
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('AI Customer Analysis Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi phân tích khách hàng' });
  }
};

export const analyzeOrder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { orderId } = req.body;
    const result = await AIService.analyzeOrder(orderId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('AI Order Analysis Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi phân tích đơn hàng' });
  }
};

export const analyzeLogs = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { query } = req.body;
    const result = await AIService.analyzeLogs(query);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('AI Log Analysis Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi phân tích log' });
  }
};

export const generateBannerCopy = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { context } = req.body;
    const result = await AIService.generateBannerCopy(context);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('AI Banner Copy Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi tạo nội dung banner' });
  }
};

export const analyzeStaff = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const result = await AIService.analyzeStaffPerformance();
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('AI Staff Analysis Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi phân tích nhân viên' });
  }
};

export const generateProductContent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { name, category, brand, price } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Tên sản phẩm là bắt buộc' });
    const result = await AIService.generateProductContent(name, category, brand, price);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('AI Product Content Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi tạo nội dung sản phẩm' });
  }
};
