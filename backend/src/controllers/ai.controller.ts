import { Request, Response } from 'express';
import { AIService } from '../services/ai.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import path from 'path';
import fs from 'fs';

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

    // Route request based on user role
    if (['admin', 'manager', 'staff'].includes(req.user.role)) {
      const response = await AIService.generateChatResponse(messages, req.user);
      return res.json({
        success: true,
        data: {
          message: response
        }
      });
    } else {
      if (messages.length === 0) {
        return res.status(400).json({ success: false, message: 'Messages array cannot be empty for customers.' });
      }
      const userMessage = messages[messages.length - 1].content;
      const history = messages.slice(0, messages.length - 1);
      
      const result = await AIService.generateCustomerResponse(history, userMessage, req.user);
      return res.json({
        success: true,
        data: {
          message: result.message,
          products: result.products
        }
      });
    }

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

export const visualSearch = async (req: AuthRequest, res: Response) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    // Extract filename from URL and resolve local path
    const fileName = imageUrl.split('/').pop() || '';
    const imagePath = path.join(process.cwd(), 'public', 'uploads', fileName);

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image file not found on server'
      });
    }

    const result = await AIService.visualSearch(imagePath);

    // Handle both AI path (returns plain array) and algorithmic fallback (returns { products, ai_powered })
    const isAlgorithmicFallback = result && !Array.isArray(result) && 'ai_powered' in result;

    res.json({
      success: true,
      data: isAlgorithmicFallback ? result.products : result,
      ai_powered: isAlgorithmicFallback ? false : true
    });
  } catch (error: any) {
    console.error('Visual Search Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};
