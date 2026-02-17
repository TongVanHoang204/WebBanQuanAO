import 'package:dio/dio.dart';
import '../config/api_config.dart';
import 'api_service.dart';

class ChatService {
  final Dio _dio = ApiService().dio;

  /// Send message to AI chatbot
  Future<Map<String, dynamic>> sendMessage(
    String message,
    List<Map<String, String>> history,
  ) async {
    try {
      final res = await _dio.post(
        ApiConfig.chatAI,
        data: {'message': message, 'history': history},
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
      final res = await _dio.get(ApiConfig.chatHealth);
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}
