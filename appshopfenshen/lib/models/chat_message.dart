class ChatMessage {
  final String id;
  final String role; // 'user' | 'assistant'
  final String content;
  final List<ChatProduct>? products;
  final DateTime timestamp;

  ChatMessage({
    required this.id,
    required this.role,
    required this.content,
    this.products,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id:
          json['id']?.toString() ??
          DateTime.now().millisecondsSinceEpoch.toString(),
      role: json['role'] ?? 'assistant',
      content: json['content'] ?? '',
      products: json['products'] != null
          ? (json['products'] as List)
                .map((p) => ChatProduct.fromJson(p))
                .toList()
          : null,
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class ChatProduct {
  final String id;
  final String name;
  final String slug;
  final String price;
  final String? image;
  final String? category;
  final int stockQty;

  ChatProduct({
    required this.id,
    required this.name,
    required this.slug,
    required this.price,
    this.image,
    this.category,
    this.stockQty = 0,
  });

  factory ChatProduct.fromJson(Map<String, dynamic> json) {
    return ChatProduct(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      price: json['price']?.toString() ?? '0',
      image: json['image'],
      category: json['category'],
      stockQty: json['stock_qty'] ?? 0,
    );
  }
}

// Support chat message (live agent)
class SupportMessage {
  final String id;
  final String conversationId;
  final String senderType; // 'user' | 'admin' | 'system'
  final String? senderId;
  final String senderName;
  final String content;
  final bool isRead;
  final DateTime createdAt;

  SupportMessage({
    required this.id,
    required this.conversationId,
    required this.senderType,
    this.senderId,
    required this.senderName,
    required this.content,
    this.isRead = false,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory SupportMessage.fromJson(Map<String, dynamic> json) {
    return SupportMessage(
      id: json['id']?.toString() ?? '',
      conversationId: json['conversationId']?.toString() ?? '',
      senderType: json['senderType'] ?? 'system',
      senderId: json['senderId']?.toString(),
      senderName: json['senderName'] ?? '',
      content: json['content'] ?? '',
      isRead: json['isRead'] ?? json['is_read'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class Conversation {
  final String id;
  final String? userId;
  final String? guestName;
  final String? guestEmail;
  final String status; // 'waiting' | 'active' | 'closed'
  final String? assignedTo;
  final String? lastMessage;
  final DateTime createdAt;

  Conversation({
    required this.id,
    this.userId,
    this.guestName,
    this.guestEmail,
    required this.status,
    this.assignedTo,
    this.lastMessage,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id']?.toString() ?? '',
      userId: json['userId']?.toString(),
      guestName: json['guestName'],
      guestEmail: json['guestEmail'],
      status: json['status'] ?? 'waiting',
      assignedTo: json['assignedTo']?.toString(),
      lastMessage: json['lastMessage'],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
