import { AIService } from '../services/ai.service.js';
export const chatWithAI = async (req, res) => {
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
    }
    catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};
export const generateContent = async (req, res) => {
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
    }
    catch (error) {
        console.error('AI Generation Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};
//# sourceMappingURL=ai.controller.js.map