import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:markdown/markdown.dart' as md;
import '../../config/api_config.dart';
import '../../models/chat_message.dart';
import '../../services/chat_service.dart';

class AIChatScreen extends StatefulWidget {
  const AIChatScreen({super.key});

  @override
  State<AIChatScreen> createState() => _AIChatScreenState();
}

class _AIChatScreenState extends State<AIChatScreen> {
  final _chatService = ChatService();
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];
  bool _isLoading = false;

  final List<String> _suggestions = [
    'Gợi ý sản phẩm mới nhất',
    'Tư vấn size áo nam',
    'Có sản phẩm nào đang sale?',
    'Chính sách đổi trả',
  ];

  @override
  void initState() {
    super.initState();
    // Welcome message
    _messages.add(
      ChatMessage(
        id: 'welcome',
        role: 'assistant',
        content:
            'Xin chào! 👋 Tôi là trợ lý mua sắm AI của ShopFeshen. '
            'Tôi có thể giúp bạn tìm kiếm sản phẩm, tư vấn size, '
            'kiểm tra đơn hàng và nhiều hơn nữa. Hãy hỏi tôi bất cứ điều gì!',
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  List<Map<String, String>> get _history {
    return _messages
        .where((m) => m.id != 'welcome')
        .map((m) => {'role': m.role, 'content': m.content})
        .toList();
  }

  Future<void> _send([String? text]) async {
    final message = text ?? _controller.text.trim();
    if (message.isEmpty || _isLoading) return;

    _controller.clear();
    final userMsg = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      role: 'user',
      content: message,
    );
    setState(() {
      _messages.add(userMsg);
      _isLoading = true;
    });
    _scrollToBottom();

    try {
      final data = await _chatService.sendMessage(message, _history);
      final aiContent = data['message'] ?? 'Xin lỗi, tôi không thể trả lời.';
      List<ChatProduct>? products;
      if (data['products'] != null && data['products'] is List) {
        products = (data['products'] as List)
            .map((p) => ChatProduct.fromJson(p))
            .toList();
      }

      if (mounted) {
        setState(() {
          _messages.add(
            ChatMessage(
              id: '${DateTime.now().millisecondsSinceEpoch}_ai',
              role: 'assistant',
              content: aiContent,
              products: products,
            ),
          );
          _isLoading = false;
        });
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _messages.add(
            ChatMessage(
              id: '${DateTime.now().millisecondsSinceEpoch}_err',
              role: 'assistant',
              content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
            ),
          );
          _isLoading = false;
        });
      }
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F6F8),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF7F6F8),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF7F19E6).withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.smart_toy,
                color: Color(0xFF7F19E6),
                size: 20,
              ),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Trợ lý AI',
                  style: TextStyle(
                    color: const Color(0xFF140E1B),
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  'Luôn sẵn sàng hỗ trợ',
                  style: TextStyle(color: Colors.green, fontSize: 11),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(
              Icons.support_agent,
              color: Colors.white70,
              size: 22,
            ),
            tooltip: 'Hỗ trợ trực tuyến',
            onPressed: () => Navigator.of(context).pushNamed('/support-chat'),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              itemCount: _messages.length + (_isLoading ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _messages.length && _isLoading) {
                  return _buildTypingIndicator();
                }
                final msg = _messages[index];
                final isUser = msg.role == 'user';
                return _buildMessage(msg, isUser);
              },
            ),
          ),

          // Suggestions (only show at start)
          if (_messages.length <= 1)
            SizedBox(
              height: 42,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: _suggestions.length,
                itemBuilder: (_, i) => Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ActionChip(
                    label: Text(
                      _suggestions[i],
                      style: const TextStyle(fontSize: 12, color: const Color(0xFF140E1B)),
                    ),
                    backgroundColor: const Color(0xFFFFFFFF),
                    side: BorderSide(
                      color: const Color(0xFF7F19E6).withValues(alpha: 0.3),
                    ),
                    onPressed: () => _send(_suggestions[i]),
                  ),
                ),
              ),
            ),

          // Input
          Container(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFFFF),
              border: Border(
                top: BorderSide(color: Colors.grey.shade200),
              ),
            ),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      style: const TextStyle(color: const Color(0xFF140E1B), fontSize: 14),
                      maxLines: 4,
                      minLines: 1,
                      decoration: InputDecoration(
                        hintText: 'Hỏi tôi bất cứ điều gì...',
                        hintStyle: TextStyle(
                          color: Colors.grey.shade400,
                        ),
                        filled: true,
                        fillColor: const Color(0xFFF7F6F8),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 10,
                        ),
                      ),
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    decoration: const BoxDecoration(
                      color: Color(0xFF7F19E6),
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      icon: const Icon(
                        Icons.send,
                        color: const Color(0xFFF7F6F8),
                        size: 20,
                      ),
                      onPressed: _isLoading ? null : () => _send(),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessage(ChatMessage msg, bool isUser) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: isUser
            ? CrossAxisAlignment.end
            : CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: isUser
                ? MainAxisAlignment.end
                : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (!isUser) ...[
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF7F19E6).withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.smart_toy,
                    color: Color(0xFF7F19E6),
                    size: 16,
                  ),
                ),
                const SizedBox(width: 8),
              ],
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: isUser
                        ? const Color(0xFF7F19E6)
                        : const Color(0xFFFFFFFF),
                    border: isUser ? null : Border.all(color: Colors.grey.shade200),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(isUser ? 16 : 4),
                      bottomRight: Radius.circular(isUser ? 4 : 16),
                    ),
                  ),
                  child: MarkdownBody(
                    data: msg.content,
                    extensionSet: md.ExtensionSet.gitHubFlavored,
                    styleSheet: MarkdownStyleSheet(
                      p: TextStyle(
                        color: isUser ? const Color(0xFFF7F6F8) : const Color(0xFF140E1B),
                        fontSize: 14,
                        height: 1.5,
                      ),
                      strong: TextStyle(
                        color: isUser ? const Color(0xFFF7F6F8) : const Color(0xFF140E1B),
                        fontWeight: FontWeight.w800,
                      ),
                      em: TextStyle(
                        color: isUser ? const Color(0xFFF7F6F8) : const Color(0xFF140E1B),
                        fontStyle: FontStyle.italic,
                      ),
                      h1: TextStyle(
                        color: isUser ? const Color(0xFFF7F6F8) : const Color(0xFF140E1B),
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        height: 1.4,
                      ),
                      h2: TextStyle(
                        color: isUser ? const Color(0xFFF7F6F8) : const Color(0xFF140E1B),
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        height: 1.4,
                      ),
                      h3: TextStyle(
                        color: isUser ? const Color(0xFFF7F6F8) : const Color(0xFF140E1B),
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        height: 1.4,
                      ),
                      h4: TextStyle(
                        color: isUser ? const Color(0xFFF7F6F8) : const Color(0xFF140E1B),
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        height: 1.4,
                      ),
                      listBullet: TextStyle(
                        color: isUser ? const Color(0xFFF7F6F8) : const Color(0xFF140E1B),
                        fontSize: 14,
                        height: 1.5,
                      ),
                      blockquote: TextStyle(
                        color: isUser ? const Color(0xFFF7F6F8).withOpacity(0.8) : Colors.grey.shade700,
                        fontStyle: FontStyle.italic,
                        fontSize: 14,
                        height: 1.5,
                      ),
                      code: TextStyle(
                        color: isUser ? const Color(0xFFF7F6F8) : const Color(0xFF7F19E6),
                        backgroundColor: isUser ? Colors.white.withOpacity(0.2) : const Color(0xFF7F19E6).withOpacity(0.08),
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                      codeblockPadding: const EdgeInsets.all(8),
                      codeblockDecoration: BoxDecoration(
                        color: isUser ? Colors.white.withOpacity(0.1) : Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: isUser ? null : Border.all(color: Colors.grey.shade200),
                      ),
                      blockquotePadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      blockquoteDecoration: BoxDecoration(
                        border: Border(left: BorderSide(color: isUser ? Colors.white54 : const Color(0xFF7F19E6), width: 3)),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),

          // Product cards
          if (msg.products != null && msg.products!.isNotEmpty) ...[
            const SizedBox(height: 8),
            SizedBox(
              height: 160,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.only(left: 32),
                itemCount: msg.products!.length,
                itemBuilder: (_, i) => _buildProductCard(msg.products![i]),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildProductCard(ChatProduct product) {
    final imageUrl = product.image != null
        ? (product.image!.startsWith('http')
              ? product.image!
              : '${ApiConfig.baseUrl}${product.image}')
        : null;

    return GestureDetector(
      onTap: () => Navigator.of(
        context,
      ).pushNamed('/product-detail', arguments: product.slug),
      child: Container(
        width: 130,
        margin: const EdgeInsets.only(right: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFFFFFFF),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(12),
              ),
              child: imageUrl != null
                  ? CachedNetworkImage(
                      imageUrl: imageUrl,
                      height: 90,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(
                        height: 90,
                        color: Colors.white.withValues(alpha: 0.05),
                        child: const Icon(Icons.image, color: Colors.grey),
                      ),
                      errorWidget: (_, __, ___) => Container(
                        height: 90,
                        color: Colors.white.withValues(alpha: 0.05),
                        child: const Icon(
                          Icons.broken_image,
                          color: Colors.grey,
                        ),
                      ),
                    )
                  : Container(
                      height: 90,
                      color: Colors.white.withValues(alpha: 0.05),
                      child: const Icon(Icons.image, color: Colors.grey),
                    ),
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: const Color(0xFF140E1B),
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    product.price,
                    style: const TextStyle(
                      color: Color(0xFF7F19E6),
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: const Color(0xFF7F19E6).withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.smart_toy,
              color: Color(0xFF7F19E6),
              size: 16,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFFFF),
              border: Border.all(color: Colors.grey.shade200),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(3, (i) {
                return TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0, end: 1),
                  duration: Duration(milliseconds: 600 + i * 200),
                  builder: (_, v, child) => Opacity(
                    opacity: (v * 2 - 1).abs().clamp(0.3, 1.0),
                    child: child,
                  ),
                  child: Container(
                    width: 8,
                    height: 8,
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade500,
                      shape: BoxShape.circle,
                    ),
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}
