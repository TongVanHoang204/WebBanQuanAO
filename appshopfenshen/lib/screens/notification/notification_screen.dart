import 'package:flutter/material.dart';
import '../../services/notification_service.dart';
import '../../widgets/custom_pagination.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  final NotificationService _service = NotificationService();
  List<NotificationModel> _notifications = [];
  bool _isLoading = true;
  int _currentPage = 1;
  int _totalPages = 1;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({int? page}) async {
    setState(() => _isLoading = true);
    final targetPage = page ?? _currentPage;
    try {
      final res = await _service.getNotifications(page: targetPage);
      _notifications = res.data;
      _totalPages = res.totalPages;
      _currentPage = targetPage;
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _markAllRead() async {
    try {
      await _service.markAllAsRead();
      _load(page: _currentPage);
    } catch (_) {}
  }

  Future<void> _markRead(String id) async {
    try {
      await _service.markAsRead(id);
      _load(page: _currentPage);
    } catch (_) {}
  }

  Future<void> _delete(String id) async {
    try {
      await _service.deleteNotification(id);
      _load(page: _currentPage);
    } catch (_) {}
  }

  IconData _typeIcon(String type) {
    switch (type) {
      case 'order':
        return Icons.shopping_bag_outlined;
      case 'promotion':
        return Icons.local_offer_outlined;
      case 'inventory':
        return Icons.inventory_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color _typeColor(String type) {
    switch (type) {
      case 'order':
        return Colors.blue;
      case 'promotion':
        return Colors.orange;
      case 'inventory':
        return Colors.green;
      default:
        return const Color(0xFF7F19E6);
    }
  }

  String _timeAgo(DateTime? date) {
    if (date == null) return '';
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return 'Vừa xong';
    if (diff.inMinutes < 60) return '${diff.inMinutes} phút trước';
    if (diff.inHours < 24) return '${diff.inHours} giờ trước';
    if (diff.inDays < 7) return '${diff.inDays} ngày trước';
    return '${date.day}/${date.month}/${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F6F8),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF7F6F8),
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Color(0xFF140E1B), size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Thông báo',
          style: TextStyle(
            color: Color(0xFF140E1B),
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
        ),
        centerTitle: false,
        actions: [
          if (_notifications.any((n) => !n.isRead))
            TextButton(
              onPressed: _markAllRead,
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                foregroundColor: const Color(0xFF7F19E6),
              ),
              child: const Text(
                'Đọc tất cả',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF7F19E6)),
            )
          : _notifications.isEmpty
          ? _buildEmpty()
          : Column(
              children: [
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: () => _load(page: 1),
                    color: const Color(0xFF7F19E6),
                    child: ListView.separated(
                      padding: const EdgeInsets.only(left: 16, right: 16, top: 12, bottom: 16),
                      itemCount: _notifications.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (_, i) => _buildNotifCard(_notifications[i]),
                    ),
                  ),
                ),
                if (_totalPages > 1)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 24, top: 8),
                    child: CustomPagination(
                      currentPage: _currentPage,
                      totalPages: _totalPages,
                      onPageChanged: (page) => _load(page: page),
                    ),
                  ),
              ],
            ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF7F19E6).withOpacity(0.05),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.notifications_none_outlined,
              size: 48,
              color: Color(0xFF7F19E6),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Chưa có thông báo',
            style: TextStyle(
              color: Color(0xFF140E1B),
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tin tức, khuyến mãi và cập nhật\nđơn hàng sẽ hiển thị ở đây.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.grey.shade500,
              fontSize: 14,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotifCard(NotificationModel notif) {
    final bool isUnread = !notif.isRead;
    
    return Dismissible(
      key: Key(notif.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 24),
        decoration: BoxDecoration(
          color: Colors.red.shade400,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(Icons.delete_outline, color: Colors.white, size: 26),
      ),
      onDismissed: (_) => _delete(notif.id),
      child: GestureDetector(
        onTap: () {
          if (!notif.isRead) _markRead(notif.id);
        },
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isUnread ? const Color(0xFF7F19E6).withOpacity(0.02) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isUnread ? const Color(0xFF7F19E6).withValues(alpha: 0.15) : Colors.grey.shade100,
            ),
            boxShadow: [
              if (!isUnread)
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Icon Box
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: _typeColor(notif.type).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Icon(
                    _typeIcon(notif.type),
                    color: _typeColor(notif.type),
                    size: 22,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              // Content Area
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notif.title,
                            style: TextStyle(
                              color: const Color(0xFF140E1B),
                              fontSize: 15,
                              fontWeight: isUnread ? FontWeight.w700 : FontWeight.w600,
                              height: 1.3,
                            ),
                          ),
                        ),
                        if (isUnread) ...[
                          const SizedBox(width: 8),
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: Color(0xFF7F19E6),
                              shape: BoxShape.circle,
                            ),
                          ),
                        ]
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      notif.message,
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 13,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _timeAgo(notif.createdAt),
                      style: TextStyle(
                        color: Colors.grey.shade400,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
