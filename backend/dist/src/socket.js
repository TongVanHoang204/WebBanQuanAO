import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './server.js';
import { createOriginValidator, getAllowedOrigins } from './config/cors.js';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// Store active conversations in memory for quick access
const activeConversations = new Map();
const adminSockets = new Set(); // Track online admins
const onlineUserIds = new Set(); // Track online users
let io; // Singleton instance
export function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
}
export function initializeSocket(httpServer) {
    const allowedOrigins = getAllowedOrigins();
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: createOriginValidator(allowedOrigins),
            methods: ['GET', 'POST'],
            credentials: true
        }
    });
    // Authentication middleware
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        console.log(`[Socket] Auth middleware - Token provided: ${!!token}`);
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                console.log(`[Socket] Token decoded:`, decoded);
                // Handle both userId (from auth controller) and id (potential other sources)
                const userId = decoded.userId || decoded.id;
                if (!userId) {
                    throw new Error('Invalid token payload: missing userId');
                }
                const user = await prisma.users.findUnique({
                    where: { id: BigInt(userId) }
                });
                if (user) {
                    if (user.status === 'blocked') {
                        console.log(`[Socket] Blocked user blocked from connecting: ${user.username}`);
                        // We can't easily throw here to reject in a clean way for the client without custom error handling, 
                        // but next(err) works for connection middleware.
                        throw new Error('Account is blocked');
                    }
                    socket.userId = user.id;
                    socket.userRole = user.role;
                    socket.userName = user.full_name || user.username;
                    console.log(`[Socket] User authenticated: ${user.username} (${user.role})`);
                }
                else {
                    console.log(`[Socket] User not found for ID: ${decoded.id}`);
                }
            }
            catch (err) {
                console.log('[Socket] Auth failed:', err);
            }
        }
        next();
    });
    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}, UserID: ${socket.userId}, Role: ${socket.userRole}`);
        // Track admin connections
        if (socket.userRole === 'admin' || socket.userRole === 'staff') {
            adminSockets.add(socket.id);
            socket.join('admin-room'); // All admins join this room
            console.log(`[Socket] Admin ${socket.userName} joined admin-room automatically`);
        }
        // Every authenticated user joins their own private room for targeted notifications
        if (socket.userId) {
            const userRoom = `user-${socket.userId}`;
            socket.join(userRoom);
            console.log(`[Socket] User ${socket.userName} joined private room: ${userRoom}`);
            // Track online status for users
            if (socket.userRole !== 'admin' && socket.userRole !== 'staff') {
                const uid = socket.userId.toString();
                onlineUserIds.add(uid);
                io.to('admin-room').emit('online-users-update', Array.from(onlineUserIds));
            }
        }
        // Explicit admin room join (fallback for when role isn't detected on initial connection)
        socket.on('join-admin-room', () => {
            if (socket.userRole === 'admin' || socket.userRole === 'staff') {
                adminSockets.add(socket.id);
                socket.join('admin-room');
                console.log(`Admin ${socket.userName} explicitly joined admin-room`);
                socket.emit('admin-room-joined', { success: true });
                // Send current online users to this admin immediately
                socket.emit('online-users-update', Array.from(onlineUserIds));
            }
            else {
                socket.emit('error', { message: 'Unauthorized - not admin' });
            }
        });
        // Check for active conversation on reconnect (restore session)
        socket.on('check-active-conversation', async (data) => {
            try {
                let conversation;
                // Priority 1: Check by User ID if logged in
                if (socket.userId) {
                    conversation = await prisma.conversations.findFirst({
                        where: {
                            user_id: socket.userId,
                            status: { in: ['waiting', 'active'] }
                        },
                        orderBy: { created_at: 'desc' }
                    });
                }
                // Priority 2: Check by provided Conversation ID (for guests)
                if (!conversation && data && data.conversationId) {
                    // Ensure it exists and is open
                    conversation = await prisma.conversations.findFirst({
                        where: {
                            id: BigInt(data.conversationId),
                            status: { in: ['waiting', 'active'] }
                        }
                    });
                    // Security update: In a real app we'd verify a guest token, 
                    // but for now we assume possession of ID is enough for guest recovery.
                    // However, if the conversation belongs to a registered user, we should NOT allow anonymous access.
                    if (conversation && conversation.user_id && conversation.user_id !== socket.userId) {
                        conversation = null; // Deny access if it belongs to someone else
                    }
                }
                if (conversation) {
                    const convId = conversation.id.toString();
                    socket.join(`conversation-${convId}`);
                    // Use existing participant tracking
                    if (!activeConversations.has(convId)) {
                        activeConversations.set(convId, { conversationId: convId, participants: new Set() });
                    }
                    activeConversations.get(convId).participants.add(socket.id);
                    console.log(`[Socket] Restoring session for ${socket.userName || 'Guest'} in conv ${convId}`);
                    // Restore state to frontend
                    socket.emit('support-started', {
                        conversationId: convId,
                        status: conversation.status
                    });
                    // Fetch and send history
                    const messages = await prisma.chat_messages.findMany({
                        where: { conversation_id: conversation.id },
                        orderBy: { created_at: 'asc' }
                    });
                    socket.emit('conversation-messages', {
                        conversationId: convId,
                        messages: messages.map((m) => ({
                            id: m.id.toString(),
                            conversationId: convId,
                            senderType: m.sender_type,
                            senderId: m.sender_id?.toString() || null,
                            senderName: m.sender_type === 'admin' ? 'Nhân viên hỗ trợ' : (m.sender_type === 'system' ? 'Hệ thống' : (conversation.guest_name || 'Khách')),
                            content: m.content,
                            createdAt: m.created_at
                        }))
                    });
                }
            }
            catch (err) {
                console.error('Error checking active conversation', err);
            }
        });
        // User starts a support conversation
        socket.on('start-support', async (data) => {
            try {
                // Create or find existing conversation
                let conversation = await prisma.conversations.findFirst({
                    where: {
                        user_id: socket.userId || null,
                        status: { not: 'closed' }
                    }
                });
                if (!conversation) {
                    conversation = await prisma.conversations.create({
                        data: {
                            user_id: socket.userId || null,
                            guest_name: socket.userName || data.guestName || null,
                            guest_email: data.guestEmail || null,
                            status: 'waiting'
                        }
                    });
                }
                const convId = conversation.id.toString();
                socket.join(`conversation-${convId}`);
                // Store in memory
                if (!activeConversations.has(convId)) {
                    activeConversations.set(convId, {
                        conversationId: convId,
                        participants: new Set()
                    });
                }
                activeConversations.get(convId).participants.add(socket.id);
                // Fetch user avatar if userId exists
                let avatarUrl = null;
                if (socket.userId) {
                    const user = await prisma.users.findUnique({
                        where: { id: socket.userId },
                        select: { avatar_url: true }
                    });
                    avatarUrl = user?.avatar_url || null;
                }
                // Notify admins about new conversation
                io.to('admin-room').emit('new-conversation', {
                    id: convId,
                    userId: socket.userId?.toString() || null,
                    userName: socket.userName || data.guestName || 'Khách',
                    status: conversation.status,
                    avatarUrl: avatarUrl,
                    createdAt: conversation.created_at
                });
                socket.emit('support-started', {
                    conversationId: convId,
                    status: conversation.status
                });
                console.log(`Support conversation started: ${convId}`);
            }
            catch (error) {
                console.error('Error starting support:', error);
                socket.emit('error', { message: 'Không thể bắt đầu cuộc hội thoại' });
            }
        });
        // User or Admin sends a message
        socket.on('send-message', async (data) => {
            try {
                const { conversationId, content } = data;
                const senderType = (socket.userRole === 'admin' || socket.userRole === 'staff') ? 'admin' : 'user';
                const message = await prisma.chat_messages.create({
                    data: {
                        conversation_id: BigInt(conversationId),
                        sender_type: senderType,
                        sender_id: socket.userId || null,
                        content: content
                    }
                });
                // Update conversation status
                if (senderType === 'admin') {
                    await prisma.conversations.update({
                        where: { id: BigInt(conversationId) },
                        data: {
                            status: 'active',
                            assigned_to: socket.userId || null,
                            updated_at: new Date()
                        }
                    });
                }
                else {
                    // User sent message -> Mark as waiting and update timestamp
                    await prisma.conversations.update({
                        where: { id: BigInt(conversationId) },
                        data: {
                            status: 'waiting',
                            updated_at: new Date()
                        }
                    });
                }
                const messageData = {
                    id: message.id.toString(),
                    conversationId: conversationId,
                    senderType: senderType,
                    senderId: socket.userId?.toString() || null,
                    senderName: socket.userName || (senderType === 'admin' ? 'Nhân viên hỗ trợ' : 'Khách hàng'),
                    content: content,
                    createdAt: message.created_at
                };
                // Broadcast to conversation room
                io.to(`conversation-${conversationId}`).emit('new-message', messageData);
                // Also notify admin room for new user messages
                if (senderType === 'user') {
                    io.to('admin-room').emit('new-message', messageData);
                }
                console.log(`Message sent in conversation ${conversationId}`);
            }
            catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Không thể gửi tin nhắn' });
            }
        });
        // Admin joins a conversation
        socket.on('join-conversation', async (data) => {
            try {
                const { conversationId } = data;
                socket.join(`conversation-${conversationId}`);
                // Mark as active and assign to this admin
                await prisma.conversations.update({
                    where: { id: BigInt(conversationId) },
                    data: {
                        status: 'active',
                        assigned_to: socket.userId || null
                    }
                });
                // Load chat history
                const messages = await prisma.chat_messages.findMany({
                    where: { conversation_id: BigInt(conversationId) },
                    orderBy: { created_at: 'asc' }
                });
                socket.emit('conversation-messages', {
                    conversationId,
                    messages: messages.map((m) => ({
                        id: m.id.toString(),
                        conversationId: conversationId,
                        senderType: m.sender_type,
                        senderId: m.sender_id?.toString() || null,
                        senderName: m.sender_type === 'admin' ? 'Nhân viên hỗ trợ' : 'Khách hàng',
                        content: m.content,
                        createdAt: m.created_at
                    }))
                });
                // Notify user that admin has joined (include conversationId)
                io.to(`conversation-${conversationId}`).emit('admin-joined', {
                    adminName: socket.userName || 'Nhân viên hỗ trợ',
                    conversationId: conversationId
                });
                console.log(`Admin ${socket.userName} joined conversation ${conversationId}`);
            }
            catch (error) {
                console.error('Error joining conversation:', error);
            }
        });
        // Close conversation
        socket.on('close-conversation', async (data) => {
            try {
                await prisma.conversations.update({
                    where: { id: BigInt(data.conversationId) },
                    data: {
                        status: 'closed',
                        closed_at: new Date()
                    }
                });
                io.to(`conversation-${data.conversationId}`).emit('conversation-closed', {
                    conversationId: data.conversationId
                });
                activeConversations.delete(data.conversationId);
                console.log(`Conversation ${data.conversationId} closed`);
            }
            catch (error) {
                console.error('Error closing conversation:', error);
            }
        });
        // Typing indicator
        socket.on('typing', (data) => {
            socket.to(`conversation-${data.conversationId}`).emit('user-typing', {
                senderType: (socket.userRole === 'admin' || socket.userRole === 'staff') ? 'admin' : 'user',
                senderName: socket.userName || 'Người dùng',
                isTyping: data.isTyping
            });
        });
        // Get waiting conversations (for admin dashboard)
        socket.on('get-conversations', async () => {
            if (socket.userRole !== 'admin' && socket.userRole !== 'staff') {
                socket.emit('error', { message: 'Unauthorized' });
                return;
            }
            try {
                const conversations = await prisma.conversations.findMany({
                    where: { status: { not: 'closed' } },
                    orderBy: { created_at: 'desc' },
                    include: {
                        user: {
                            select: {
                                avatar_url: true,
                                full_name: true,
                                email: true,
                                username: true
                            }
                        },
                        messages: {
                            orderBy: { created_at: 'desc' },
                            take: 1
                        }
                    }
                });
                socket.emit('conversations-list', {
                    conversations: conversations.map((c) => ({
                        id: c.id.toString(),
                        userId: c.user_id?.toString() || null,
                        guestName: c.guest_name || c.user?.full_name || c.user?.username,
                        guestEmail: c.guest_email || c.user?.email,
                        avatarUrl: c.user?.avatar_url || null,
                        status: c.status,
                        assignedTo: c.assigned_to?.toString() || null,
                        lastMessage: c.messages[0]?.content || null,
                        createdAt: c.created_at,
                        updatedAt: c.updated_at
                    }))
                });
            }
            catch (error) {
                console.error('Error getting conversations:', error);
            }
        });
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
            adminSockets.delete(socket.id);
            // Clean up from active conversations
            activeConversations.forEach((room, convId) => {
                room.participants.delete(socket.id);
            });
            // Update online status
            if (socket.userId && socket.userRole !== 'admin' && socket.userRole !== 'staff') {
                const uid = socket.userId.toString();
                // Check if any other socket exists for this user (using room size)
                // Note: socket is not yet fully removed from rooms at this point in 'disconnecting', 
                // but in 'disconnect', it is already removed from rooms? 
                // Actually in 'disconnect' event, socket leaves rooms automatically.
                // We can check if the room still exists/has members.
                const userRoom = io.sockets.adapter.rooms.get(`user-${uid}`);
                if (!userRoom || userRoom.size === 0) {
                    if (onlineUserIds.has(uid)) {
                        onlineUserIds.delete(uid);
                        io.to('admin-room').emit('online-users-update', Array.from(onlineUserIds));
                    }
                }
            }
        });
    });
    // Check if any admin is online
    io.on('admin-status-check', () => {
        return adminSockets.size > 0;
    });
    return io;
}
//# sourceMappingURL=socket.js.map