import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server.js';
import { ApiError } from '../middlewares/error.middleware.js';

import { AIService } from '../services/ai.service.js';

// AI Service for RAG (Retrieval Augmented Generation)
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemini-3-flash-preview:cloud';

// Serialize BigInt for JSON
const serializeData = (data: any) => {
  return JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

export const chat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new ApiError(400, 'Message is required');
    }

    // Generate AI response using Enhanced AI Service
    let aiResponse: { message: string; products: any[]; orders: any[] } = { message: '', products: [], orders: [] };
    
    try {
      const formattedHistory = (history || []).map((h: any) => ({
        role: h.role,
        content: h.content
      }));

      const response = await AIService.generateCustomerResponse(formattedHistory, message, (req as any).user);
      
      aiResponse = {
          message: response.message,
          products: response.products || [],
          orders: response.orders || []
      };

    } catch (error) {
      console.error('AI Service Error:', error);
      aiResponse.message = 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.';
    }

    // Detect quick reply suggestions based on context
    const quickReplies = generateQuickReplies(message, aiResponse.message, !!(req as any).user);

    // Return response with matched products and quick replies
    res.json({
      success: true,
      data: {
        message: aiResponse.message,
        products: serializeData(aiResponse.products || []),
        orders: serializeData(aiResponse.orders || []),
        quickReplies
      }
    });

  } catch (error) {
    next(error);
  }
};

// Generate contextual quick reply suggestions
function generateQuickReplies(userMessage: string, aiResponse: string, isLoggedIn: boolean): string[] {
  const replies: string[] = [];
  const msg = userMessage.toLowerCase();
  const resp = aiResponse.toLowerCase();

  // After product search, suggest related actions
  if (resp.includes('sản phẩm') || resp.includes('tìm thấy')) {
    replies.push('Xem thêm sản phẩm tương tự');
    replies.push('Có mã giảm giá không?');
    if (isLoggedIn) replies.push('Thêm vào giỏ hàng');
  }
  // After order inquiry
  else if (resp.includes('đơn hàng') || resp.includes('order')) {
    replies.push('Theo dõi đơn hàng');
    replies.push('Chính sách đổi trả');
  }
  // After greeting
  else if (msg.includes('chào') || msg.includes('hello') || msg.includes('hi')) {
    replies.push('🆕 Hàng mới về');
    replies.push('🔥 Sản phẩm hot');
    replies.push('🎫 Mã giảm giá');
    if (isLoggedIn) replies.push('📦 Đơn hàng của tôi');
  }
  // After outfit/fashion advice 
  else if (msg.includes('mặc gì') || msg.includes('outfit') || msg.includes('phối')) {
    replies.push('Xem sản phẩm gợi ý');
    replies.push('Tư vấn thêm phong cách khác');
  }
  // After coupon inquiry
  else if (resp.includes('giảm giá') || resp.includes('coupon') || resp.includes('khuyến mãi')) {
    replies.push('Xem sản phẩm bán chạy');
    replies.push('Tìm theo ngân sách');
  }
  // Default suggestions
  else {
    replies.push('Tìm sản phẩm');
    if (isLoggedIn) replies.push('Đơn hàng của tôi');
    replies.push('Tư vấn thời trang');
  }

  return replies.slice(0, 4);
}

// Health check for AI service
export const checkAIHealth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET'
    });

    if (response.ok) {
      const data = await response.json() as { models?: Array<{ name: string }> };
      res.json({
        success: true,
        data: {
          status: 'available',
          models: data.models?.map((m) => m.name) || []
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          status: 'unavailable',
          message: 'Ollama service is not responding'
        }
      });
    }
  } catch (error) {
    res.json({
      success: true,
      data: {
        status: 'unavailable',
        message: 'Cannot connect to Ollama service'
      }
    });
  }
  
};
