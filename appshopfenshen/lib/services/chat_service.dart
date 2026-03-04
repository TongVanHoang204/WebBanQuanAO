import 'package:dio/dio.dart';
import '../config/api_config.dart';
import 'api_service.dart';

class ChatService {
  final Dio _dio = ApiService().dio;

  Future<Map<String, dynamic>> sendMessage(
    String message,
    List<Map<String, String>> history,
  ) async {
    try {
      final messages = List<Map<String, String>>.from(history)
        ..add({'role': 'user', 'content': message});

      final res = await _dio.post(
        '${ApiConfig.baseUrl}/api/v1/ai/chat',
        data: {'messages': messages},
      );

      if (res.statusCode == 200 && res.data['success'] == true) {
        return res.data['data'];
      }
      throw Exception(res.data['message'] ?? 'Lỗi khi gửi tin nhắn');
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['message'] ?? 'Không thể kết nối đến chatbot',
      );
    }
  }

  /// Check AI health
  Future<bool> checkHealth() async {
    try {
      final res = await _dio.get('${ApiConfig.baseUrl}/api/v1/ai/health');
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}
