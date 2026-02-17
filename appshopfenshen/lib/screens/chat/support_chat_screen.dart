import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/chat_message.dart';
import '../../services/socket_service.dart';

class SupportChatScreen extends StatefulWidget {
  const SupportChatScreen({super.key});

  @override
  State<SupportChatScreen> createState() => _SupportChatScreenState();
}

class _SupportChatScreenState extends State<SupportChatScreen> {
  final _socketService = SocketService();
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final List<SupportMessage> _messages = [];
  final Set<String> _messageIds = {};

  bool _isConnected = false;
  bool _conversationStarted = false;
  bool _isAdminTyping = false;
  String? _adminName;
  String _status = 'waiting'; // waiting | active | closed

  late final List<StreamSubscription> _subscriptions;

  @override
  void initState() {
    super.initState();
    _subscriptions = [];
    _initSocket();
  }

  Future<void> _initSocket() async {
    await _socketService.connect();

    _subscriptions.add(
      _socketService.onConnectionChanged.listen((connected) {
        if (mounted) setState(() => _isConnected = connected);
      }),
    );

    _subscriptions.add(
      _socketService.onConversationStarted.listen((convId) {
        if (mounted) {
          setState(() {
            _conversationStarted = true;
            _status = 'waiting';
          });
          // System msg
          _addSystemMessage(
            'Cuộc hội thoại đã được tạo. Vui lòng chờ nhân viên hỗ trợ...',
          );
        }
      }),
    );

    _subscriptions.add(
      _socketService.onMessage.listen((msg) {
        if (mounted && !_messageIds.contains(msg.id)) {
          _messageIds.add(msg.id);
          setState(() => _messages.add(msg));
          _scrollToBottom();
        }
      }),
    );

    _subscriptions.add(
      _socketService.onAdminJoined.listen((name) {
        if (mounted) {
          setState(() {
            _adminName = name;
            _status = 'active';
          });
          _addSystemMessage('$name đã tham gia cuộc hội thoại');
        }
      }),
    );

    _subscriptions.add(
      _socketService.onConversationClosed.listen((_) {
        if (mounted) {
          setState(() => _status = 'closed');
          _addSystemMessage('Cuộc hội thoại đã kết thúc');
        }
      }),
    );

    _subscriptions.add(
      _socketService.onTyping.listen((data) {
        if (mounted && data['senderType'] == 'admin') {
          setState(() => _isAdminTyping = data['isTyping'] == true);
        }
      }),
    );

    setState(() => _isConnected = _socketService.isConnected);

    // If already has conversation, mark started
    if (_socketService.conversationId != null) {
      setState(() => _conversationStarted = true);
    }
  }

  void _addSystemMessage(String content) {
    final msg = SupportMessage(
      id: 'sys_${DateTime.now().millisecondsSinceEpoch}',
      conversationId: '',
      senderType: 'system',
      senderName: 'Hệ thống',
      content: content,
    );
    if (mounted) {
      setState(() => _messages.add(msg));
      _scrollToBottom();
    }
  }

  void _startConversation() {
    final auth = context.read<AuthProvider>();
    if (auth.isLoggedIn) {
      _socketService.startSupport();
    } else {
      final name = _nameController.text.trim();
      final email = _emailController.text.trim();
      if (name.isEmpty) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Vui lòng nhập tên')));
        return;
      }
      _socketService.startSupport(
        guestName: name,
        guestEmail: email.isNotEmpty ? email : null,
      );
    }
  }

  void _sendMessage() {
    final text = _controller.text.trim();
    if (text.isEmpty || _status == 'closed') return;

    _socketService.sendMessage(text);
    _controller.clear();
    _socketService.setTyping(false);
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
  void dispose() {
    for (final sub in _subscriptions) {
      sub.cancel();
    }
    _controller.dispose();
    _scrollController.dispose();
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.support_agent,
                color: Colors.green,
                size: 20,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _adminName ?? 'Hỗ trợ trực tuyến',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    _statusText,
                    style: TextStyle(color: _statusColor, fontSize: 11),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          if (_conversationStarted && _status != 'closed')
            IconButton(
              icon: const Icon(Icons.close, color: Colors.red, size: 22),
              tooltip: 'Kết thúc',
              onPressed: _confirmClose,
            ),
        ],
      ),
      body: Column(
        children: [
          if (!_isConnected)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(8),
              color: Colors.red.withValues(alpha: 0.15),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.wifi_off, color: Colors.red, size: 14),
                  SizedBox(width: 6),
                  Text(
                    'Mất kết nối...',
                    style: TextStyle(color: Colors.red, fontSize: 12),
                  ),
                ],
              ),
            ),

          Expanded(
            child: !_conversationStarted ? _buildStartForm() : _buildChat(),
          ),

          if (_conversationStarted && _status != 'closed') _buildInput(),
        ],
      ),
    );
  }

  String get _statusText {
    if (!_isConnected) return 'Đang kết nối...';
    switch (_status) {
      case 'waiting':
        return 'Đang chờ nhân viên...';
      case 'active':
        return _isAdminTyping ? 'Đang nhập...' : 'Đang hỗ trợ';
      case 'closed':
        return 'Đã kết thúc';
      default:
        return 'Trực tuyến';
    }
  }

  Color get _statusColor {
    switch (_status) {
      case 'waiting':
        return Colors.orange;
      case 'active':
        return Colors.green;
      case 'closed':
        return Colors.grey;
      default:
        return Colors.green;
    }
  }

  Widget _buildStartForm() {
    final auth = context.watch<AuthProvider>();

    if (auth.isLoggedIn) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.green.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.support_agent,
                  color: Colors.green,
                  size: 48,
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Hỗ trợ trực tuyến',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Nhân viên của chúng tôi sẵn sàng hỗ trợ bạn',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.5),
                  fontSize: 14,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: _isConnected ? _startConversation : null,
                  icon: const Icon(Icons.chat, size: 20),
                  label: const Text('Bắt đầu hội thoại'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFD4AF37),
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Guest form
    return SingleChildScrollView(
      padding: const EdgeInsets.all(32),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.support_agent,
              color: Colors.green,
              size: 48,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Hỗ trợ trực tuyến',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Vui lòng cung cấp thông tin để bắt đầu',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.5),
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _nameController,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(
              hintText: 'Tên của bạn *',
              prefixIcon: Icon(Icons.person_outline, color: Colors.grey),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _emailController,
            style: const TextStyle(color: Colors.white),
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(
              hintText: 'Email (tùy chọn)',
              prefixIcon: Icon(Icons.email_outlined, color: Colors.grey),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              onPressed: _isConnected ? _startConversation : null,
              icon: const Icon(Icons.chat, size: 20),
              label: const Text('Bắt đầu hội thoại'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFD4AF37),
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChat() {
    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      itemCount: _messages.length + (_isAdminTyping ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == _messages.length && _isAdminTyping) {
          return _buildTypingBubble();
        }
        final msg = _messages[index];
        if (msg.senderType == 'system') {
          return _buildSystemMessage(msg.content);
        }
        final isMe = msg.senderType == 'user';
        return _buildChatBubble(msg, isMe);
      },
    );
  }

  Widget _buildSystemMessage(String content) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            content,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.5),
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildChatBubble(SupportMessage msg, bool isMe) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: isMe
            ? MainAxisAlignment.end
            : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isMe) ...[
            CircleAvatar(
              radius: 14,
              backgroundColor: Colors.green.withValues(alpha: 0.2),
              child: const Icon(
                Icons.support_agent,
                color: Colors.green,
                size: 14,
              ),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: isMe
                  ? CrossAxisAlignment.end
                  : CrossAxisAlignment.start,
              children: [
                if (!isMe)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 2, left: 4),
                    child: Text(
                      msg.senderName,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.4),
                        fontSize: 11,
                      ),
                    ),
                  ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: isMe
                        ? const Color(0xFFD4AF37)
                        : const Color(0xFF1A1A1A),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(isMe ? 16 : 4),
                      bottomRight: Radius.circular(isMe ? 4 : 16),
                    ),
                  ),
                  child: Text(
                    msg.content,
                    style: TextStyle(
                      color: isMe ? Colors.black : Colors.white,
                      fontSize: 14,
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 2, left: 4, right: 4),
                  child: Text(
                    _formatTime(msg.createdAt),
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.25),
                      fontSize: 10,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypingBubble() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor: Colors.green.withValues(alpha: 0.2),
            child: const Icon(
              Icons.support_agent,
              color: Colors.green,
              size: 14,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(
                3,
                (i) => Container(
                  width: 6,
                  height: 6,
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.3),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInput() {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      decoration: BoxDecoration(
        color: const Color(0xFF0A0A0A),
        border: Border(
          top: BorderSide(color: Colors.white.withValues(alpha: 0.06)),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _controller,
                style: const TextStyle(color: Colors.white, fontSize: 14),
                maxLines: 4,
                minLines: 1,
                decoration: InputDecoration(
                  hintText: 'Nhập tin nhắn...',
                  hintStyle: TextStyle(
                    color: Colors.white.withValues(alpha: 0.3),
                  ),
                  filled: true,
                  fillColor: Colors.white.withValues(alpha: 0.06),
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
                onSubmitted: (_) => _sendMessage(),
                onChanged: (val) {
                  _socketService.setTyping(val.isNotEmpty);
                },
              ),
            ),
            const SizedBox(width: 8),
            Container(
              decoration: const BoxDecoration(
                color: Color(0xFFD4AF37),
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: const Icon(Icons.send, color: Colors.black, size: 20),
                onPressed: _sendMessage,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmClose() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text(
          'Kết thúc hội thoại',
          style: TextStyle(color: Colors.white),
        ),
        content: const Text(
          'Bạn có chắc muốn kết thúc cuộc hội thoại này?',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Hủy', style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Kết thúc', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      _socketService.closeConversation();
    }
  }

  String _formatTime(DateTime dt) {
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}
