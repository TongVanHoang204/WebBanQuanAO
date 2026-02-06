import { AIService } from '../src/services/ai.service.js';
import dotenv from 'dotenv';
dotenv.config();
async function testChatReply() {
    try {
        console.log('Testing AI Chat Reply Generation...');
        const mockPrompt = `
Dựa trên lịch sử chat này, hãy gợi ý câu trả lời tiếp theo:

Khách: Shop ơi, áo này có size L không ạ?
Support: Dạ shop chào bạn ạ. Áo này bên mình còn full size S, M, L bạn nha.
Khách: Mình cao 1m7 nặng 65kg thì mặc size nào vừa nhỉ?
        `;
        const reply = await AIService.generateContent(mockPrompt, 'chat_reply');
        console.log('\n--- Generated Reply ---');
        console.log(reply);
        console.log('-----------------------\n');
    }
    catch (error) {
        console.error('Test failed:', error);
    }
}
testChatReply();
//# sourceMappingURL=debug_ai_chat_reply.js.map