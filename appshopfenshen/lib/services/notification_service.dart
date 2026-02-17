import '../config/api_config.dart';
import 'api_service.dart';

class NotificationModel {
  final String id;
  final String type;
  final String title;
  final String message;
  final bool isRead;
  final DateTime? createdAt;
  final Map<String, dynamic>? data;

  NotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    this.isRead = false,
    this.createdAt,
    this.data,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'].toString(),
      type: json['type'] ?? 'system',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      isRead: json['is_read'] == true || json['is_read'] == 1,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
      data: json['data'] is Map<String, dynamic> ? json['data'] : null,
    );
  }
}

class NotificationService {
  final ApiService _api = ApiService();

  Future<List<NotificationModel>> getNotifications({int page = 1}) async {
    final res = await _api.get(
      ApiConfig.notifications,
      queryParameters: {'page': page},
    );
    if (res.data['data'] != null) {
      final data = res.data['data'];
      if (data is List) {
        return data.map((n) => NotificationModel.fromJson(n)).toList();
      }
      if (data is Map && data['notifications'] != null) {
        return (data['notifications'] as List)
            .map((n) => NotificationModel.fromJson(n))
            .toList();
      }
    }
    return [];
  }

  Future<int> getUnreadCount() async {
    try {
      final res = await _api.get('${ApiConfig.notifications}/unread-count');
      if (res.data['data'] != null) {
        return res.data['data']['count'] ?? 0;
      }
    } catch (_) {}
    return 0;
  }

  Future<Map<String, dynamic>> markAsRead(String id) async {
    final res = await _api.patch('${ApiConfig.notifications}/$id/read');
    return res.data;
  }

  Future<Map<String, dynamic>> markAllAsRead() async {
    final res = await _api.patch('${ApiConfig.notifications}/read-all');
    return res.data;
  }

  Future<Map<String, dynamic>> deleteNotification(String id) async {
    final res = await _api.delete('${ApiConfig.notifications}/$id');
    return res.data;
  }
}
