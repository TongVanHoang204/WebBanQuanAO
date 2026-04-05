import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../middlewares/error.middleware.js';

import { ACTIVE_AI_MODEL, ACTIVE_AI_PROVIDER, AIService } from '../../services/ai.service.js';

// AI Service for RAG (Retrieval Augmented Generation)
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// Serialize BigInt for JSON
const serializeProducts = (products: any[]) => {
  return JSON.parse(JSON.stringify(products, (key, value) =>
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
      // Map history to ChatMessage format if needed, but AIService expects { role, content } which fits
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

    // Return response with matched products
    res.json({
      success: true,
      data: {
        message: aiResponse.message,
        products: serializeProducts(aiResponse.products || [])
      }
    });

  } catch (error) {
    next(error);
  }
};

// Health check for AI service
export const checkAIHealth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (ACTIVE_AI_PROVIDER === 'gemini') {
      res.json({
        success: true,
        data: {
          status: 'available',
          provider: 'gemini',
          models: [ACTIVE_AI_MODEL]
        }
      });
      return;
    }

    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET'
    });

    if (response.ok) {
      const data = await response.json() as { models?: Array<{ name: string }> };
      res.json({
        success: true,
        data: {
          status: 'available',
          provider: 'ollama',
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
