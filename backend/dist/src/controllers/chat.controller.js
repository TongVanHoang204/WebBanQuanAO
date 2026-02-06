import { ApiError } from '../middlewares/error.middleware.js';
import { AIService } from '../services/ai.service.js';
// AI Service for RAG (Retrieval Augmented Generation)
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemini-3-flash-preview:cloud';
// Serialize BigInt for JSON
const serializeProducts = (products) => {
    return JSON.parse(JSON.stringify(products, (key, value) => typeof value === 'bigint' ? value.toString() : value));
};
export const chat = async (req, res, next) => {
    try {
        const { message, history } = req.body;
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            throw new ApiError(400, 'Message is required');
        }
        // Generate AI response using Enhanced AI Service
        let aiResponse = { message: '', products: [], orders: [] };
        try {
            // Map history to ChatMessage format if needed, but AIService expects { role, content } which fits
            const formattedHistory = (history || []).map((h) => ({
                role: h.role,
                content: h.content
            }));
            const response = await AIService.generateCustomerResponse(formattedHistory, message, req.user);
            aiResponse = {
                message: response.message,
                products: response.products || [],
                orders: response.orders || []
            };
        }
        catch (error) {
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
    }
    catch (error) {
        next(error);
    }
};
// Health check for AI service
export const checkAIHealth = async (req, res, next) => {
    try {
        const response = await fetch(`${OLLAMA_URL}/api/tags`, {
            method: 'GET'
        });
        if (response.ok) {
            const data = await response.json();
            res.json({
                success: true,
                data: {
                    status: 'available',
                    models: data.models?.map((m) => m.name) || []
                }
            });
        }
        else {
            res.json({
                success: true,
                data: {
                    status: 'unavailable',
                    message: 'Ollama service is not responding'
                }
            });
        }
    }
    catch (error) {
        res.json({
            success: true,
            data: {
                status: 'unavailable',
                message: 'Cannot connect to Ollama service'
            }
        });
    }
};
//# sourceMappingURL=chat.controller.js.map